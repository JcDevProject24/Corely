from auth.oauth.base import OAuthProvider
from auth.oauth.facebook import FacebookProvider
from auth.oauth.instagram import InstagramProvider
from auth.oauth.service import OAuthService
from auth.oauth.router import router as oauth_router

__all__ = [
    "OAuthProvider",
    "FacebookProvider",
    "InstagramProvider",
    "OAuthService",
    "oauth_router",
]
