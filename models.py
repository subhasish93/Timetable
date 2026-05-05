from sqlalchemy import (
    Column, Integer, String, Time, ForeignKey, Date, Enum, Boolean, 
    UniqueConstraint, CheckConstraint, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db import Base
import enum


class TermType(str, enum.Enum):
    SEMESTER = "SEMESTER"
    YEAR = "YEAR"


class SubjectType(str, enum.Enum):
    MANDATORY = "MANDATORY"
    ELECTIVE = "ELECTIVE"


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    FACULTY = "faculty"


class DayOfWeek(str, enum.Enum):
    MONDAY = "MONDAY"
    TUESDAY = "TUESDAY"
    WEDNESDAY = "WEDNESDAY"
    THURSDAY = "THURSDAY"
    FRIDAY = "FRIDAY"
    SATURDAY = "SATURDAY"
    SUNDAY = "SUNDAY"


# =========================
# ORGANISATION
# =========================
class Organisation(Base):
    __tablename__ = "organisations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    code = Column(String, unique=True, nullable=False)
    address = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(Date, server_default=func.now())
    updated_at = Column(Date, server_default=func.now(), onupdate=func.now())

    departments = relationship("Department", back_populates="organisation", cascade="all, delete")
    users = relationship("User", back_populates="organisation", cascade="all, delete")

    # ✅ NEW
    academic_years = relationship("AcademicYear", back_populates="organisation", cascade="all, delete")


# =========================
# ACADEMIC YEAR
# =========================
class AcademicYear(Base):
    __tablename__ = "academic_years"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)  # e.g. "2025-2026"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    organisation_id = Column(
        Integer,
        ForeignKey("organisations.id", ondelete="CASCADE"),
        nullable=False
    )

    is_active = Column(Boolean, default=True)

    created_at = Column(Date, server_default=func.now())
    updated_at = Column(Date, server_default=func.now(), onupdate=func.now())

    # ✅ RELATIONSHIPS
    organisation = relationship("Organisation", back_populates="academic_years")
    academic_terms = relationship(
        "AcademicTerm",
        back_populates="academic_year",
        cascade="all, delete"
    )

    __table_args__ = (
        # ✅ Unique per organisation
        UniqueConstraint(
            "name",
            "organisation_id",
            name="unique_academic_year_per_org"
        ),

        # ✅ Date validation
        CheckConstraint(
            "end_date > start_date",
            name="check_academic_year_dates"
        ),

        # ✅ Indexes (IMPORTANT)
        Index("idx_academic_year_org", "organisation_id"),
        Index("idx_academic_year_active", "is_active"),
    )


# =========================
# DEPARTMENT
# =========================
class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    short_name = Column(String(50), nullable=False)  # for short Name
    organisation_id = Column(Integer, ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(Date, server_default=func.now())
    updated_at = Column(Date, server_default=func.now(), onupdate=func.now())

    organisation = relationship("Organisation", back_populates="departments")
    courses = relationship("Course", back_populates="department", cascade="all, delete")
    faculties = relationship("Faculty", back_populates="department", cascade="all, delete")
    rooms = relationship("Room", back_populates="department", cascade="all, delete")

    __table_args__ = (
        UniqueConstraint("name", "organisation_id", name="unique_department_per_org"),
        UniqueConstraint("short_name", "organisation_id", name="unique_shortname_per_org"),  # ✅ ADD THIS

    )


# =========================
# COURSE
# =========================
class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    duration_years = Column(Integer, nullable=False)
    term_type = Column(Enum(TermType), default=TermType.SEMESTER, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(Date, server_default=func.now())
    updated_at = Column(Date, server_default=func.now(), onupdate=func.now())

    department = relationship("Department", back_populates="courses")
    academic_terms = relationship("AcademicTerm", back_populates="course", cascade="all, delete")

    __table_args__ = (
        Index("idx_course_code", "code"),
    )


# =========================
# ACADEMIC TERM (Semester/Year)
# =========================
class AcademicTerm(Base):
    __tablename__ = "academic_terms"

    id = Column(Integer, primary_key=True, index=True)

    # ✅ NEW
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)

    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    term_number = Column(Integer, nullable=False)
    term_type = Column(Enum(TermType), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    is_active = Column(Boolean, default=True)
    created_at = Column(Date, server_default=func.now())
    updated_at = Column(Date, server_default=func.now(), onupdate=func.now())

    # ✅ RELATIONS
    academic_year = relationship("AcademicYear", back_populates="academic_terms")
    course = relationship("Course", back_populates="academic_terms")
    subjects = relationship("Subject", back_populates="academic_term", cascade="all, delete")
    sections = relationship("Section", back_populates="academic_term", cascade="all, delete")
    batches = relationship("Batch", back_populates="academic_term", cascade="all, delete")
    timetable_slots = relationship("TimetableSlot", back_populates="academic_term", cascade="all, delete")

    __table_args__ = (
        # ✅ FIXED
        UniqueConstraint("academic_year_id", "course_id", "term_number", name="unique_term_per_year_course"),
        CheckConstraint("end_date > start_date", name="check_term_dates"),
        CheckConstraint("term_number > 0", name="check_term_number"),
    )


# =========================
# SUBJECT
# =========================
class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    academic_term_id = Column(Integer, ForeignKey("academic_terms.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False)
    subject_short_name = Column(String, nullable=False)
    subject_type = Column(Enum(SubjectType), default=SubjectType.MANDATORY, nullable=False)
    credits = Column(Integer, default=0)
    weekly_hours = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(Date, server_default=func.now())
    updated_at = Column(Date, server_default=func.now(), onupdate=func.now())

    academic_term = relationship("AcademicTerm", back_populates="subjects")
    faculty_assignments = relationship("FacultyAssignment", back_populates="subject", cascade="all, delete")
    batches = relationship("Batch", back_populates="subject")

    __table_args__ = (
        UniqueConstraint("academic_term_id", "code", name="unique_subject_code_per_term"),
        Index("idx_subject_code", "code"),
    )


# =========================
# SECTION
# =========================
class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)
    academic_term_id = Column(Integer, ForeignKey("academic_terms.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    max_capacity = Column(Integer, default=60)
    is_active = Column(Boolean, default=True)
    created_at = Column(Date, server_default=func.now())
    updated_at = Column(Date, server_default=func.now(), onupdate=func.now())

    academic_term = relationship("AcademicTerm", back_populates="sections")
    faculty_assignments = relationship("FacultyAssignment", back_populates="section")
    timetable_slots = relationship("TimetableSlot", back_populates="section")

    __table_args__ = (
        UniqueConstraint("academic_term_id", "name", name="unique_section_per_term"),
    )


# =========================
# BATCH
# =========================
class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    academic_term_id = Column(Integer, ForeignKey("academic_terms.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    max_capacity = Column(Integer, default=30)
    is_active = Column(Boolean, default=True)
    created_at = Column(Date, server_default=func.now())
    updated_at = Column(Date, server_default=func.now(), onupdate=func.now())

    academic_term = relationship("AcademicTerm", back_populates="batches")
    subject = relationship("Subject", back_populates="batches")
    faculty_assignments = relationship("FacultyAssignment", back_populates="batch")
    timetable_slots = relationship("TimetableSlot", back_populates="batch")

    __table_args__ = (
        UniqueConstraint("academic_term_id", "subject_id", "name", name="unique_batch_per_term_subject"),
    )


# =========================
# FACULTY
# =========================
class Faculty(Base):
    __tablename__ = "faculties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    employee_code = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True)
    phone = Column(String)
    specialization = Column(String)
    max_weekly_hours = Column(Integer, default=20)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(Date, server_default=func.now())
    updated_at = Column(Date, server_default=func.now(), onupdate=func.now())

    department = relationship("Department", back_populates="faculties")
    assignments = relationship("FacultyAssignment", back_populates="faculty", cascade="all, delete")
    timetable_slots = relationship("TimetableSlot", back_populates="faculty")

    __table_args__ = (
        Index("idx_faculty_employee_code", "employee_code"),
        Index("idx_faculty_email", "email"),
    )


# =========================
# FACULTY ASSIGNMENT
# =========================
class FacultyAssignment(Base):
    __tablename__ = "faculty_assignments"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculties.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=True)
    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="CASCADE"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(Date, server_default=func.now())
    updated_at = Column(Date, server_default=func.now(), onupdate=func.now())

    faculty = relationship("Faculty", back_populates="assignments")
    subject = relationship("Subject", back_populates="faculty_assignments")
    section = relationship("Section", back_populates="faculty_assignments")
    batch = relationship("Batch", back_populates="faculty_assignments")

    __table_args__ = (
        CheckConstraint(
            "(section_id IS NOT NULL AND batch_id IS NULL) OR (section_id IS NULL AND batch_id IS NOT NULL)",
            name="check_section_or_batch"
        ),
    )


# =========================
# ROOM
# =========================
class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    building = Column(String)
    capacity = Column(Integer, default=60)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(Date, server_default=func.now())
    updated_at = Column(Date, server_default=func.now(), onupdate=func.now())

    department = relationship("Department", back_populates="rooms")
    timetable_slots = relationship("TimetableSlot", back_populates="room")

    __table_args__ = (
        UniqueConstraint("name", "department_id", name="unique_room_per_department"),
        Index("idx_room_name", "name"),
    )


# =========================
# TIMETABLE SLOT
# =========================
class TimetableSlot(Base):
    __tablename__ = "timetable_slots"

    id = Column(Integer, primary_key=True, index=True)
    academic_term_id = Column(Integer, ForeignKey("academic_terms.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculties.id", ondelete="CASCADE"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=True)
    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="CASCADE"), nullable=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(Enum(DayOfWeek), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(Date, server_default=func.now())
    updated_at = Column(Date, server_default=func.now(), onupdate=func.now())

    academic_term = relationship("AcademicTerm", back_populates="timetable_slots")
    subject = relationship("Subject")
    faculty = relationship("Faculty", back_populates="timetable_slots")
    section = relationship("Section", back_populates="timetable_slots")
    batch = relationship("Batch", back_populates="timetable_slots")
    room = relationship("Room", back_populates="timetable_slots")

    __table_args__ = (
        UniqueConstraint("academic_term_id", "section_id", "day_of_week", "start_time", "end_time", name="unique_section_slot"),
        UniqueConstraint("academic_term_id", "batch_id", "day_of_week", "start_time", "end_time", name="unique_batch_slot"),
        UniqueConstraint("faculty_id", "day_of_week", "start_time", "end_time", name="unique_faculty_slot"),
        UniqueConstraint("room_id", "day_of_week", "start_time", "end_time", name="unique_room_slot"),
        CheckConstraint("end_time > start_time", name="check_slot_times"),
    )


# =========================
# USER
# =========================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    email = Column(String, unique=True)
    role = Column(Enum(UserRole), default=UserRole.ADMIN, nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculties.id", ondelete="SET NULL"), nullable=True)
    organisation_id = Column(Integer, ForeignKey("organisations.id", ondelete="CASCADE"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(Date, server_default=func.now())
    updated_at = Column(Date, server_default=func.now(), onupdate=func.now())

    organisation = relationship("Organisation", back_populates="users")
    faculty = relationship("Faculty")

    __table_args__ = (
        Index("idx_user_username", "username"),
    )
