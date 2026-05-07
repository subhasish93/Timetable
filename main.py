from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from sqlalchemy import and_, or_
from fastapi.middleware.cors import CORSMiddleware
import secrets
import string

from auth import get_current_user, get_current_admin, get_current_super_admin
from db import SessionLocal
from models import (
    Base, Organisation, Department, Course, AcademicTerm,
    Subject, Section, Batch, Faculty, FacultyAssignment,
    Room, TimetableSlot, User, TermType, SubjectType, DayOfWeek, UserRole
)
from schemas import (
    OrganisationCreate, OrganisationUpdate, OrganisationResponse,
    DepartmentCreate, DepartmentUpdate, DepartmentResponse,
    CourseCreate, CourseUpdate, CourseResponse,
    AcademicTermCreate, AcademicTermUpdate, AcademicTermResponse,
    SubjectCreate, SubjectUpdate, SubjectResponse,
    SectionCreate, SectionUpdate, SectionResponse,
    BatchCreate, BatchUpdate, BatchResponse,
    FacultyCreate, FacultyUpdate, FacultyResponse,
    FacultyAssignmentCreate, FacultyAssignmentResponse,
    RoomCreate, RoomUpdate, RoomResponse,
    TimetableSlotCreate, TimetableSlotUpdate, TimetableSlotResponse,
    TimetableSlotWithDetails,
    UserCreate, LoginRequest, TokenResponse
)

app = FastAPI(title="Class Timetable API Service")

app.add_middleware(
    CORSMiddleware,
    #allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def generate_code(base_name: str, db: Session, model_class, field_name: str = "code") -> str:
    words = base_name.split()
    if len(words) == 1:
        base = words[0][:4].upper()
    else:
        base = "".join(word[0] for word in words[:-1]) + words[-1][0].upper()
    base = base.upper()
    code = base
    counter = 1
    while db.query(model_class).filter(getattr(model_class, field_name) == code).first():
        code = f"{base}{counter}"
        counter += 1
    return code


def generate_password(length=10):
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))


def get_subject_department_id(db: Session, subject_id: int) -> int:
    subject = db.query(Subject).join(AcademicTerm).join(Course).filter(
        Subject.id == subject_id
    ).first()
    if subject and subject.academic_term and subject.academic_term.course:
        return subject.academic_term.course.department_id
    return None


def get_faculty_department_id(db: Session, faculty_id: int) -> int:
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if faculty:
        return faculty.department_id
    return None


def validate_faculty_department_match(db: Session, faculty_id: int, subject_id: int) -> None:
    faculty_dept_id = get_faculty_department_id(db, faculty_id)
    subject_dept_id = get_subject_department_id(db, subject_id)
    
    if faculty_dept_id is None:
        raise HTTPException(404, "Faculty not found")
    if subject_dept_id is None:
        raise HTTPException(404, "Subject not found")
    if faculty_dept_id != subject_dept_id:
        raise HTTPException(
            400,
            f"Faculty can only teach subjects in their own department. "
            f"This faculty belongs to department ID {faculty_dept_id}, "
            f"but the subject belongs to department ID {subject_dept_id}."
        )


def validate_faculty_assignment_exists(db: Session, faculty_id: int, subject_id: int, section_id: int = None, batch_id: int = None) -> None:
    query = db.query(FacultyAssignment).filter(
        FacultyAssignment.faculty_id == faculty_id,
        FacultyAssignment.subject_id == subject_id,
        FacultyAssignment.is_active == True
    )
    if section_id:
        query = query.filter(FacultyAssignment.section_id == section_id)
    if batch_id:
        query = query.filter(FacultyAssignment.batch_id == batch_id)
    assignment = query.first()
    if not assignment:
        raise HTTPException(400, "No faculty assignment found. Assign the faculty to this subject first.")


def check_timetable_conflicts(db: Session, data: TimetableSlotCreate, exclude_slot_id: int = None) -> list:
    conflicts = []
    
    faculty_conflict = db.query(TimetableSlot).filter(
        TimetableSlot.faculty_id == data.faculty_id,
        TimetableSlot.date == data.date,
        TimetableSlot.start_time < data.end_time,
        TimetableSlot.end_time > data.start_time,
        TimetableSlot.is_active == True,
        exclude_slot_id is None or TimetableSlot.id != exclude_slot_id
    ).first()
    if faculty_conflict:
        conflicts.append({"type": "faculty", "message": "Faculty already has a class at this time"})
    
    room_conflict = db.query(TimetableSlot).filter(
        TimetableSlot.room_id == data.room_id,
        TimetableSlot.date == data.date,
        TimetableSlot.start_time < data.end_time,
        TimetableSlot.end_time > data.start_time,
        TimetableSlot.is_active == True,
        exclude_slot_id is None or TimetableSlot.id != exclude_slot_id
    ).first()
    if room_conflict:
        conflicts.append({"type": "room", "message": "Room is already occupied at this time"})
    
    if data.section_id:
        section_conflict = db.query(TimetableSlot).filter(
            TimetableSlot.section_id == data.section_id,
            TimetableSlot.date == data.date,
            TimetableSlot.start_time < data.end_time,
            TimetableSlot.end_time > data.start_time,
            TimetableSlot.is_active == True,
            exclude_slot_id is None or TimetableSlot.id != exclude_slot_id
        ).first()
        if section_conflict:
            conflicts.append({"type": "section", "message": "Section already has a class at this time"})
    
    if data.batch_id:
        batch_conflict = db.query(TimetableSlot).filter(
            TimetableSlot.batch_id == data.batch_id,
            TimetableSlot.date == data.date,
            TimetableSlot.start_time < data.end_time,
            TimetableSlot.end_time > data.start_time,
            TimetableSlot.is_active == True,
            exclude_slot_id is None or TimetableSlot.id != exclude_slot_id
        ).first()
        if batch_conflict:
            conflicts.append({"type": "batch", "message": "Batch already has a class at this time"})
    
    return conflicts


def check_faculty_hours(db: Session, faculty_id: int, new_slot_hours: float) -> tuple[bool, str]:
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        return False, "Faculty not found"
    
    from datetime import time
    from sqlalchemy import extract
    
    slots = db.query(TimetableSlot).filter(
        TimetableSlot.faculty_id == faculty_id,
        TimetableSlot.is_active == True
    ).all()
    
    total_minutes = sum(
        (slot.end_time.hour * 60 + slot.end_time.minute) - 
        (slot.start_time.hour * 60 + slot.start_time.minute)
        for slot in slots
    )
    
    if total_minutes + (new_slot_hours * 60) > faculty.max_weekly_hours * 60:
        return False, f"Faculty would exceed max weekly hours ({faculty.max_weekly_hours}h)"
    
    return True, "OK"


# =========================
# HEALTH CHECK
# =========================
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Class Timetable API"}


# =========================
# AUTH
# =========================
@app.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    from auth import verify_password
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User is deactivated")
    
    from auth import create_access_token
    token = create_access_token({
        "user_id": user.id,
        "organisation_id": user.organisation_id,
        "role": user.role.value if hasattr(user.role, 'value') else user.role
    })
    return {"access_token": token, "token_type": "bearer"}


# =========================
# ORGANISATION
# =========================
@app.post("/organisations", response_model=OrganisationResponse, status_code=201)
def create_organisation(data: OrganisationCreate, db: Session = Depends(get_db)):
    existing = db.query(Organisation).filter(Organisation.name == data.name).first()
    if existing:
        raise HTTPException(400, "Organisation already exists")
    
    code = generate_code(data.name, db, Organisation)
    org = Organisation(name=data.name, code=code, address=data.address)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@app.get("/organisations", response_model=list[OrganisationResponse])
def list_organisations(db: Session = Depends(get_db)):
    return db.query(Organisation).filter(Organisation.is_active == True).all()


@app.get("/organisations/{org_id}", response_model=OrganisationResponse)
def get_organisation(org_id: int, db: Session = Depends(get_db)):
    org = db.query(Organisation).filter(Organisation.id == org_id).first()
    if not org:
        raise HTTPException(404, "Organisation not found")
    return org


# =========================
# USER MANAGEMENT
# =========================
@app.post("/users", status_code=201)
def create_user(data: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    if current_user.role.value != "super_admin":
        raise HTTPException(403, "Only super admin can create users")
    
    existing = db.query(User).filter(User.username == data.username).first()
    if existing:
        raise HTTPException(400, "Username already exists")
    
    from auth import hash_password
    user = User(
        username=data.username,
        password=hash_password(data.password),
        email=data.email,
        role=UserRole(data.role),
        faculty_id=data.faculty_id,
        organisation_id=data.organisation_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "username": user.username, "role": user.role.value}


@app.post("/users/change-password", status_code=200)
def change_password(
    current_password: str,
    new_password: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from auth import verify_password, hash_password
    
    if not verify_password(current_password, current_user.password):
        raise HTTPException(400, "Current password is incorrect")
    
    current_user.password = hash_password(new_password)
    db.commit()
    return {"message": "Password changed successfully"}


# =========================
# SUPER ADMIN
# =========================
@app.post("/super-admin/organisations", response_model=OrganisationResponse, status_code=201)
def super_admin_create_organisation(data: OrganisationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_super_admin)):
    existing = db.query(Organisation).filter(Organisation.name == data.name).first()
    if existing:
        raise HTTPException(400, "Organisation already exists")
    
    code = generate_code(data.name, db, Organisation)
    org = Organisation(name=data.name, code=code, address=data.address)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@app.get("/super-admin/organisations", response_model=list[OrganisationResponse])
def super_admin_list_organisations(db: Session = Depends(get_db), current_user: User = Depends(get_current_super_admin)):
    return db.query(Organisation).filter(Organisation.is_active == True).all()


@app.get("/super-admin/organisations/{org_id}", response_model=OrganisationResponse)
def super_admin_get_organisation(org_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_super_admin)):
    org = db.query(Organisation).filter(Organisation.id == org_id).first()
    if not org:
        raise HTTPException(404, "Organisation not found")
    return org


@app.post("/super-admin/organisations/{org_id}/admin", status_code=201)
def super_admin_create_admin(
    org_id: int,
    username: str,
    email: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
):
    org = db.query(Organisation).filter(Organisation.id == org_id).first()
    if not org:
        raise HTTPException(404, "Organisation not found")
    
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise HTTPException(400, "Username already exists")
    
    import secrets
    import string
    generated_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
    
    from auth import hash_password
    user = User(
        username=username,
        password=hash_password(generated_password),
        email=email,
        role=UserRole.ADMIN,
        organisation_id=org_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role.value,
        "organisation_id": user.organisation_id,
        "organisation_name": org.name,
        "password": generated_password,
        "message": "Save this password! It will not be shown again."
    }


@app.get("/super-admin/users", status_code=200)
def super_admin_list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_super_admin)):
    users = db.query(User).filter(User.is_active == True).all()
    result = []
    for user in users:
        org = db.query(Organisation).filter(Organisation.id == user.organisation_id).first() if user.organisation_id else None
        result.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role.value,
            "organisation_id": user.organisation_id,
            "organisation_name": org.name if org else "System"
        })
    return result


@app.get("/super-admin/stats", status_code=200)
def super_admin_get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_super_admin)):
    total_orgs = db.query(Organisation).filter(Organisation.is_active == True).count()
    total_users = db.query(User).filter(User.is_active == True).count()
    total_admins = db.query(User).filter(User.role == UserRole.ADMIN, User.is_active == True).count()
    
    org_stats = []
    orgs = db.query(Organisation).filter(Organisation.is_active == True).all()
    for org in orgs:
        user_count = db.query(User).filter(User.organisation_id == org.id, User.is_active == True).count()
        dept_count = db.query(Department).filter(Department.organisation_id == org.id, Department.is_active == True).count()
        course_count = db.query(Course).join(Department).filter(Department.organisation_id == org.id, Course.is_active == True).count()
        org_stats.append({
            "organisation_id": org.id,
            "organisation_name": org.name,
            "users": user_count,
            "departments": dept_count,
            "courses": course_count
        })
    
    return {
        "total_organisations": total_orgs,
        "total_users": total_users,
        "total_admins": total_admins,
        "organisations": org_stats
    }


# =========================
# DEPARTMENT
# =========================

@app.post("/departments", response_model=DepartmentResponse, status_code=201)
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    dept = Department(
        name=data.name,
        short_name=data.short_name,
        organisation_id=current_user.organisation_id
    )

    db.add(dept)
    try:
        db.commit()
        db.refresh(dept)
        return dept

    except IntegrityError as e:
        db.rollback()

        error_msg = str(e.orig).lower()

        if "short_name" in error_msg:
            raise HTTPException(400, "Short name already exists in this organisation")
        elif "name" in error_msg:
            raise HTTPException(400, "Department name already exists in this organisation")
        else:
            raise HTTPException(400, "Duplicate department entry")


@app.get("/departments", response_model=list[DepartmentResponse])
def list_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return db.query(Department).filter(
        Department.organisation_id == current_user.organisation_id,
        Department.is_active == True
    ).all()


@app.get("/departments/{dept_id}", response_model=DepartmentResponse)
def get_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    dept = db.query(Department).filter(
        Department.id == dept_id,
        Department.organisation_id == current_user.organisation_id
    ).first()

    if not dept:
        raise HTTPException(404, "Department not found")

    return dept


@app.put("/departments/{dept_id}", response_model=DepartmentResponse)
def update_department(
    dept_id: int,
    data: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    dept = db.query(Department).filter(
        Department.id == dept_id,
        Department.organisation_id == current_user.organisation_id
    ).first()

    if not dept:
        raise HTTPException(404, "Department not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(dept, key, value)

    try:
        db.commit()
        db.refresh(dept)
        return dept

    except IntegrityError as e:
        db.rollback()

        error_msg = str(e.orig).lower()

        if "short_name" in error_msg:
            raise HTTPException(400, "Short name already exists")
        elif "name" in error_msg:
            raise HTTPException(400, "Department name already exists")
        else:
            raise HTTPException(400, "Duplicate department entry")


@app.delete("/departments/{dept_id}")
def delete_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    dept = db.query(Department).filter(
        Department.id == dept_id,
        Department.organisation_id == current_user.organisation_id
    ).first()

    if not dept:
        raise HTTPException(404, "Department not found")

    dept.is_active = False
    db.commit()

    return {"message": "Department deactivated"}


# =========================
# COURSE
# =========================
@app.post("/courses", response_model=CourseResponse, status_code=201)
def create_course(data: CourseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    dept = db.query(Department).filter(
        Department.id == data.department_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not dept:
        raise HTTPException(404, "Department not found")
    
    if data.code:
        existing = db.query(Course).filter(Course.code == data.code).first()
        if existing:
            raise HTTPException(400, "Course code already exists")
        course_code = data.code
    else:
        course_code = generate_code(data.name, db, Course)
    
    course = Course(
        name=data.name,
        code=course_code,
        duration_years=data.duration_years,
        term_type=TermType(data.term_type) if isinstance(data.term_type, str) else data.term_type,
        department_id=data.department_id
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@app.get("/courses", response_model=list[CourseResponse])
def list_courses(department_id: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    query = db.query(Course).join(Department).filter(
        Department.organisation_id == current_user.organisation_id,
        Course.is_active == True
    )
    if department_id:
        query = query.filter(Course.department_id == department_id)
    return query.all()


@app.get("/courses/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    course = db.query(Course).join(Department).filter(
        Course.id == course_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not course:
        raise HTTPException(404, "Course not found")
    return course


@app.put("/courses/{course_id}", response_model=CourseResponse)
def update_course(course_id: int, data: CourseUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    course = db.query(Course).join(Department).filter(
        Course.id == course_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not course:
        raise HTTPException(404, "Course not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        if key == "term_type" and value:
            value = TermType(value)
        setattr(course, key, value)
    
    db.commit()
    db.refresh(course)
    return course


@app.delete("/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    course = db.query(Course).join(Department).filter(
        Course.id == course_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not course:
        raise HTTPException(404, "Course not found")
    course.is_active = False
    db.commit()
    return {"message": "Course deactivated"}


# =========================
# ACADEMIC TERMS
# =========================
@app.post("/courses/{course_id}/terms", response_model=AcademicTermResponse, status_code=201)
def create_term(course_id: int, data: AcademicTermCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    course = db.query(Course).join(Department).filter(
        Course.id == course_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not course:
        raise HTTPException(404, "Course not found")
    
    term_type_str = course.term_type.value if hasattr(course.term_type, 'value') else str(course.term_type)
    max_terms = course.duration_years * (2 if "SEMESTER" in term_type_str else 1)
    if data.term_number > max_terms:
        raise HTTPException(400, f"Term number cannot exceed {max_terms} for this course")
    
    existing_term = db.query(AcademicTerm).filter(
        AcademicTerm.course_id == course_id,
        AcademicTerm.term_number == data.term_number,
        AcademicTerm.is_active == True
    ).first()
    if existing_term:
        raise HTTPException(400, f"Semester {data.term_number} already exists for this course")
    
    term = AcademicTerm(
        course_id=course_id,
        term_number=data.term_number,
        term_type=TermType(data.term_type) if isinstance(data.term_type, str) else data.term_type,
        start_date=data.start_date,
        end_date=data.end_date
    )
    db.add(term)
    db.commit()
    db.refresh(term)
    return term


@app.get("/courses/{course_id}/terms", response_model=list[AcademicTermResponse])
def list_terms(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    course = db.query(Course).join(Department).filter(
        Course.id == course_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not course:
        raise HTTPException(404, "Course not found")
    
    return db.query(AcademicTerm).filter(
        AcademicTerm.course_id == course_id,
        AcademicTerm.is_active == True
    ).order_by(AcademicTerm.term_number).all()


@app.get("/terms", response_model=list[AcademicTermResponse])
def list_all_terms(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    return db.query(AcademicTerm).join(Course).join(Department).filter(
        Department.organisation_id == current_user.organisation_id,
        AcademicTerm.is_active == True
    ).order_by(AcademicTerm.term_number).all()


@app.get("/terms/{term_id}", response_model=AcademicTermResponse)
def get_term(term_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    term = db.query(AcademicTerm).join(Course).join(Department).filter(
        AcademicTerm.id == term_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not term:
        raise HTTPException(404, "Term not found")
    return term


@app.put("/terms/{term_id}", response_model=AcademicTermResponse)
def update_term(term_id: int, data: AcademicTermUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    term = db.query(AcademicTerm).join(Course).join(Department).filter(
        AcademicTerm.id == term_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not term:
        raise HTTPException(404, "Term not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(term, key, value)
    
    db.commit()
    db.refresh(term)
    return term


@app.delete("/terms/{term_id}")
def delete_term(term_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    term = db.query(AcademicTerm).join(Course).join(Department).filter(
        AcademicTerm.id == term_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not term:
        raise HTTPException(404, "Term not found")
    
    has_timetable = db.query(TimetableSlot).filter(
        TimetableSlot.academic_term_id == term_id,
        TimetableSlot.is_active == True
    ).first()
    if has_timetable:
        raise HTTPException(400, "Cannot delete term with existing timetable")
    
    term.is_active = False
    db.commit()
    return {"message": "Term deactivated"}


# =========================
# SUBJECTS
# =========================

@app.post("/terms/{term_id}/subjects", response_model=SubjectResponse, status_code=201)
def create_subject(
    term_id: int,
    data: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    term = db.query(AcademicTerm).join(Course).join(Department).filter(
        AcademicTerm.id == term_id,
        Department.organisation_id == current_user.organisation_id
    ).first()

    if not term:
        raise HTTPException(404, "Term not found")

    # Prevent duplicate subject code in same term
    existing = db.query(Subject).filter(
        Subject.academic_term_id == term_id,
        Subject.code == data.code
    ).first()

    if existing:
        raise HTTPException(400, "Subject code already exists in this term")

    # ✅ MAIN FIX: include subject_short_name
    subject = Subject(
        academic_term_id=term_id,
        name=data.name,
        code=data.code,
        subject_short_name=data.subject_short_name or data.code,  # ✅ fallback safety
        subject_type=SubjectType(data.subject_type) if isinstance(data.subject_type, str) else data.subject_type,
        credits=data.credits,
        weekly_hours=data.weekly_hours
    )

    db.add(subject)
    db.commit()
    db.refresh(subject)

    return subject


@app.get("/terms/{term_id}/subjects", response_model=list[SubjectResponse])
def list_subjects(
    term_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    term = db.query(AcademicTerm).join(Course).join(Department).filter(
        AcademicTerm.id == term_id,
        Department.organisation_id == current_user.organisation_id
    ).first()

    if not term:
        raise HTTPException(404, "Term not found")

    subjects = db.query(Subject).filter(
        Subject.academic_term_id == term_id,
        Subject.is_active == True
    ).all()

    # ✅ Safety fix for old NULL data (prevents crash)
    for s in subjects:
        if not s.subject_short_name:
            s.subject_short_name = s.code

    return subjects


@app.get("/subjects/{subject_id}", response_model=SubjectResponse)
def get_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    subject = db.query(Subject).join(AcademicTerm).join(Course).join(Department).filter(
        Subject.id == subject_id,
        Department.organisation_id == current_user.organisation_id
    ).first()

    if not subject:
        raise HTTPException(404, "Subject not found")

    # ✅ Safety fallback
    if not subject.subject_short_name:
        subject.subject_short_name = subject.code

    return subject


@app.put("/subjects/{subject_id}", response_model=SubjectResponse)
def update_subject(
    subject_id: int,
    data: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    subject = db.query(Subject).join(AcademicTerm).join(Course).join(Department).filter(
        Subject.id == subject_id,
        Department.organisation_id == current_user.organisation_id
    ).first()

    if not subject:
        raise HTTPException(404, "Subject not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        if key == "subject_type" and value:
            value = SubjectType(value)

        # ✅ Ensure short name never becomes NULL
        if key == "subject_short_name":
            value = value or subject.code

        setattr(subject, key, value)

    db.commit()
    db.refresh(subject)

    return subject


@app.delete("/subjects/{subject_id}")
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    subject = db.query(Subject).join(AcademicTerm).join(Course).join(Department).filter(
        Subject.id == subject_id,
        Department.organisation_id == current_user.organisation_id
    ).first()

    if not subject:
        raise HTTPException(404, "Subject not found")

    has_timetable = db.query(TimetableSlot).filter(
        TimetableSlot.subject_id == subject_id,
        TimetableSlot.is_active == True
    ).first()

    if has_timetable:
        raise HTTPException(400, "Cannot delete subject used in timetable")

    subject.is_active = False
    db.commit()

    return {"message": "Subject deactivated"}


# =========================
# SECTIONS
# =========================
@app.post("/terms/{term_id}/sections", response_model=SectionResponse, status_code=201)
def create_section(term_id: int, data: SectionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    term = db.query(AcademicTerm).join(Course).join(Department).filter(
        AcademicTerm.id == term_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not term:
        raise HTTPException(404, "Term not found")
    
    section = Section(academic_term_id=term_id, name=data.name, max_capacity=data.max_capacity)
    db.add(section)
    try:
        db.commit()
        db.refresh(section)
        return section
    except IntegrityError:
        db.rollback()
        raise HTTPException(400, "Section already exists in this term")


@app.get("/terms/{term_id}/sections", response_model=list[SectionResponse])
def list_sections(term_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    term = db.query(AcademicTerm).join(Course).join(Department).filter(
        AcademicTerm.id == term_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not term:
        raise HTTPException(404, "Term not found")
    
    return db.query(Section).filter(
        Section.academic_term_id == term_id,
        Section.is_active == True
    ).all()


@app.put("/sections/{section_id}", response_model=SectionResponse)
def update_section(section_id: int, data: SectionUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    section = db.query(Section).join(AcademicTerm).join(Course).join(Department).filter(
        Section.id == section_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not section:
        raise HTTPException(404, "Section not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(section, key, value)
    
    db.commit()
    db.refresh(section)
    return section


@app.delete("/sections/{section_id}")
def delete_section(section_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    section = db.query(Section).join(AcademicTerm).join(Course).join(Department).filter(
        Section.id == section_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not section:
        raise HTTPException(404, "Section not found")
    
    section.is_active = False
    db.commit()
    return {"message": "Section deactivated"}


# =========================
# BATCHES
# =========================
@app.post("/terms/{term_id}/batches", response_model=BatchResponse, status_code=201)
def create_batch(term_id: int, data: BatchCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    term = db.query(AcademicTerm).join(Course).join(Department).filter(
        AcademicTerm.id == term_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not term:
        raise HTTPException(404, "Term not found")
    
    subject = db.query(Subject).filter(
        Subject.id == data.subject_id,
        Subject.academic_term_id == term_id
    ).first()
    if not subject:
        raise HTTPException(404, "Subject not found in this term")
    if subject.subject_type != SubjectType.ELECTIVE:
        raise HTTPException(400, "Batches can only be created for elective subjects")
    
    batch = Batch(
        academic_term_id=term_id,
        subject_id=data.subject_id,
        name=data.name,
        max_capacity=data.max_capacity
    )
    db.add(batch)
    try:
        db.commit()
        db.refresh(batch)
        return batch
    except IntegrityError:
        db.rollback()
        raise HTTPException(400, "Batch already exists for this subject")


@app.get("/terms/{term_id}/batches", response_model=list[BatchResponse])
def list_batches(term_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    term = db.query(AcademicTerm).join(Course).join(Department).filter(
        AcademicTerm.id == term_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not term:
        raise HTTPException(404, "Term not found")
    
    return db.query(Batch).filter(
        Batch.academic_term_id == term_id,
        Batch.is_active == True
    ).all()


@app.put("/batches/{batch_id}", response_model=BatchResponse)
def update_batch(batch_id: int, data: BatchUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    batch = db.query(Batch).join(AcademicTerm).join(Course).join(Department).filter(
        Batch.id == batch_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not batch:
        raise HTTPException(404, "Batch not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(batch, key, value)
    
    db.commit()
    db.refresh(batch)
    return batch


@app.delete("/batches/{batch_id}")
def delete_batch(batch_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    batch = db.query(Batch).join(AcademicTerm).join(Course).join(Department).filter(
        Batch.id == batch_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not batch:
        raise HTTPException(404, "Batch not found")
    
    batch.is_active = False
    db.commit()
    return {"message": "Batch deactivated"}


# =========================
# FACULTY
# =========================
@app.post("/faculties", response_model=FacultyResponse, status_code=201)
def create_faculty(data: FacultyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    dept = db.query(Department).filter(
        Department.id == data.department_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not dept:
        raise HTTPException(404, "Department not found")
    
    existing_code = db.query(Faculty).filter(Faculty.employee_code == data.employee_code).first()
    if existing_code:
        raise HTTPException(400, "Employee code already exists")
    
    if data.email:
        existing_email = db.query(Faculty).filter(Faculty.email == data.email).first()
        if existing_email:
            raise HTTPException(400, "Email already exists")
    
    faculty = Faculty(
        name=data.name,
        employee_code=data.employee_code,
        email=data.email,
        phone=data.phone,
        specialization=data.specialization,
        max_weekly_hours=data.max_weekly_hours,
        department_id=data.department_id
    )
    db.add(faculty)
    db.commit()
    db.refresh(faculty)
    return faculty


@app.get("/faculties", response_model=list[FacultyResponse])
def list_faculties(department_id: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    query = db.query(Faculty).join(Department).filter(
        Department.organisation_id == current_user.organisation_id,
        Faculty.is_active == True
    )
    if department_id:
        query = query.filter(Faculty.department_id == department_id)
    return query.all()


@app.get("/faculties/{faculty_id}", response_model=FacultyResponse)
def get_faculty(faculty_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    faculty = db.query(Faculty).join(Department).filter(
        Faculty.id == faculty_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not faculty:
        raise HTTPException(404, "Faculty not found")
    return faculty


@app.put("/faculties/{faculty_id}", response_model=FacultyResponse)
def update_faculty(faculty_id: int, data: FacultyUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    faculty = db.query(Faculty).join(Department).filter(
        Faculty.id == faculty_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not faculty:
        raise HTTPException(404, "Faculty not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(faculty, key, value)
    
    db.commit()
    db.refresh(faculty)
    return faculty


@app.delete("/faculties/{faculty_id}")
def delete_faculty(faculty_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    faculty = db.query(Faculty).join(Department).filter(
        Faculty.id == faculty_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not faculty:
        raise HTTPException(404, "Faculty not found")
    
    faculty.is_active = False
    db.commit()
    return {"message": "Faculty deactivated"}


# =========================
# FACULTY ASSIGNMENTS
# =========================
@app.post("/faculty-assignments", response_model=FacultyAssignmentResponse, status_code=201)
def create_faculty_assignment(data: FacultyAssignmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    faculty = db.query(Faculty).join(Department).filter(
        Faculty.id == data.faculty_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not faculty:
        raise HTTPException(404, "Faculty not found")
    
    subject = db.query(Subject).join(AcademicTerm).join(Course).join(Department).filter(
        Subject.id == data.subject_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not subject:
        raise HTTPException(404, "Subject not found")
    
    validate_faculty_department_match(db, data.faculty_id, data.subject_id)
    
    assignment = FacultyAssignment(
        faculty_id=data.faculty_id,
        subject_id=data.subject_id,
        section_id=data.section_id,
        batch_id=data.batch_id
    )
    db.add(assignment)
    try:
        db.commit()
        db.refresh(assignment)
        return assignment
    except IntegrityError:
        db.rollback()
        raise HTTPException(400, "Assignment already exists")


@app.get("/faculty-assignments", response_model=list[FacultyAssignmentResponse])
def list_faculty_assignments(
    faculty_id: int = None,
    subject_id: int = None,
    section_id: int = None,
    batch_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    query = db.query(FacultyAssignment).join(Faculty).join(Department).join(Subject).filter(
        Department.organisation_id == current_user.organisation_id,
        FacultyAssignment.is_active == True
    )
    
    if faculty_id:
        query = query.filter(FacultyAssignment.faculty_id == faculty_id)
    if subject_id:
        query = query.filter(FacultyAssignment.subject_id == subject_id)
    if section_id:
        query = query.filter(FacultyAssignment.section_id == section_id)
    if batch_id:
        query = query.filter(FacultyAssignment.batch_id == batch_id)
    
    return query.all()


@app.delete("/faculty-assignments/{assignment_id}")
def delete_faculty_assignment(assignment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    assignment = db.query(FacultyAssignment).join(Faculty).join(Department).filter(
        FacultyAssignment.id == assignment_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not assignment:
        raise HTTPException(404, "Assignment not found")
    
    assignment.is_active = False
    db.commit()
    return {"message": "Assignment removed"}


# =========================
# ROOMS
# =========================
@app.post("/rooms", response_model=RoomResponse, status_code=201)
def create_room(data: RoomCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    dept = db.query(Department).filter(
        Department.id == data.department_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not dept:
        raise HTTPException(404, "Department not found")
    
    room = Room(
        name=data.name,
        building=data.building,
        capacity=data.capacity,
        department_id=data.department_id
    )
    db.add(room)
    try:
        db.commit()
        db.refresh(room)
        return room
    except IntegrityError:
        db.rollback()
        raise HTTPException(400, "Room already exists in this department")


@app.get("/rooms", response_model=list[RoomResponse])
def list_rooms(department_id: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    query = db.query(Room).join(Department).filter(
        Department.organisation_id == current_user.organisation_id,
        Room.is_active == True
    )
    if department_id:
        query = query.filter(Room.department_id == department_id)
    return query.all()


@app.put("/rooms/{room_id}", response_model=RoomResponse)
def update_room(room_id: int, data: RoomUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    room = db.query(Room).join(Department).filter(
        Room.id == room_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not room:
        raise HTTPException(404, "Room not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(room, key, value)
    
    db.commit()
    db.refresh(room)
    return room


@app.delete("/rooms/{room_id}")
def delete_room(room_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    room = db.query(Room).join(Department).filter(
        Room.id == room_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not room:
        raise HTTPException(404, "Room not found")
    
    room.is_active = False
    db.commit()
    return {"message": "Room deactivated"}


# =========================
# TIMETABLE SLOTS
# =========================
@app.post("/timetable/slots", response_model=TimetableSlotResponse, status_code=201)
def create_timetable_slot(data: TimetableSlotCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    term = db.query(AcademicTerm).join(Course).join(Department).filter(
        AcademicTerm.id == data.academic_term_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not term:
        raise HTTPException(404, "Term not found")
    
    validate_faculty_department_match(db, data.faculty_id, data.subject_id)
    validate_faculty_assignment_exists(db, data.faculty_id, data.subject_id, data.section_id, data.batch_id)
    
    conflicts = check_timetable_conflicts(db, data)
    if conflicts:
        raise HTTPException(400, {"message": "Scheduling conflict", "conflicts": conflicts})
    
    slot = TimetableSlot(**data.model_dump())
    db.add(slot)
    try:
        db.commit()
        db.refresh(slot)
        return slot
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(400, f"Database constraint violation: {str(e.orig)}")


@app.get("/timetable/term/{term_id}", response_model=list[TimetableSlotWithDetails])
def get_timetable_by_term(term_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    term = db.query(AcademicTerm).join(Course).join(Department).filter(
        AcademicTerm.id == term_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not term:
        raise HTTPException(404, "Term not found")
    
    slots = db.query(TimetableSlot).filter(
        TimetableSlot.academic_term_id == term_id,
        TimetableSlot.is_active == True
    ).all()
    
    result = []
    for slot in slots:
        slot_dict = {
            "id": slot.id,
            "academic_term_id": slot.academic_term_id,
            "subject_id": slot.subject_id,
            "faculty_id": slot.faculty_id,
            "section_id": slot.section_id,
            "batch_id": slot.batch_id,
            "room_id": slot.room_id,
            "date": slot.date.isoformat() if slot.date else None,
            "start_time": slot.start_time,
            "end_time": slot.end_time,
            "is_active": slot.is_active,
            "subject_name": slot.subject.name if slot.subject else None,
            "faculty_name": slot.faculty.name if slot.faculty else None,
            "section_name": slot.section.name if slot.section else None,
            "batch_name": slot.batch.name if slot.batch else None,
            "room_name": slot.room.name if slot.room else None,
        }
        result.append(slot_dict)
    
    return result


@app.get("/timetable/section/{section_id}", response_model=list[TimetableSlotWithDetails])
def get_timetable_by_section(section_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    section = db.query(Section).join(AcademicTerm).join(Course).join(Department).filter(
        Section.id == section_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not section:
        raise HTTPException(404, "Section not found")
    
    slots = db.query(TimetableSlot).filter(
        TimetableSlot.section_id == section_id,
        TimetableSlot.is_active == True
    ).order_by(TimetableSlot.date, TimetableSlot.start_time).all()
    
    result = []
    for slot in slots:
        slot_dict = {
            "id": slot.id,
            "academic_term_id": slot.academic_term_id,
            "subject_id": slot.subject_id,
            "faculty_id": slot.faculty_id,
            "section_id": slot.section_id,
            "batch_id": slot.batch_id,
            "room_id": slot.room_id,
            "date": slot.date.isoformat() if slot.date else None,
            "start_time": slot.start_time,
            "end_time": slot.end_time,
            "is_active": slot.is_active,
            "subject_name": slot.subject.name if slot.subject else None,
            "faculty_name": slot.faculty.name if slot.faculty else None,
            "section_name": slot.section.name if slot.section else None,
            "batch_name": slot.batch.name if slot.batch else None,
            "room_name": slot.room.name if slot.room else None,
        }
        result.append(slot_dict)
    
    return result


@app.put("/timetable/slots/{slot_id}", response_model=TimetableSlotResponse)
def update_timetable_slot(slot_id: int, data: TimetableSlotUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    slot = db.query(TimetableSlot).join(AcademicTerm).join(Course).join(Department).filter(
        TimetableSlot.id == slot_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not slot:
        raise HTTPException(404, "Slot not found")
    
    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        merged_data = TimetableSlotCreate(
            academic_term_id=slot.academic_term_id,
            subject_id=update_data.get("subject_id", slot.subject_id),
            faculty_id=update_data.get("faculty_id", slot.faculty_id),
            section_id=update_data.get("section_id", slot.section_id),
            batch_id=update_data.get("batch_id", slot.batch_id),
            room_id=update_data.get("room_id", slot.room_id),
            date=update_data.get("date", slot.date),
            start_time=update_data.get("start_time", slot.start_time),
            end_time=update_data.get("end_time", slot.end_time),
        )
        validate_faculty_assignment_exists(db, merged_data.faculty_id, merged_data.subject_id, merged_data.section_id, merged_data.batch_id)
        conflicts = check_timetable_conflicts(db, merged_data, exclude_slot_id=slot_id)
        if conflicts:
            raise HTTPException(400, {"message": "Scheduling conflict", "conflicts": conflicts})
        
        for key, value in update_data.items():
            setattr(slot, key, value)
    
    db.commit()
    db.refresh(slot)
    return slot


@app.delete("/timetable/slots/{slot_id}")
def delete_timetable_slot(slot_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    slot = db.query(TimetableSlot).join(AcademicTerm).join(Course).join(Department).filter(
        TimetableSlot.id == slot_id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not slot:
        raise HTTPException(404, "Slot not found")
    
    slot.is_active = False
    db.commit()
    return {"message": "Slot removed"}


# =========================
# BULK TIMETABLE OPERATIONS
# =========================
@app.post("/timetable/bulk", status_code=201)
def create_bulk_timetable(slots_data: list[TimetableSlotCreate], db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    created_slots = []
    errors = []
    
    for idx, data in enumerate(slots_data):
        term = db.query(AcademicTerm).join(Course).join(Department).filter(
            AcademicTerm.id == data.academic_term_id,
            Department.organisation_id == current_user.organisation_id
        ).first()
        if not term:
            errors.append({"index": idx, "error": "Term not found"})
            continue
        
            try:
                validate_faculty_department_match(db, data.faculty_id, data.subject_id)
                validate_faculty_assignment_exists(db, data.faculty_id, data.subject_id, data.section_id, data.batch_id)
            except HTTPException as e:
                errors.append({"index": idx, "error": e.detail})
                continue
            
            conflicts = check_timetable_conflicts(db, data)
            if conflicts:
                errors.append({"index": idx, "error": "Conflict detected", "conflicts": conflicts})
                continue
            
            slot = TimetableSlot(**data.model_dump())
            db.add(slot)
            try:
                db.flush()
                created_slots.append(slot.id)
            except IntegrityError:
                db.rollback()
                errors.append({"index": idx, "error": "Database constraint violation"})
    
    db.commit()
    return {
        "created": len(created_slots),
        "slot_ids": created_slots,
        "errors": errors
    }


# =========================
# DASHBOARD / SUMMARY
# =========================
@app.get("/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    total_courses = db.query(Course).join(Department).filter(
        Department.organisation_id == current_user.organisation_id,
        Course.is_active == True
    ).count()
    
    total_terms = db.query(AcademicTerm).join(Course).join(Department).filter(
        Department.organisation_id == current_user.organisation_id,
        AcademicTerm.is_active == True
    ).count()
    
    total_subjects = db.query(Subject).join(AcademicTerm).join(Course).join(Department).filter(
        Department.organisation_id == current_user.organisation_id,
        Subject.is_active == True
    ).count()
    
    total_faculties = db.query(Faculty).join(Department).filter(
        Department.organisation_id == current_user.organisation_id,
        Faculty.is_active == True
    ).count()
    
    total_rooms = db.query(Room).join(Department).filter(
        Department.organisation_id == current_user.organisation_id,
        Room.is_active == True
    ).count()
    
    total_slots = db.query(TimetableSlot).join(AcademicTerm).join(Course).join(Department).filter(
        Department.organisation_id == current_user.organisation_id,
        TimetableSlot.is_active == True
    ).count()
    
    return {
        "courses": total_courses,
        "terms": total_terms,
        "subjects": total_subjects,
        "faculties": total_faculties,
        "rooms": total_rooms,
        "timetable_slots": total_slots
    }
