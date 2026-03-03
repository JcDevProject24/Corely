from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from models.user import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), index=True, nullable=False)
    priority = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=False)
    description = Column(Text, nullable=True)
    id_user = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Relacion con User
    user = relationship("User", back_populates="tasks")

    # Un mismo usuario no puede tener dos tareas con el mismo nombre
    __table_args__ = (
        UniqueConstraint("name", "id_user", name="uq_task_name_user"),
    )

    def __repr__(self):
        return f"<Task(id={self.id}, name={self.name}, id_user={self.id_user})>"
