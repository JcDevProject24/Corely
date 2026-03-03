from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TaskCreate(BaseModel):
    name: str
    priority: str
    status: str
    due_date: datetime
    description: Optional[str] = None


class TaskUpdate(BaseModel):
    name: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    description: Optional[str] = None


class TaskResponse(BaseModel):
    id: int
    name: str
    priority: str
    status: str
    created_at: datetime
    due_date: datetime
    description: Optional[str] = None
    id_user: int

    class Config:
        from_attributes = True
