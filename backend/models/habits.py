from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime

from models.user import Base


class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), index=True, nullable=False)
    goal = Column(Integer, nullable=False)               # Meta en días (ej: 30, 60, 365)
    streak = Column(Integer, default=0, nullable=False)  # Racha de días consecutivos
    last_completed_date = Column(Date, nullable=True)    # Última vez que se marcó completado
    color = Column(String(20), nullable=True)            # Color visual del hábito
    created_at = Column(DateTime, default=datetime.utcnow)
    id_user = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Relación con User
    user = relationship("User", back_populates="habits")

    # Un mismo usuario no puede tener dos hábitos con el mismo nombre
    __table_args__ = (
        UniqueConstraint("name", "id_user", name="uq_habit_name_user"),
    )

    def __repr__(self):
        return f"<Habit(id={self.id}, name={self.name}, id_user={self.id_user})>"
