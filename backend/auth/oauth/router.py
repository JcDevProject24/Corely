from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from auth.oauth.service import OAuthService
from auth.dependencies import get_current_user, get_db
from models.user import User
from config import settings

router = APIRouter(prefix="/auth/oauth", tags=["OAuth"])


@router.get("/providers")
async def get_providers():
    """Lista los proveedores OAuth disponibles"""
    return {"providers": OAuthService.get_available_providers()}


@router.get("/{provider}/authorize")
async def authorize(provider: str):
    """
    Inicia el flujo OAuth redirigiendo al usuario al proveedor.
    """
    oauth_provider = OAuthService.get_provider(provider)
    if not oauth_provider:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Proveedor '{provider}' no soportado",
        )

    # Generar state para CSRF protection
    state = OAuthService.generate_state()
    redirect_uri = OAuthService.get_redirect_uri(provider)

    # Construir URL de autorizacion
    auth_url = oauth_provider.get_authorization_url(redirect_uri, state)

    return RedirectResponse(url=auth_url)


@router.get("/{provider}/callback")
async def callback(
    provider: str,
    code: str = None,
    state: str = None,
    error: str = None,
    error_description: str = None,
    db: Session = Depends(get_db),
):
    """
    Callback del proveedor OAuth.
    Intercambia el code por token, obtiene info del usuario, y redirige al frontend.
    """
    # Error del proveedor
    if error:
        error_msg = error_description or error
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/callback?error={error_msg}"
        )

    # Validar parametros
    if not code or not state:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/callback?error=Parametros invalidos"
        )

    # Verificar state (CSRF protection)
    if not OAuthService.verify_state(state):
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/callback?error=State invalido o expirado"
        )

    # Obtener proveedor
    oauth_provider = OAuthService.get_provider(provider)
    if not oauth_provider:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/callback?error=Proveedor no soportado"
        )

    try:
        # Intercambiar code por token
        redirect_uri = OAuthService.get_redirect_uri(provider)
        access_token = await oauth_provider.exchange_code_for_token(code, redirect_uri)

        # Obtener informacion del usuario
        user_info = await oauth_provider.get_user_info(access_token)

        # Buscar o crear usuario
        user, is_new = OAuthService.find_or_create_user(db, user_info)

        # Generar JWT
        jwt_token = OAuthService.generate_jwt_for_user(user)

        # Redirigir al frontend con el token
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/callback?token={jwt_token}&is_new={str(is_new).lower()}"
        )

    except Exception as e:
        print(f"Error en OAuth callback: {e}")
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/callback?error=Error de autenticacion"
        )


@router.delete("/unlink/{provider}")
async def unlink_provider(
    provider: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Desvincula una cuenta social del usuario actual.
    Requiere autenticacion.
    """
    try:
        success = OAuthService.unlink_social_account(db, current_user, provider)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No tienes una cuenta de {provider} vinculada",
            )
        return {"message": f"Cuenta de {provider} desvinculada exitosamente"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
