from abc import ABC, abstractmethod
from typing import Optional
from dataclasses import dataclass


@dataclass
class OAuthUserInfo:
    """Informacion del usuario obtenida del proveedor OAuth"""
    provider: str
    provider_user_id: str
    email: Optional[str]
    name: Optional[str]
    avatar_url: Optional[str]


class OAuthProvider(ABC):
    """Clase abstracta base para proveedores OAuth"""

    @property
    @abstractmethod
    def name(self) -> str:
        """Nombre del proveedor (facebook, instagram, etc.)"""
        pass

    @property
    @abstractmethod
    def authorization_url(self) -> str:
        """URL de autorizacion del proveedor"""
        pass

    @property
    @abstractmethod
    def token_url(self) -> str:
        """URL para intercambiar code por token"""
        pass

    @property
    @abstractmethod
    def scopes(self) -> list[str]:
        """Scopes requeridos"""
        pass

    @abstractmethod
    def get_authorization_url(self, redirect_uri: str, state: str) -> str:
        """Genera la URL completa de autorizacion"""
        pass

    @abstractmethod
    async def exchange_code_for_token(self, code: str, redirect_uri: str) -> str:
        """Intercambia el code por un access_token"""
        pass

    @abstractmethod
    async def get_user_info(self, access_token: str) -> OAuthUserInfo:
        """Obtiene la informacion del usuario usando el access_token"""
        pass
