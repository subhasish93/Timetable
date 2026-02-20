from fastapi import FastAPI, Depends, HTTPException
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


# ========================= SECTIONS =========================

@app.get("/sections")
def get_sections(db: Session = Depends(get_db)):
    result = db.query(
        Section.section_id,
        Section.name,
        Course.name.label("course"),
        Section.semester
    ).join(Course).all()

    return [dict(r._mapping) for r in result]


# ========================= TIME SLOTS =========================

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


# ========================= SUBJECT + TEACHER =========================

@app.get("/subject-teachers-full")
def get_subject_teachers_full(db: Session = Depends(get_db)):
    result = db.query(
        SubjectTeacher.id.label("subject_teacher_id"),
        Subject.name.label("subject_name"),
        Teacher.name.label("teacher_name")
    ).join(Subject).join(Teacher).all()

    return [dict(r._mapping) for r in result]


@app.get("/subject-teachers")
def get_subject_teachers(db: Session = Depends(get_db)):
    result = db.query(
        SubjectTeacher.id.label("subject_teacher_id"),
        Subject.name.label("subject_name"),
        Teacher.name.label("teacher_name")
    ).join(Subject).join(Teacher).all()

    return [dict(r._mapping) for r in result]


# ========================= CREATE TIMETABLE =========================

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


# ========================= GET SECTION TIMETABLE =========================

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


# ========================= DELETE TIMETABLE =========================

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
        raise HTTPException(404, "Not found")

    for key, value in data.dict().items():
        setattr(entry, key, value)

    db.commit()
    db.refresh(entry)
    return entry

#..................Management_Table...................

# ========================= ORGANISATION =========================

@app.post("/organisation")
def create_organisation(data: OrganisationCreate, db: Session = Depends(get_db)):
    org = Organisation(**data.dict())
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


# ========================= DEPARTMENT =========================

@app.post("/department")
def create_department(data: DepartmentCreate, db: Session = Depends(get_db)):
    dept = Department(**data.dict())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


# ========================= COURSE =========================

@app.post("/course")
def create_course(data: CourseCreate, db: Session = Depends(get_db)):
    course = Course(**data.dict())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


# ========================= SECTION =========================

@app.post("/section")
def create_section(data: SectionCreate, db: Session = Depends(get_db)):
    section = Section(**data.dict())
    db.add(section)
    db.commit()
    db.refresh(section)
    return section


# ========================= SUBJECT =========================

@app.post("/subject")
def create_subject(data: SubjectCreate, db: Session = Depends(get_db)):
    subject = Subject(**data.dict())
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


# ========================= TEACHER =========================

@app.post("/teacher")
def create_teacher(data: TeacherCreate, db: Session = Depends(get_db)):
    teacher = Teacher(**data.dict())
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher


# ========================= SUBJECT-TEACHER =========================

@app.post("/subject-teacher")
def create_subject_teacher(data: SubjectTeacherCreate, db: Session = Depends(get_db)):
    mapping = SubjectTeacher(**data.dict())
    db.add(mapping)
    db.commit()
    db.refresh(mapping)
    return mapping
