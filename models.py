from sqlalchemy import Column, Integer, String, Time, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from db import Base


# =========================
# ORGANISATION
# =========================
class Organisation(Base):
    __tablename__ = "organisation"

    organisation_id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    code = Column(String, unique=True)
    address = Column(String)

    departments = relationship(
        "Department",
        back_populates="organisation",
        cascade="all, delete"
    )


# =========================
# DEPARTMENT
# =========================
class Department(Base):
    __tablename__ = "department"

    department_id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    sections = Column(String, nullable=True)

    organisation_id = Column(
        Integer,
        ForeignKey("organisation.organisation_id", ondelete="CASCADE")
    )

    organisation = relationship("Organisation", back_populates="departments")
    courses = relationship("Course", back_populates="department", cascade="all, delete")
    teachers = relationship("Teacher", back_populates="department", cascade="all, delete")

    __table_args__ = (
        UniqueConstraint("name", "organisation_id", name="unique_department_per_org"),
    )


# =========================
# COURSE
# =========================
class Course(Base):
    __tablename__ = "course"

    course_id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    duration_years = Column(Integer)

    department_id = Column(
        Integer,
        ForeignKey("department.department_id", ondelete="CASCADE")
    )

    department = relationship("Department", back_populates="courses")
    subjects = relationship("Subject", back_populates="course", cascade="all, delete")


# =========================
# SUBJECT
# =========================
class Subject(Base):
    __tablename__ = "subject"

    subject_id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    semester = Column(Integer, nullable=False)
    section = Column(String, nullable=False)

    course_id = Column(
        Integer,
        ForeignKey("course.course_id", ondelete="CASCADE")
    )

    course = relationship("Course", back_populates="subjects")
    teachers = relationship("SubjectTeacher", back_populates="subject", cascade="all, delete")

    __table_args__ = (
        UniqueConstraint("name", "course_id", "semester", "section", name="unique_subject_per_course_sem_section"),
    )


# =========================
# TEACHER
# =========================
class Teacher(Base):
    __tablename__ = "teacher"

    teacher_id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    section = Column(String, nullable=False)

    department_id = Column(
        Integer,
        ForeignKey("department.department_id", ondelete="CASCADE")
    )

    department = relationship("Department", back_populates="teachers")
    subjects = relationship("SubjectTeacher", back_populates="teacher", cascade="all, delete")

    __table_args__ = (
        UniqueConstraint("name", "department_id", "section", name="unique_teacher_per_dept_section"),
    )


# =========================
# SUBJECT - TEACHER BRIDGE
# =========================
class SubjectTeacher(Base):
    __tablename__ = "subject_teacher"

    id = Column(Integer, primary_key=True)

    subject_id = Column(
        Integer,
        ForeignKey("subject.subject_id", ondelete="CASCADE")
    )

    teacher_id = Column(
        Integer,
        ForeignKey("teacher.teacher_id", ondelete="CASCADE")
    )

    subject = relationship("Subject", back_populates="teachers")
    teacher = relationship("Teacher", back_populates="subjects")
    timetables = relationship("Timetable", back_populates="subject_teacher", cascade="all, delete")

    __table_args__ = (
        UniqueConstraint("subject_id", "teacher_id", name="unique_subject_teacher"),
    )


# =========================
# TIME SLOT
# =========================
class TimeSlot(Base):
    __tablename__ = "time_slot"

    slot_id = Column(Integer, primary_key=True)
    day_of_week = Column(String, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    timetables = relationship("Timetable", back_populates="slot", cascade="all, delete")

    __table_args__ = (
        UniqueConstraint("day_of_week", "start_time", "end_time", name="unique_time_slot"),
    )


# =========================
# TIMETABLE
# =========================
class Timetable(Base):
    __tablename__ = "timetable"

    timetable_id = Column(Integer, primary_key=True)

    organisation_id = Column(
        Integer,
        ForeignKey("organisation.organisation_id", ondelete="CASCADE")
    )

    department_id = Column(
        Integer,
        ForeignKey("department.department_id", ondelete="CASCADE")
    )

    section = Column(String, nullable=False)

    subject_teacher_id = Column(
        Integer,
        ForeignKey("subject_teacher.id", ondelete="CASCADE")
    )

    slot_id = Column(
        Integer,
        ForeignKey("time_slot.slot_id", ondelete="CASCADE")
    )

    room_no = Column(String, nullable=False)

    organisation = relationship("Organisation")
    department = relationship("Department")
    slot = relationship("TimeSlot", back_populates="timetables")
    subject_teacher = relationship("SubjectTeacher", back_populates="timetables")

    __table_args__ = (
        UniqueConstraint("department_id", "section", "slot_id", name="dept_section_slot_unique"),
        UniqueConstraint("subject_teacher_id", "slot_id", name="teacher_slot_unique"),
        UniqueConstraint("room_no", "slot_id", name="room_slot_unique"),
    )

class User(Base):
    __tablename__ = "user"

    user_id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)  

    organisation_id = Column(
        Integer,
        ForeignKey("organisation.organisation_id", ondelete="CASCADE")
    )

    organisation = relationship("Organisation")