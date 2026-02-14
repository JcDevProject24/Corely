import secrets
import hashlib
import time
from typing import Optional
from sqlalchemy.orm import Session

from auth.oauth.base import OAuthProvider, OAuthUserInfo
from auth.oauth.facebook import FacebookProvider
from auth.oauth.instagram import InstagramProvider
from auth.utils import create_access_token
from models.user import User
from models.social_account import SocialAccount
from config import settings


class OAuthService:
    """Servicio para manejar la logica de negocio de OAuth"""

    # Registro de proveedores disponibles
    _providers: dict[str, OAuthProvider] = {
        "facebook": FacebookProvider(),
        "instagram": InstagramProvider(),
    }

    # Cache simple para states (en produccion usar Redis)
    _state_cache: dict[str, float] = {}
    STATE_EXPIRY_SECONDS = 600  # 10 minutos

    @classmethod
    def get_provider(cls, provider_name: str) -> Optional[OAuthProvider]:
        """Obtiene un proveedor por nombre"""
        return cls._providers.get(provider_name)

    @classmethod
    def get_available_providers(cls) -> list[dict]:
        """Retorna lista de proveedores disponibles con su configuracion"""
        providers = []

        if settings.FACEBOOK_CLIENT_ID:
            providers.append({
                "name": "facebook",
                "display_name": "Facebook",
                "enabled": True,
            })

        if settings.INSTAGRAM_CLIENT_ID:
            providers.append({
                "name": "instagram",
                "display_name": "Instagram",
                "enabled": True,
            })

        return providers

    @classmethod
    def generate_state(cls) -> str:
        """Genera un state token seguro para CSRF protection"""
        random_bytes = secrets.token_bytes(32)
        timestamp = str(time.time()).encode()
        state_data = random_bytes + timestamp + settings.OAUTH_STATE_SECRET.encode()
        state = hashlib.sha256(state_data).hexdigest()

        # Guardar en cache con timestamp
        cls._state_cache[state] = time.time()
        cls._cleanup_expired_states()

        return state

    @classmethod
    def verify_state(cls, state: str) -> bool:
        """Verifica que el state sea valido y no haya expirado"""
        if state not in cls._state_cache:
            return False

        created_at = cls._state_cache[state]
        if time.time() - created_at > cls.STATE_EXPIRY_SECONDS:
            del cls._state_cache[state]
            return False

        # Eliminar state despues de verificarlo (one-time use)
        del cls._state_cache[state]
        return True

    @classmethod
    def _cleanup_expired_states(cls):
        """Limpia states expirados del cache"""
        current_time = time.time()
        expired = [
            state for state, created_at in cls._state_cache.items()
            if current_time - created_at > cls.STATE_EXPIRY_SECONDS
        ]
        for state in expired:
            del cls._state_cache[state]

    @classmethod
    def get_redirect_uri(cls, provider_name: str) -> str:
        """Genera la URI de callback para un proveedor"""
        return f"{settings.BACKEND_URL}/auth/oauth/{provider_name}/callback"

    @classmethod
    def find_or_create_user(
        cls, db: Session, user_info: OAuthUserInfo
    ) -> tuple[User, bool]:
        """
        Busca un usuario existente o crea uno nuevo basado en la info OAuth.

        Returns:
            tuple: (usuario, es_nuevo)
        """
        # 1. Buscar por cuenta social existente
        social_account = (
            db.query(SocialAccount)
            .filter(
                SocialAccount.provider == user_info.provider,
                SocialAccount.provider_user_id == user_info.provider_user_id,
            )
            .first()
        )

        if social_account:
            # Usuario ya existe con esta cuenta social
            return social_account.user, False

        # 2. Si hay email, buscar usuario existente por email
        user = None
        if user_info.email:
            user = db.query(User).filter(User.email == user_info.email).first()

        # 3. Si no existe usuario, crear uno nuevo
        is_new = False
        if not user:
            # Generar username unico
            base_username = user_info.name or f"{user_info.provider}_user"
            username = cls._generate_unique_username(db, base_username)

            # Para usuarios sin email (ej: Instagram), generar email placeholder
            email = user_info.email
            if not email:
                email = f"{user_info.provider}_{user_info.provider_user_id}@oauth.local"

            user = User(
                email=email,
                username=username,
                hashed_password=None,  # Usuario OAuth sin password
                avatar_url=user_info.avatar_url,
                is_email_verified=user_info.email is not None,  # Verificado si viene del proveedor
            )
            db.add(user)
            db.flush()  # Para obtener el ID
            is_new = True

        # 4. Vincular cuenta social al usuario
        social_account = SocialAccount(
            user_id=user.id,
            provider=user_info.provider,
            provider_user_id=user_info.provider_user_id,
            provider_email=user_info.email,
        )
        db.add(social_account)
        db.commit()
        db.refresh(user)

        return user, is_new

    @classmethod
    def _generate_unique_username(cls, db: Session, base_username: str) -> str:
        """Genera un username unico agregando numeros si es necesario"""
        # Limpiar username
        username = "".join(c for c in base_username if c.isalnum() or c in "_-")[:50]
        if not username:
            username = "user"

        # Verificar si existe
        existing = db.query(User).filter(User.username == username).first()
        if not existing:
            return username

        # Agregar numero hasta encontrar uno disponible
        counter = 1
        while True:
            new_username = f"{username}_{counter}"
            existing = db.query(User).filter(User.username == new_username).first()
            if not existing:
                return new_username
            counter += 1

    @classmethod
    def unlink_social_account(
        cls, db: Session, user: User, provider: str
    ) -> bool:
        """
        Desvincula una cuenta social del usuario.

        Returns:
            bool: True si se desvinculo, False si no existia
        """
        social_account = (
            db.query(SocialAccount)
            .filter(
                SocialAccount.user_id == user.id,
                SocialAccount.provider == provider,
            )
            .first()
        )

        if not social_account:
            return False

        # Verificar que el usuario tenga otra forma de autenticarse
        other_social_accounts = (
            db.query(SocialAccount)
            .filter(
                SocialAccount.user_id == user.id,
                SocialAccount.provider != provider,
            )
            .count()
        )

        if not user.hashed_password and other_social_accounts == 0:
            raise ValueError(
                "No puedes desvincular tu unica forma de autenticacion. "
                "Primero establece una contrasena."
            )

        db.delete(social_account)
        db.commit()
        return True

    @classmethod
    def generate_jwt_for_user(cls, user: User) -> str:
        """Genera un JWT para el usuario"""
        return create_access_token(data={"user_id": user.id, "email": user.email})
