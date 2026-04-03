from pydantic import BaseModel
from typing import Optional


# =========================
# TIMETABLE
# =========================

class TimetableCreate(BaseModel):
    department_id: int
    section: str
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
    sections: str


# =========================
# COURSE
# =========================

class CourseCreate(BaseModel):
    name: str
    code: Optional[str] = None
    duration_years: int
    department_id: int


# =========================
# SUBJECT
# =========================

class SubjectCreate(BaseModel):
    name: str
    semester: int
    course_id: int
    section: str


# =========================
# TEACHER
# =========================

class TeacherCreate(BaseModel):
    name: str
    department_id: int
    section: str


# =========================
# SUBJECT-TEACHER MAPPING
# =========================

class SubjectTeacherCreate(BaseModel):
    subject_id: int
    teacher_id: int

class LoginRequest(BaseModel):
    username: str
    password: str
