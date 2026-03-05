from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional


class HabitCreate(BaseModel):
    name: str
    goal: int
    color: Optional[str] = None


class HabitUpdate(BaseModel):
    name: Optional[str] = None
    goal: Optional[int] = None
    color: Optional[str] = None


class HabitResponse(BaseModel):
    id: int
    name: str
    goal: int
    streak: int
    last_completed_date: Optional[date] = None
    color: Optional[str] = None
    created_at: datetime
    id_user: int

    class Config:
        from_attributes = True
