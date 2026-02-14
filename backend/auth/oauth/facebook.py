from urllib.parse import urlencode
import httpx

from auth.oauth.base import OAuthProvider, OAuthUserInfo
from config import settings


class FacebookProvider(OAuthProvider):
    """Proveedor OAuth para Facebook"""

    @property
    def name(self) -> str:
        return "facebook"

    @property
    def authorization_url(self) -> str:
        return "https://www.facebook.com/v18.0/dialog/oauth"

    @property
    def token_url(self) -> str:
        return "https://graph.facebook.com/v18.0/oauth/access_token"

    @property
    def user_info_url(self) -> str:
        return "https://graph.facebook.com/v18.0/me"

    @property
    def scopes(self) -> list[str]:
        return ["email", "public_profile"]

    def get_authorization_url(self, redirect_uri: str, state: str) -> str:
        params = {
            "client_id": settings.FACEBOOK_CLIENT_ID,
            "redirect_uri": redirect_uri,
            "state": state,
            "scope": ",".join(self.scopes),
            "response_type": "code",
        }
        return f"{self.authorization_url}?{urlencode(params)}"

    async def exchange_code_for_token(self, code: str, redirect_uri: str) -> str:
        params = {
            "client_id": settings.FACEBOOK_CLIENT_ID,
            "client_secret": settings.FACEBOOK_CLIENT_SECRET,
            "code": code,
            "redirect_uri": redirect_uri,
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(self.token_url, params=params)
            response.raise_for_status()
            data = response.json()
            return data["access_token"]

    async def get_user_info(self, access_token: str) -> OAuthUserInfo:
        params = {
            "fields": "id,name,email,picture.type(large)",
            "access_token": access_token,
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(self.user_info_url, params=params)
            response.raise_for_status()
            data = response.json()

            # Extraer URL del avatar
            avatar_url = None
            if "picture" in data and "data" in data["picture"]:
                avatar_url = data["picture"]["data"].get("url")

            return OAuthUserInfo(
                provider=self.name,
                provider_user_id=data["id"],
                email=data.get("email"),
                name=data.get("name"),
                avatar_url=avatar_url,
            )
