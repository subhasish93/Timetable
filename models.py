from sqlalchemy import Column, Integer, String, Time, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from db import Base

class Organisation(Base):
    __tablename__ = "organisation"

    organisation_id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    code = Column(String, unique=True)
    address = Column(String)

    departments = relationship("Department", back_populates="organisation")

class Department(Base):
    __tablename__ = "department"

    department_id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)

    organisation_id = Column(Integer, ForeignKey("organisation.organisation_id"))

    organisation = relationship("Organisation", back_populates="departments")
    courses = relationship("Course", back_populates="department")
    teachers = relationship("Teacher", back_populates="department")


class Course(Base):
    __tablename__ = "course"

    course_id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    duration_years = Column(Integer)

    department_id = Column(Integer, ForeignKey("department.department_id"))

    department = relationship("Department", back_populates="courses")
    sections = relationship("Section", back_populates="course")
    subjects = relationship("Subject", back_populates="course")

class Section(Base):
    __tablename__ = "section"

    section_id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)  
    semester = Column(Integer, nullable=False)

    course_id = Column(Integer, ForeignKey("course.course_id"))

    course = relationship("Course", back_populates="sections")
    timetables = relationship("Timetable", back_populates="section")


class Subject(Base):
    __tablename__ = "subject"

    subject_id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    semester = Column(Integer, nullable=False)

    course_id = Column(Integer, ForeignKey("course.course_id"))

    course = relationship("Course", back_populates="subjects")
    teachers = relationship("SubjectTeacher", back_populates="subject")


class Teacher(Base):
    __tablename__ = "teacher"

    teacher_id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)

    department_id = Column(Integer, ForeignKey("department.department_id"))

    department = relationship("Department", back_populates="teachers")
    subjects = relationship("SubjectTeacher", back_populates="teacher")


class SubjectTeacher(Base):
    __tablename__ = "subject_teacher"

    id = Column(Integer, primary_key=True)
    subject_id = Column(Integer, ForeignKey("subject.subject_id"))
    teacher_id = Column(Integer, ForeignKey("teacher.teacher_id"))

    subject = relationship("Subject", back_populates="teachers")
    teacher = relationship("Teacher", back_populates="subjects")

    __table_args__ = (
        UniqueConstraint("subject_id", "teacher_id", name="unique_subject_teacher"),
    )


class TimeSlot(Base):
    __tablename__ = "time_slot"

    slot_id = Column(Integer, primary_key=True)
    day_of_week = Column(String, nullable=False)   
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    timetables = relationship("Timetable", back_populates="slot")


class Timetable(Base):
    __tablename__ = "timetable"

    timetable_id = Column(Integer, primary_key=True)

    section_id = Column(Integer, ForeignKey("section.section_id"))
    subject_teacher_id = Column(Integer, ForeignKey("subject_teacher.id"))
    slot_id = Column(Integer, ForeignKey("time_slot.slot_id"))

    room_no = Column(String, nullable=False)

    section = relationship("Section", back_populates="timetables")
    slot = relationship("TimeSlot", back_populates="timetables")
    subject_teacher = relationship("SubjectTeacher")

    __table_args__ = (
        UniqueConstraint("section_id", "slot_id", name="section_slot_unique"),
        UniqueConstraint("subject_teacher_id", "slot_id", name="teacher_slot_unique"),
        UniqueConstraint("room_no", "slot_id", name="room_slot_unique"),
    )
