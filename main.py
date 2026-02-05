from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from db import engine, SessionLocal
from models import Base, Timetable
from schemas import TimetableCreate

app = FastAPI(title="Timetable Management System")

Base.metadata.create_all(bind=engine)

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
        print("DB ERROR 👉", e.orig)
        raise HTTPException(
            status_code=400,
            detail="Conflict detected (Teacher / Section / Room)"
        )

@app.get("/timetable")
def get_timetable(db: Session = Depends(get_db)):
    return db.query(Timetable).all()
