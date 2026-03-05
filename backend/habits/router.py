from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date

from habits.schemas import HabitCreate, HabitUpdate, HabitResponse
from auth.dependencies import get_current_user, get_db
from models.habits import Habit
from models.user import User

router = APIRouter(prefix="/habits", tags=["Habits"])


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


@router.post("/{habit_id}/toggle", response_model=HabitResponse)
async def toggle_habit(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Marca o desmarca un hábito como completado hoy.
    - Si no estaba completado hoy: incrementa racha y guarda la fecha de hoy.
    - Si ya estaba completado hoy: decrementa racha (mín. 0) y borra la fecha.
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

    if habit.last_completed_date == today:
        # Desmarcar: revertir
        habit.streak = max(0, habit.streak - 1)
        habit.last_completed_date = None
    else:
        # Marcar como completado hoy
        habit.streak += 1
        habit.last_completed_date = today

    db.commit()
    db.refresh(habit)
    return habit
