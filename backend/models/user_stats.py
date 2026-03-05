from sqlalchemy import Column, Integer, Date, ForeignKey
from models.user import Base


class UserHabitStats(Base):
    """Almacena la racha global del usuario (días consecutivos con 100% completado)."""
    __tablename__ = "user_habit_stats"

    id_user = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    global_streak = Column(Integer, default=0, nullable=False)
    last_all_completed_date = Column(Date, nullable=True)
