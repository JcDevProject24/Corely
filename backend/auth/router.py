from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth.schemas import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
    SocialAccountResponse,
    SetPasswordRequest,
)
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

    # Verificar si el username ya existe
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya está en uso",
        )

    # Crear nuevo usuario con contraseña hasheada
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
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
    # Buscar usuario por username o email
    user = db.query(User).filter(
        (User.username == credentials.username) | (User.email == credentials.username)
    ).first()

    # Verificar que el usuario existe y tiene password
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verificar contraseña
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Crear token JWT
    access_token = create_access_token(data={"user_id": user.id, "email": user.email})

    # Preparar social accounts para la respuesta
    social_accounts = [
        SocialAccountResponse(
            id=sa.id,
            provider=sa.provider,
            provider_email=sa.provider_email,
            created_at=sa.created_at,
        )
        for sa in user.social_accounts
    ]

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            avatar_url=user.avatar_url,
            is_email_verified=user.is_email_verified,
            has_password=user.has_password,
            created_at=user.created_at,
            social_accounts=social_accounts,
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
    social_accounts = [
        SocialAccountResponse(
            id=sa.id,
            provider=sa.provider,
            provider_email=sa.provider_email,
            created_at=sa.created_at,
        )
        for sa in current_user.social_accounts
    ]

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        avatar_url=current_user.avatar_url,
        is_email_verified=current_user.is_email_verified,
        has_password=current_user.has_password,
        created_at=current_user.created_at,
        social_accounts=social_accounts,
    )


@router.post("/logout")
async def logout():
    """
    Endpoint de logout (opcional)
    En una implementación con JWT sin blacklist, el logout se maneja en el frontend
    eliminando el token del localStorage
    """
    return {"message": "Logout exitoso. Elimina el token del cliente."}


@router.post("/set-password")
async def set_password(
    request: SetPasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Establece o actualiza la contraseña del usuario.
    Util para usuarios OAuth que quieren agregar login con password.
    """
    if len(request.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 6 caracteres",
        )

    current_user.hashed_password = hash_password(request.password)
    db.commit()

    return {"message": "Contraseña establecida exitosamente"}
