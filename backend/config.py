from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    # JWT Configuration
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "tu_clave_super_secreta_cambiar_en_produccion_2024_corely_jwt_secret_key",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 30

    # Database Configuration
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:root_password@localhost:3306/mi_tfg_db",
    )

    # URLs
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")

    # Google OAuth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")

    class Config:
        env_file = ".env"


settings = Settings()
