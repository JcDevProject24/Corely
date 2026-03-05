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
from models.task import Task    # noqa: F401 - necesario para que SQLAlchemy registre la tabla
from models.habits import Habit  # noqa: F401 - necesario para que SQLAlchemy registre la tabla
from auth.router import router as auth_router
from auth.oauth import router as oauth_router
from tasks.router import router as tasks_router
from habits.router import router as habits_router

# 1. URL de conexión para MariaDB/MySQL
DATABASE_URL = settings.DATABASE_URL

# El resto es prácticamente IGUAL que antes
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)



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

@asynccontextmanager
async def lifespan(_: FastAPI):
    wait_for_db()
    yield

app = FastAPI(lifespan=lifespan)

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
app.include_router(tasks_router)
app.include_router(habits_router)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()






@app.get("/")
def home():
    return {"status": "Backend con MariaDB funcionando"}
