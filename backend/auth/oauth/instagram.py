from urllib.parse import urlencode
import httpx

from auth.oauth.base import OAuthProvider, OAuthUserInfo
from config import settings


class InstagramProvider(OAuthProvider):
    """
    Proveedor OAuth para Instagram Basic Display API.

    NOTA: Instagram Basic Display API esta siendo deprecada por Meta.
    Se recomienda migrar a Facebook Login con permisos de Instagram en el futuro.
    """

    @property
    def name(self) -> str:
        return "instagram"

    @property
    def authorization_url(self) -> str:
        return "https://api.instagram.com/oauth/authorize"

    @property
    def token_url(self) -> str:
        return "https://api.instagram.com/oauth/access_token"

    @property
    def user_info_url(self) -> str:
        return "https://graph.instagram.com/me"

    @property
    def scopes(self) -> list[str]:
        return ["user_profile", "user_media"]

    def get_authorization_url(self, redirect_uri: str, state: str) -> str:
        params = {
            "client_id": settings.INSTAGRAM_CLIENT_ID,
            "redirect_uri": redirect_uri,
            "scope": ",".join(self.scopes),
            "response_type": "code",
            "state": state,
        }
        return f"{self.authorization_url}?{urlencode(params)}"

    async def exchange_code_for_token(self, code: str, redirect_uri: str) -> str:
        data = {
            "client_id": settings.INSTAGRAM_CLIENT_ID,
            "client_secret": settings.INSTAGRAM_CLIENT_SECRET,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri,
            "code": code,
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.token_url,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            response.raise_for_status()
            result = response.json()
            return result["access_token"]

    async def get_user_info(self, access_token: str) -> OAuthUserInfo:
        params = {
            "fields": "id,username",
            "access_token": access_token,
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(self.user_info_url, params=params)
            response.raise_for_status()
            data = response.json()

            return OAuthUserInfo(
                provider=self.name,
                provider_user_id=data["id"],
                email=None,  # Instagram Basic Display API no proporciona email
                name=data.get("username"),
                avatar_url=None,  # Instagram Basic Display API no proporciona avatar
            )
