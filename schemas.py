from pydantic import BaseModel, EmailStr, field_validator, model_validator, ConfigDict
from typing import Optional, Literal
from datetime import date, time


TermType = Literal["SEMESTER", "YEAR"]
SubjectType = Literal["MANDATORY", "ELECTIVE"]
DayOfWeek = Literal["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]
UserRole = Literal["super_admin", "admin", "faculty"]
GroupType = Literal["section", "batch"]


DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]


# =========================
# ORGANISATION
# =========================
class OrganisationBase(BaseModel):
    name: str
    address: Optional[str] = None


class OrganisationCreate(OrganisationBase):
    pass


class OrganisationUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None


class OrganisationResponse(OrganisationBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    code: str
    is_active: bool


# =========================
# DEPARTMENT
# =========================

class DepartmentBase(BaseModel):
    name: str
    short_name: str   # ✅ ADDED


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    short_name: Optional[str] = None   # ✅ ADDED


class DepartmentResponse(DepartmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organisation_id: int
    is_active: bool


# =========================
# COURSE
# =========================
class CourseBase(BaseModel):
    name: str
    duration_years: int
    term_type: TermType = "SEMESTER"  # type: ignore


class CourseCreate(CourseBase):
    code: Optional[str] = None
    department_id: int


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    duration_years: Optional[int] = None
    term_type: Optional[TermType] = None


class CourseResponse(CourseBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    code: str
    department_id: int
    is_active: bool


# =========================
# ACADEMIC TERM
# =========================
class AcademicTermBase(BaseModel):
    term_number: int
    term_type: TermType = "SEMESTER"  # type: ignore
    start_date: date
    end_date: date

    @field_validator('term_number')
    @classmethod
    def term_number_positive(cls, v):
        if v < 1:
            raise ValueError('term_number must be at least 1')
        return v

    @field_validator('end_date')
    @classmethod
    def end_after_start(cls, v, info):
        if 'start_date' in info.data and v <= info.data['start_date']:
            raise ValueError('end_date must be after start_date')
        return v


class AcademicTermCreate(AcademicTermBase):
    pass
    #academic_year_id: Optional[int] = None   # ✅ NEW (MANDATORY)


class AcademicTermUpdate(BaseModel):
    term_number: Optional[int] = None
    term_type: Optional[TermType] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None

    @field_validator('end_date')
    @classmethod
    def end_after_start(cls, v, info):
        if v and 'start_date' in info.data and info.data['start_date']:
            if v <= info.data['start_date']:
                raise ValueError('end_date must be after start_date')
        return v


class AcademicTermResponse(AcademicTermBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    course_id: int
    #academic_year_id: int   # ✅ NEW
    is_active: bool


# =========================
# SUBJECT
# =========================
class SubjectBase(BaseModel):
    name: str
    code: str
    subject_short_name: str
    subject_type: SubjectType = "MANDATORY"  # type: ignore
    credits: int = 0
    weekly_hours: int = 0


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    academic_term_id: Optional[int] = None
    name: Optional[str] = None
    code: Optional[str] = None
    subject_short_name: Optional[str] = None 
    subject_type: Optional[SubjectType] = None
    credits: Optional[int] = None
    weekly_hours: Optional[int] = None


class SubjectResponse(SubjectBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    academic_term_id: int
    is_active: bool


# =========================
# SECTION
# =========================
class SectionBase(BaseModel):
    name: str
    max_capacity: int = 60


class SectionCreate(SectionBase):
    pass


class SectionUpdate(BaseModel):
    name: Optional[str] = None
    max_capacity: Optional[int] = None


class SectionResponse(SectionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    academic_term_id: int
    is_active: bool


# =========================
# BATCH
# =========================
class BatchBase(BaseModel):
    name: str
    max_capacity: int = 30


class BatchCreate(BatchBase):
    subject_id: int


class BatchUpdate(BaseModel):
    name: Optional[str] = None
    max_capacity: Optional[int] = None


class BatchResponse(BatchBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    academic_term_id: int
    subject_id: int
    is_active: bool


# =========================
# FACULTY
# =========================
class FacultyBase(BaseModel):
    name: str
    employee_code: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    max_weekly_hours: int = 20


class FacultyCreate(FacultyBase):
    department_id: int


class FacultyUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    max_weekly_hours: Optional[int] = None


class FacultyResponse(FacultyBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    department_id: int
    is_active: bool


# =========================
# FACULTY ASSIGNMENT
# =========================
class FacultyAssignmentBase(BaseModel):
    faculty_id: int
    subject_id: int


class FacultyAssignmentCreate(FacultyAssignmentBase):
    section_id: Optional[int] = None
    batch_id: Optional[int] = None


class FacultyAssignmentResponse(FacultyAssignmentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    section_id: Optional[int]
    batch_id: Optional[int]
    is_active: bool


# =========================
# ROOM
# =========================
class RoomBase(BaseModel):
    name: str
    building: Optional[str] = None
    capacity: int = 60


class RoomCreate(RoomBase):
    department_id: int


class RoomUpdate(BaseModel):
    name: Optional[str] = None
    building: Optional[str] = None
    capacity: Optional[int] = None


class RoomResponse(RoomBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    department_id: int
    is_active: bool


# =========================
# TIMETABLE SLOT
# =========================
class TimetableSlotBase(BaseModel):
    subject_id: int
    faculty_id: int
    section_id: Optional[int] = None
    batch_id: Optional[int] = None
    room_id: Optional[int] = None
    date: date
    start_time: time
    end_time: time
    modality: str = "Offline"

    @field_validator('end_time')
    @classmethod
    def end_after_start(cls, v, info):
        if 'start_time' in info.data and v <= info.data['start_time']:
            raise ValueError('end_time must be after start_time')
        return v

    @model_validator(mode='after')
    def validate_room_for_modality(self):
        if self.modality in ("Offline", "Hybrid") and self.room_id is None:
            raise ValueError('Room is required for Offline and Hybrid classes')
        return self

    @model_validator(mode='after')
    def validate_section_or_batch(self):
        if self.section_id is None and self.batch_id is None:
            raise ValueError('At least one of Section or Batch must be selected')
        return self


class TimetableSlotCreate(TimetableSlotBase):
    academic_term_id: int


class TimetableSlotUpdate(BaseModel):
    subject_id: Optional[int] = None
    faculty_id: Optional[int] = None
    section_id: Optional[int] = None
    batch_id: Optional[int] = None
    room_id: Optional[int] = None
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    modality: Optional[str] = None


class TimetableSlotResponse(TimetableSlotBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    academic_term_id: int
    is_active: bool


class TimetableSlotWithDetails(TimetableSlotResponse):
    subject_name: Optional[str] = None
    faculty_name: Optional[str] = None
    section_name: Optional[str] = None
    batch_name: Optional[str] = None
    room_name: Optional[str] = None


# =========================
# USER / AUTH
# =========================
class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None


class UserCreate(UserBase):
    password: str
    role: UserRole = "admin"
    faculty_id: Optional[int] = None
    organisation_id: int


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# =========================
# BULK OPERATIONS
# =========================
class BulkTimetableCreate(BaseModel):
    slots: list[TimetableSlotCreate]


class ConflictResponse(BaseModel):
    type: str
    message: str
    details: dict


# =========================
# STUDENT ENROLLMENT
# =========================
class StudentEnrollmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    group_type: GroupType
    group_id: int
    student_id: str
    is_active: bool
    created_at: Optional[date] = None


class BulkEnrollRequest(BaseModel):
    student_ids: list[str]


class BulkEnrollResult(BaseModel):
    total: int
    added: int
    already_enrolled: int
    skipped: int


# =========================
# STUDENT TIMETABLE
# =========================
class StudentTimetableSlot(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    date: date
    start_time: time
    end_time: time
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    faculty_name: Optional[str] = None
    room_name: Optional[str] = None
    group_type: Optional[GroupType] = None
    group_name: Optional[str] = None
