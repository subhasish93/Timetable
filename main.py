from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from fastapi.middleware.cors import CORSMiddleware
from pwdlib import PasswordHash
import secrets
from fastapi import HTTPException
from auth import verify_password, create_access_token, get_current_user, get_current_admin
import string

from db import SessionLocal, engine
from models import (
    Base, Course, TimeSlot, SubjectTeacher,
    Subject, Teacher, Timetable,
    Organisation, Department, User
)

from schemas import (
    TimetableCreate,
    OrganisationCreate, 
    DepartmentCreate, 
    CourseCreate, 
    SubjectCreate, 
    TeacherCreate, 
    SubjectTeacherCreate,
    LoginRequest
)

# Create tables
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="Timetable Management System")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ──────────────────────────────────────────────────────────────
# TIMETABLE ENDPOINTS 
# ──────────────────────────────────────────────────────────────

@app.get("/time-slots")
def get_slots(db: Session = Depends(get_db)):
    slots = db.query(TimeSlot).all()
    return [
        {
            "slot_id": s.slot_id,
            "day": s.day_of_week,
            "start": str(s.start_time),
            "end": str(s.end_time),
        }
        for s in slots
    ]


@app.get("/subject-teachers-full")
@app.get("/subject-teachers")
def get_subject_teachers(
    department_id: int = None,
    section: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    query = db.query(
        SubjectTeacher.id.label("subject_teacher_id"),
        Subject.name.label("subject_name"),
        Subject.subject_id,
        Teacher.name.label("teacher_name"),
        Teacher.teacher_id,
        Course.name.label("course_name"),
        Department.name.label("department_name"),
        Subject.section,
        Subject.semester
    ).select_from(SubjectTeacher).join(Subject).join(Course).join(Department).join(Teacher).filter(
        Department.organisation_id == current_user.organisation_id
    )
    
    if department_id:
        query = query.filter(Department.department_id == department_id)
    if section:
        query = query.filter(Subject.section == section)
    
    result = query.all()
    return [dict(r._mapping) for r in result]


@app.get("/subject-teachers-for-timetable")
def get_teachers_for_timetable(
    department_id: int = None,
    section: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Get subject-teacher assignments specifically for timetable creation"""
    query = db.query(
        SubjectTeacher.id.label("subject_teacher_id"),
        Subject.name.label("subject_name"),
        Subject.subject_id,
        Teacher.name.label("teacher_name"),
        Teacher.teacher_id,
        Course.name.label("course_name"),
        Department.name.label("department_name"),
        Subject.section,
        Subject.semester
    ).select_from(SubjectTeacher).join(Subject).join(Course).join(Department).join(Teacher, SubjectTeacher.teacher_id == Teacher.teacher_id).filter(
        Department.organisation_id == current_user.organisation_id
    )
    
    if department_id:
        query = query.filter(Department.department_id == department_id)
    if section:
        query = query.filter(Subject.section == section)
    
    result = query.all()
    return [dict(r._mapping) for r in result]


@app.get("/subject-teacher-assignments")
def get_subject_teacher_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    result = db.query(
        SubjectTeacher.id,
        Subject.name.label("subject_name"),
        Teacher.name.label("teacher_name"),
        Department.name.label("department_name"),
        Subject.section,
        Subject.semester
    ).select_from(SubjectTeacher).join(Subject).join(Teacher).join(Course).join(Department).filter(
        Department.organisation_id == current_user.organisation_id
    ).all()
    return [dict(r._mapping) for r in result]


@app.delete("/subject-teacher/{id}")
def delete_subject_teacher(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    assignment = db.query(SubjectTeacher).join(Subject).join(Course).join(Department).filter(
        SubjectTeacher.id == id,
        Department.organisation_id == current_user.organisation_id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(assignment)
    db.commit()
    return {"message": "Assignment deleted successfully"}


@app.post("/timetable")
def create_timetable(
    data: TimetableCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    timetable = Timetable(**data.dict(), organisation_id=current_user.organisation_id)
    try:
        db.add(timetable)
        db.commit()
        return {"message": "Timetable created successfully"}
    except IntegrityError as e:
        db.rollback()
        msg = str(e.orig)
        if "teacher_slot_unique" in msg:
            detail = "Teacher already busy at this time"
        elif "room_slot_unique" in msg:
            detail = "Room already occupied"
        elif "dept_section_slot_unique" in msg:
            detail = "This slot is already occupied for this section"
        else:
            detail = "Scheduling conflict detected"
        raise HTTPException(status_code=400, detail=detail)


@app.get("/timetable/department-section")
def get_timetable_by_dept_section(
    department_id: int,
    section: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    result = db.query(
        Timetable.timetable_id,
        Timetable.department_id,
        Timetable.section,
        Timetable.subject_teacher_id,
        Timetable.slot_id,
        Timetable.room_no,
        TimeSlot.day_of_week.label("day"),
        TimeSlot.start_time,
        TimeSlot.end_time,
        Subject.name.label("subject"),
        SubjectTeacher.id.label("subject_teacher_id"),
        Teacher.name.label("teacher"),
        Course.name.label("course_name")
    ).select_from(Timetable)\
     .join(TimeSlot, Timetable.slot_id == TimeSlot.slot_id)\
     .join(SubjectTeacher, Timetable.subject_teacher_id == SubjectTeacher.id)\
     .join(Subject, SubjectTeacher.subject_id == Subject.subject_id)\
     .join(Teacher, SubjectTeacher.teacher_id == Teacher.teacher_id)\
     .join(Course, Subject.course_id == Course.course_id)\
     .filter(Timetable.organisation_id == current_user.organisation_id)\
     .filter(Timetable.department_id == department_id)\
     .filter(Timetable.section == section)\
     .order_by(TimeSlot.day_of_week, TimeSlot.start_time)\
     .all()
    return [dict(r._mapping) for r in result]


@app.delete("/timetable/{timetable_id}")
def delete_timetable(
    timetable_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    entry = db.query(Timetable).filter(
        Timetable.timetable_id == timetable_id,
        Timetable.organisation_id == current_user.organisation_id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()
    return {"message": "Deleted successfully"}


@app.put("/timetable/{id}")
def update_timetable(
    id: int,
    data: TimetableCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    entry = db.query(Timetable).filter(
        Timetable.timetable_id == id,
        Timetable.organisation_id == current_user.organisation_id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(entry, key, value)

    db.commit()
    db.refresh(entry)
    return entry


# ──────────────────────────────────────────────────────────────
# MANAGEMENT / SETUP ENDPOINTS
# ──────────────────────────────────────────────────────────────

pwd_context = PasswordHash.recommended()

def generate_org_code(db, name):
    words = name.split()
    if len(words) == 1:
        base = words[0][:4].upper()
    else:
        base = "".join(word[0] for word in words[:-1]) + words[-1][0]

    base = base.upper()

    code = base
    counter = 1

    while db.query(Organisation).filter(Organisation.code == code).first():
        code = f"{base}{counter}"
        counter += 1

    return code

def generate_password(length=10):
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))


@app.post("/organisation", status_code=201)
def create_organisation(
    data: OrganisationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) 
):
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Only super admin can create organisation"
        )

    existing = db.query(Organisation).filter(
        Organisation.name == data.name
    ).first()

    if existing:
        raise HTTPException(400, "Organisation already exists")

    org_code = generate_org_code(db, data.name)

    org = Organisation(
        name=data.name,
        address=data.address,
        code=org_code
    )

    db.add(org)
    db.commit()
    db.refresh(org)

    raw_password = generate_password()
    hashed_password = pwd_context.hash(raw_password)

    admin_user = User(
        username=f"{org.code}_admin",
        password=hashed_password,
        role="admin",
        organisation_id=org.organisation_id
    )

    db.add(admin_user)
    db.commit()

    return {
        "message": "Organisation created successfully",
        "organisation_code": org.code,
        "admin_username": admin_user.username,
        "admin_password": raw_password
    }


@app.post("/department")
def create_department(
    department: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    dept = Department(
        name=department.name,
        sections=department.sections,
        organisation_id=current_user.organisation_id
    )

    db.add(dept)
    db.commit()
    db.refresh(dept)

    return dept

@app.get("/department")
def get_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    departments = db.query(Department).filter(
        Department.organisation_id == current_user.organisation_id
    ).all()

    return departments


@app.post("/course")
def create_course(
    course: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    if course.code:
        existing = db.query(Course).filter(Course.code == course.code).first()
        if existing:
            raise HTTPException(400, "Course code already exists")
        course_code = course.code
    else:
        course_code = generate_course_code(db, course.name)
    
    course_obj = Course(
        name=course.name,
        code=course_code,
        duration_years=course.duration_years,
        department_id=course.department_id
    )
    db.add(course_obj)
    db.commit()
    db.refresh(course_obj)

    return course_obj


def generate_course_code(db, name):
    words = name.split()
    if len(words) == 1:
        base = words[0][:4].upper()
    else:
        base = "".join(word[0] for word in words[:-1]) + words[-1][0]

    base = base.upper()

    code = base
    counter = 1

    while db.query(Course).filter(Course.code == code).first():
        code = f"{base}{counter}"
        counter += 1

    return code


@app.get("/courses")
def get_courses(
    department_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    query = db.query(Course).join(Department).options(
        joinedload(Course.department)
    ).filter(
        Department.organisation_id == current_user.organisation_id
    )
    
    if department_id:
        query = query.filter(Course.department_id == department_id)
    
    courses = query.all()
    return courses


@app.post("/subject", status_code=201)
def create_subject(
    data: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    course = db.query(Course).filter(Course.course_id == data.course_id).first()
    if not course:
        raise HTTPException(422, "Course not found")
    
    max_semester = int(course.duration_years) * 2
    if data.semester > max_semester:
        raise HTTPException(400, f"Semester cannot exceed {max_semester} for a {course.duration_years}-year course")
    if data.semester < 1:
        raise HTTPException(400, "Semester must be at least 1")

    subject = Subject(**data.dict())
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@app.get("/subjects")
def get_subjects(
    department_id: int = None,
    section: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    query = db.query(Subject).join(Course).options(
        joinedload(Subject.course).joinedload(Course.department)
    ).join(Department).filter(
        Department.organisation_id == current_user.organisation_id
    )
    
    if department_id:
        query = query.filter(Course.department_id == department_id)
    if section:
        query = query.filter(Subject.section == section)
    
    subjects = query.all()
    return subjects


@app.post("/teacher")
def create_teacher(
    teacher: TeacherCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):

    teacher_obj = Teacher(
        name=teacher.name,
        department_id=teacher.department_id,
        section=teacher.section
    )

    try:
        db.add(teacher_obj)
        db.commit()
        db.refresh(teacher_obj)
        return teacher_obj
    except IntegrityError as e:
        db.rollback()
        if "unique_teacher_per_dept_section" in str(e.orig):
            raise HTTPException(400, "This teacher is already assigned to this department and section")
        raise HTTPException(400, "Database integrity error")


@app.get("/teachers")
def get_teachers(
    department_id: int = None,
    section: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    query = db.query(Teacher).join(Department).options(
        joinedload(Teacher.department)
    ).filter(
        Department.organisation_id == current_user.organisation_id
    )
    
    if department_id:
        query = query.filter(Teacher.department_id == department_id)
    if section:
        query = query.filter(Teacher.section == section)
    
    teachers = query.all()
    return teachers


@app.post("/subject-teacher", status_code=201)
def create_subject_teacher(data: SubjectTeacherCreate, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.subject_id == data.subject_id).first()
    if not subject:
        raise HTTPException(422, "Subject not found")

    teacher = db.query(Teacher).filter(Teacher.teacher_id == data.teacher_id).first()
    if not teacher:
        raise HTTPException(422, "Teacher not found")

    mapping = SubjectTeacher(**data.dict())

    try:
        db.add(mapping)
        db.commit()
        db.refresh(mapping)
        return mapping
    except IntegrityError as e:
        db.rollback()
        if "unique_subject_teacher" in str(e.orig):
            raise HTTPException(400, "This teacher is already assigned to this subject")
        raise HTTPException(400, "Database integrity error")
    
@app.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.username == data.username).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(
        data={
            "user_id": user.user_id,
            "organisation_id": user.organisation_id,
            "role": user.role
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }