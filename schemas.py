from pydantic import BaseModel

class TimetableCreate(BaseModel):
    section_id: int
    subject_teacher_id: int
    slot_id: int
    room_no: str
