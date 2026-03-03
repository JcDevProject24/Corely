from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from tasks.schemas import TaskCreate, TaskUpdate, TaskResponse
from auth.dependencies import get_current_user, get_db
from models.task import Task
from models.user import User

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get("", response_model=list[TaskResponse])
async def list_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Devuelve todas las tareas del usuario autenticado."""
    return db.query(Task).filter(Task.id_user == current_user.id).all()


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Crea una nueva tarea para el usuario autenticado."""
    existing = db.query(Task).filter(
        Task.name == task_data.name,
        Task.id_user == current_user.id,
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya tienes una tarea con ese nombre",
        )

    new_task = Task(
        name=task_data.name,
        priority=task_data.priority,
        status=task_data.status,
        due_date=task_data.due_date,
        id_user=current_user.id,
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Edita una tarea (solo si pertenece al usuario autenticado)."""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.id_user == current_user.id,
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarea no encontrada",
        )

    for field, value in task_data.model_dump(exclude_unset=True).items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Elimina una tarea (solo si pertenece al usuario autenticado)."""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.id_user == current_user.id,
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarea no encontrada",
        )

    db.delete(task)
    db.commit()
