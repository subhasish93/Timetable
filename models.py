from sqlalchemy import Column, Integer, String, Time, ForeignKey, UniqueConstraint
from db import Base

class Department(Base):
    __tablename__ = "department"
    department_id = Column(Integer, primary_key=True)
    department_name = Column(String, nullable=False)

class Section(Base):
    __tablename__ = "section"
    section_id = Column(Integer, primary_key=True)
    department_id = Column(Integer, ForeignKey("department.department_id"))
    section_name = Column(String)
    semester = Column(Integer)

class Subject(Base):
    __tablename__ = "subject"
    subject_id = Column(Integer, primary_key=True)
    subject_name = Column(String)
    semester = Column(Integer)

class Teacher(Base):
    __tablename__ = "teacher"
    teacher_id = Column(Integer, primary_key=True)
    teacher_name = Column(String)

class TimeSlot(Base):
    __tablename__ = "time_slot"
    slot_id = Column(Integer, primary_key=True)
    day_of_week = Column(String)
    start_time = Column(Time)
    end_time = Column(Time)

class SubjectTeacher(Base):
    __tablename__ = "subject_teacher"
    id = Column(Integer, primary_key=True)
    subject_id = Column(Integer, ForeignKey("subject.subject_id"))
    teacher_id = Column(Integer, ForeignKey("teacher.teacher_id"))

class Timetable(Base):
    __tablename__ = "timetable"
    timetable_id = Column(Integer, primary_key=True)
    section_id = Column(Integer, ForeignKey("section.section_id"))
    subject_id = Column(Integer, ForeignKey("subject.subject_id"))
    teacher_id = Column(Integer, ForeignKey("teacher.teacher_id"))
    slot_id = Column(Integer, ForeignKey("time_slot.slot_id"))
    room_no = Column(String)

    __table_args__ = (
        UniqueConstraint("teacher_id", "slot_id", name="teacher_slot_unique"),
        UniqueConstraint("section_id", "slot_id", name="section_slot_unique"),
        UniqueConstraint("room_no", "slot_id", name="room_slot_unique"),
    )
