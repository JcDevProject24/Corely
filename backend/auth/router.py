from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth.schemas import UserCreate, UserLogin, UserResponse, TokenResponse
from auth.utils import hash_password, verify_password, create_access_token
from auth.dependencies import get_current_user, get_db
from models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Endpoint para registrar un nuevo usuario

    Args:
        user_data: Datos del nuevo usuario (email, username, password)
        db: Sesión de base de datos

    Returns:
        Mensaje de éxito y datos básicos del usuario creado

    Raises:
        HTTPException 400: Si el email ya está registrado
    """
    # Verificar si el email ya existe
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado",
        )

    # Crear nuevo usuario con contraseña hasheada
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hash_password(user_data.password),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Usuario creado exitosamente",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "username": new_user.username,
        },
    }


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Endpoint para iniciar sesión

    Args:
        credentials: Credenciales de login (email, password)
        db: Sesión de base de datos

    Returns:
        Token JWT y datos del usuario

    Raises:
        HTTPException 401: Si las credenciales son inválidas
    """
    # Buscar usuario por email
    user = db.query(User).filter(User.email == credentials.email).first()

    # Verificar que el usuario existe y la contraseña es correcta
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Crear token JWT
    access_token = create_access_token(data={"user_id": user.id, "email": user.email})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            created_at=user.created_at,
        ),
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Endpoint protegido que devuelve la información del usuario actual

    Args:
        current_user: Usuario actual obtenido del token JWT

    Returns:
        Datos del usuario actual
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        created_at=current_user.created_at,
    )


@router.post("/logout")
async def logout():
    """
    Endpoint de logout (opcional)
    En una implementación con JWT sin blacklist, el logout se maneja en el frontend
    eliminando el token del localStorage
    """
    return {"message": "Logout exitoso. Elimina el token del cliente."}
