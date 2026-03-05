from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, timedelta

from habits.schemas import HabitCreate, HabitUpdate, HabitResponse
from auth.dependencies import get_current_user, get_db
from models.habits import Habit
from models.user import User
from models.user_stats import UserHabitStats

router = APIRouter(prefix="/habits", tags=["Habits"])


@router.get("/stats")
async def get_habit_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Devuelve la racha global del usuario (días consecutivos con 100% de hábitos completados)."""
    stats = db.query(UserHabitStats).filter(UserHabitStats.id_user == current_user.id).first()
    return {
        "global_streak": stats.global_streak if stats else 0,
        "last_all_completed_date": stats.last_all_completed_date if stats else None,
    }


@router.get("", response_model=list[HabitResponse])
async def list_habits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Devuelve todos los hábitos del usuario autenticado."""
    return db.query(Habit).filter(Habit.id_user == current_user.id).all()


@router.post("", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
async def create_habit(
    habit_data: HabitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Crea un nuevo hábito para el usuario autenticado."""
    existing = db.query(Habit).filter(
        Habit.name == habit_data.name,
        Habit.id_user == current_user.id,
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya tienes un hábito con ese nombre",
        )

    new_habit = Habit(
        name=habit_data.name,
        goal=habit_data.goal,
        color=habit_data.color,
        id_user=current_user.id,
    )
    db.add(new_habit)
    db.commit()
    db.refresh(new_habit)
    return new_habit


@router.put("/{habit_id}", response_model=HabitResponse)
async def update_habit(
    habit_id: int,
    habit_data: HabitUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Edita un hábito (solo si pertenece al usuario autenticado)."""
    habit = db.query(Habit).filter(
        Habit.id == habit_id,
        Habit.id_user == current_user.id,
    ).first()

    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hábito no encontrado",
        )

    for field, value in habit_data.model_dump(exclude_unset=True).items():
        setattr(habit, field, value)

    db.commit()
    db.refresh(habit)
    return habit


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_habit(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Elimina un hábito (solo si pertenece al usuario autenticado)."""
    habit = db.query(Habit).filter(
        Habit.id == habit_id,
        Habit.id_user == current_user.id,
    ).first()

    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hábito no encontrado",
        )

    db.delete(habit)
    db.commit()


def _update_global_streak(current_user: User, db: Session):
    """Recalcula y actualiza la racha global tras un toggle."""
    today = date.today()
    yesterday = today - timedelta(days=1)

    all_habits = db.query(Habit).filter(Habit.id_user == current_user.id).all()
    all_completed_today = len(all_habits) > 0 and all(
        h.last_completed_date == today for h in all_habits
    )

    stats = db.query(UserHabitStats).filter(UserHabitStats.id_user == current_user.id).first()
    if stats is None:
        stats = UserHabitStats(id_user=current_user.id, global_streak=0, last_all_completed_date=None)
        db.add(stats)

    if all_completed_today:
        if stats.last_all_completed_date != today:
            # Primera vez que se completa todo hoy
            if stats.last_all_completed_date is not None and stats.last_all_completed_date >= yesterday:
                stats.global_streak += 1   # Días consecutivos
            else:
                stats.global_streak = 1    # Racha nueva o rota
            stats.last_all_completed_date = today
    else:
        # Se desmarcó el último que completaba el 100%
        if stats.last_all_completed_date == today:
            stats.global_streak = max(0, stats.global_streak - 1)
            stats.last_all_completed_date = yesterday if stats.global_streak > 0 else None

    db.commit()


@router.post("/{habit_id}/toggle", response_model=HabitResponse)
async def toggle_habit(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Marca o desmarca un hábito como completado hoy.

    Lógica de racha individual (con día de cortesía):
    - Ya completado hoy         → desmarca (racha -1)
    - Completado ayer o anteayer → sigue la racha (racha +1, sin perderla)
    - Más de 2 días sin marcar  → racha rota, reinicia a 1

    Además actualiza la racha global (días con 100% completado).
    """
    habit = db.query(Habit).filter(
        Habit.id == habit_id,
        Habit.id_user == current_user.id,
    ).first()

    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hábito no encontrado",
        )

    today = date.today()
    two_days_ago = today - timedelta(days=2)

    if habit.last_completed_date == today:
        # Desmarcar: revertir
        habit.streak = max(0, habit.streak - 1)
        habit.last_completed_date = None
    elif habit.last_completed_date is not None and habit.last_completed_date >= two_days_ago:
        # Dentro del período de gracia (ayer o anteayer): la racha sigue
        habit.streak += 1
        habit.last_completed_date = today
    else:
        # Primera vez o racha rota (más de 2 días sin marcar)
        habit.streak = 1
        habit.last_completed_date = today

    db.commit()
    db.refresh(habit)

    # Actualizar racha global
    _update_global_streak(current_user, db)

    return habit
