from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from auth.utils import verify_token
from auth.schemas import TokenData
from models.user import User

# Configuración del esquema de seguridad Bearer
security = HTTPBearer()


def get_db():
    """Dependency para obtener la sesión de base de datos"""
    from main import SessionLocal

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency que verifica el token JWT y devuelve el usuario actual

    Args:
        credentials: Credenciales HTTP Bearer con el token JWT
        db: Sesión de base de datos

    Returns:
        Usuario actual si el token es válido

    Raises:
        HTTPException: Si el token es inválido o el usuario no existe
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Obtener el token del header Authorization
    token = credentials.credentials

    # Verificar y decodificar el token
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception

    # Extraer el user_id del payload
    user_id: Optional[int] = payload.get("user_id")
    if user_id is None:
        raise credentials_exception

    # Buscar el usuario en la base de datos
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    return user
