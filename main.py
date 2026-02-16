from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from db import engine, SessionLocal
from models import Base, Timetable, Section, TimeSlot, SubjectTeacher, Subject, Teacher

from schemas import TimetableCreate

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Timetable Management System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
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

@app.post("/timetable")
def create_timetable(data: TimetableCreate, db: Session = Depends(get_db)):
    timetable = Timetable(**data.dict())
    try:
        db.add(timetable)
        db.commit()
        return {"message": "Timetable created successfully"}
    except IntegrityError as e:
        db.rollback()
        print("DB ERROR", e.orig)
        raise HTTPException(
            status_code=400,
            detail="Conflict detected (Teacher / Section / Room)"
        )

@app.get("/timetable")
def get_timetable(db: Session = Depends(get_db)):
    return db.query(Timetable).all()

@app.get("/sections")
def get_sections(db: Session = Depends(get_db)):
    return db.query(Section).all()

@app.get("/time-slots")
def get_slots(db: Session = Depends(get_db)):
    return db.query(TimeSlot).all()

@app.get("/subject-teachers")
def get_subject_teachers(db: Session = Depends(get_db)):
    return db.query(SubjectTeacher).all()

@app.get("/subject-teachers-full")
def get_subject_teachers_full(db: Session = Depends(get_db)):
    return db.query(
        SubjectTeacher.id.label("subject_teacher_id"),
        Subject.name.label("subject_name"),
        Teacher.name.label("teacher_name")
    ).join(Subject).join(Teacher).all()

@app.get("/timetable/full")
def get_full_timetable(db: Session = Depends(get_db)):
    result = db.query(
        Timetable.timetable_id,
        Section.name.label("section"),
        Subject.name.label("subject"),
        Teacher.name.label("teacher"),
        TimeSlot.day_of_week,
        TimeSlot.start_time,
        TimeSlot.end_time,
        Timetable.room_no
    ).join(Section).join(TimeSlot).join(SubjectTeacher).join(Subject).join(Teacher).all()

    return [dict(r._mapping) for r in result]

