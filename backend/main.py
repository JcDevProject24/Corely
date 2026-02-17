from contextlib import asynccontextmanager
import time
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import OperationalError
import os

# Importar configuración y modelos
from config import settings
from models.user import Base, User
from models.social_account import SocialAccount
from auth.router import router as auth_router
from auth.oauth import router as oauth_router

# 1. URL de conexión para MariaDB/MySQL
DATABASE_URL = settings.DATABASE_URL

# El resto es prácticamente IGUAL que antes
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100))  # En MariaDB conviene poner longitud al String


# Crear tablas
def wait_for_db():
    for i in range(10):
        try:
            Base.metadata.create_all(bind=engine)
            return
        except OperationalError:
            print("Esperando a la base de datos...")
            time.sleep(2)
    raise Exception("La BD no respondió")


# ------------------------------------------

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],  ## EN PRODUCCIÓN (corely.es) CAMBIAR "*" POR LA URL DEL FRONTEND
    allow_headers=["*"],
)

# Incluir routers de autenticación
app.include_router(auth_router)
app.include_router(oauth_router)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.on_event("startup")
def startup_event():
    wait_for_db()

    db = SessionLocal()
    try:
        if db.query(Usuario).count() == 0:
            db.add_all(
                [
                    Usuario(nombre="Pepe"),
                    Usuario(nombre="Juan"),
                    Usuario(nombre="Marta"),
                ]
            )
            db.commit()
    finally:
        db.close()


@app.get("/usuarios")
def obtener_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).all()


@app.get("/")
def home():
    return {"status": "Backend con MariaDB funcionando"}
