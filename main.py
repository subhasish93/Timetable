from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi.middleware.cors import CORSMiddleware

from db import SessionLocal, engine
from models import (
    Base, Section, Course, TimeSlot, SubjectTeacher,
    Subject, Teacher, Timetable,
    Organisation, Department
)

from schemas import (
    TimetableCreate,
    OrganisationCreate, 
    DepartmentCreate, 
    CourseCreate, 
    SectionCreate, 
    SubjectCreate, 
    TeacherCreate, 
    SubjectTeacherCreate
)

# Create tables
Base.metadata.create_all(bind=engine)

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

@app.get("/sections")
def get_sections(db: Session = Depends(get_db)):
    result = db.query(
        Section.section_id,
        Section.name,
        Course.name.label("course"),
        Section.semester
    ).join(Course).all()
    return [dict(r._mapping) for r in result]


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
def get_subject_teachers(db: Session = Depends(get_db)):
    result = db.query(
        SubjectTeacher.id.label("subject_teacher_id"),
        Subject.name.label("subject_name"),
        Teacher.name.label("teacher_name")
    ).join(Subject).join(Teacher).all()
    return [dict(r._mapping) for r in result]


@app.post("/timetable")
def create_timetable(data: TimetableCreate, db: Session = Depends(get_db)):
    timetable = Timetable(**data.dict())
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
        elif "section_slot_unique" in msg:
            detail = "Section already has class at this time"
        else:
            detail = "Scheduling conflict detected"
        raise HTTPException(status_code=400, detail=detail)


@app.get("/timetable/section/{section_id}")
def get_section_timetable(section_id: int, db: Session = Depends(get_db)):
    result = db.query(
        Timetable.timetable_id,
        TimeSlot.day_of_week.label("day"),
        TimeSlot.start_time,
        TimeSlot.end_time,
        Subject.name.label("subject"),
        Teacher.name.label("teacher"),
        Timetable.room_no
    ).join(TimeSlot)\
     .join(SubjectTeacher)\
     .join(Subject)\
     .join(Teacher)\
     .filter(Timetable.section_id == section_id)\
     .order_by(TimeSlot.day_of_week, TimeSlot.start_time)\
     .all()
    return [dict(r._mapping) for r in result]


@app.delete("/timetable/{timetable_id}")
def delete_timetable(timetable_id: int, db: Session = Depends(get_db)):
    entry = db.query(Timetable).filter(Timetable.timetable_id == timetable_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()
    return {"message": "Deleted successfully"}


@app.put("/timetable/{id}")
def update_timetable(id: int, data: TimetableCreate, db: Session = Depends(get_db)):
    entry = db.query(Timetable).filter(Timetable.timetable_id == id).first()
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

@app.post("/organisation", status_code=201)
def create_organisation(data: OrganisationCreate, db: Session = Depends(get_db)):
    existing = db.query(Organisation).filter(Organisation.name == data.name).first()
    if existing:
        raise HTTPException(400, "Organisation with this name already exists")

    org = Organisation(**data.dict())
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@app.post("/department", status_code=201)
def create_department(data: DepartmentCreate, db: Session = Depends(get_db)):
    org = db.query(Organisation).filter(Organisation.organisation_id == data.organisation_id).first()
    if not org:
        raise HTTPException(422, "Organisation not found")

    dept = Department(**data.dict())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@app.post("/course", status_code=201)
def create_course(data: CourseCreate, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.department_id == data.department_id).first()
    if not dept:
        raise HTTPException(422, "Department not found")

    existing = db.query(Course).filter(Course.code == data.code).first()
    if existing:
        raise HTTPException(400, "Course code already exists")

    course = Course(**data.dict())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@app.post("/section", status_code=201)
def create_section(data: SectionCreate, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.course_id == data.course_id).first()
    if not course:
        raise HTTPException(422, "Course not found")

    section = Section(**data.dict())
    db.add(section)
    db.commit()
    db.refresh(section)
    return section


@app.post("/subject", status_code=201)
def create_subject(data: SubjectCreate, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.course_id == data.course_id).first()
    if not course:
        raise HTTPException(422, "Course not found")

    subject = Subject(**data.dict())
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@app.post("/teacher", status_code=201)
def create_teacher(data: TeacherCreate, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.department_id == data.department_id).first()
    if not dept:
        raise HTTPException(422, "Department not found")

    teacher = Teacher(**data.dict())
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher


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