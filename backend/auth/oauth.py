from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
import httpx

from config import settings
from auth.schemas import TokenResponse, UserResponse, SocialAccountResponse
from auth.utils import create_access_token
from auth.dependencies import get_db
from models.user import User
from models.social_account import SocialAccount

router = APIRouter(prefix="/auth", tags=["OAuth"])


class GoogleAuthRequest(BaseModel):
    code: str


@router.post("/google", response_model=TokenResponse)
async def google_auth(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Autentica usuario con Google OAuth.
    - Recibe el authorization code del frontend
    - Intercambia por tokens con Google
    - Crea usuario si no existe, o lo loguea si ya existe
    """

    # 1. Intercambiar code por tokens con Google
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": request.code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": "postmessage",
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient() as client:
        token_response = await client.post(token_url, data=token_data)

        if token_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Error al obtener tokens de Google",
            )

        tokens = token_response.json()
        access_token = tokens.get("access_token")

        # 2. Obtener info del usuario de Google
        userinfo_response = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        if userinfo_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Error al obtener información del usuario de Google",
            )

        google_user = userinfo_response.json()

    google_id = google_user.get("sub")
    email = google_user.get("email")
    name = google_user.get("name", email.split("@")[0])
    picture = google_user.get("picture")

    # 3. Buscar si ya existe una cuenta social con este google_id
    social_account = (
        db.query(SocialAccount)
        .filter(
            SocialAccount.provider == "google",
            SocialAccount.provider_user_id == google_id,
        )
        .first()
    )

    if social_account:
        # Usuario existente - login
        user = social_account.user
    else:
        # 4. Buscar si existe un usuario con este email
        user = db.query(User).filter(User.email == email).first()

        if user:
            # Vincular cuenta de Google a usuario existente
            social_account = SocialAccount(
                user_id=user.id,
                provider="google",
                provider_user_id=google_id,
                provider_email=email,
            )
            db.add(social_account)
        else:
            # Crear nuevo usuario
            user = User(
                email=email,
                username=name,
                avatar_url=picture,
                is_email_verified=True,  # Google ya verifico el email
            )
            db.add(user)
            db.flush()  # Para obtener el user.id

            # Crear cuenta social
            social_account = SocialAccount(
                user_id=user.id,
                provider="google",
                provider_user_id=google_id,
                provider_email=email,
            )
            db.add(social_account)

        db.commit()
        db.refresh(user)

    # 5. Crear JWT token
    jwt_token = create_access_token(data={"user_id": user.id, "email": user.email})

    # 6. Preparar respuesta
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
        access_token=jwt_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            avatar_url=user.avatar_url,
            is_email_verified=user.is_email_verified,
            has_password=user.has_password,
            created_at=user.created_at,
            social_accounts=social_accounts,
        ),
    )
