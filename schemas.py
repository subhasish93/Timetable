from pydantic import BaseModel
from typing import Optional


# =========================
# TIMETABLE
# =========================

class TimetableCreate(BaseModel):
    section_id: int
    subject_teacher_id: int
    slot_id: int
    room_no: str


# =========================
# ORGANISATION
# =========================

class OrganisationCreate(BaseModel):
    name: str
    code: Optional[str] = None
    address: Optional[str] = None


# =========================
# DEPARTMENT
# =========================

class DepartmentCreate(BaseModel):
    name: str
    organisation_id: int


# =========================
# COURSE
# =========================

class CourseCreate(BaseModel):
    name: str
    code: str
    duration_years: int
    department_id: int


# =========================
# SECTION
# =========================

class SectionCreate(BaseModel):
    name: str
    semester: int
    course_id: int


# =========================
# SUBJECT
# =========================

class SubjectCreate(BaseModel):
    name: str
    semester: int
    course_id: int


# =========================
# TEACHER
# =========================

class TeacherCreate(BaseModel):
    name: str
    department_id: int


# =========================
# SUBJECT-TEACHER MAPPING
# =========================

class SubjectTeacherCreate(BaseModel):
    subject_id: int
    teacher_id: int
