from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import os

# 1. URL de conexión para MariaDB/MySQL
# Estructura: mysql+pymysql://usuario:password@host:puerto/nombre_db
DATABASE_URL = os.getenv(
    "DATABASE_URL", "mysql+pymysql://root:root_password@localhost:3306/mi_tfg_db"
)

# El resto es prácticamente IGUAL que antes
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100)) # En MariaDB conviene poner longitud al String

# Crear tablas
Base.metadata.create_all(bind=engine)

# --- SCRIPT DE DATOS DE PRUEBA (SEEDER) ---
db = SessionLocal()
if db.query(Usuario).count() == 0:
    print("Base de datos vacía, insertando datos de prueba...")
    usuarios_iniciales = [
        Usuario(nombre="Pepe de Prueba"),
        Usuario(nombre="Juan de Prueba"),
        Usuario(nombre="Marta de Prueba")
    ]
    db.add_all(usuarios_iniciales)
    db.commit()
db.close()
# ------------------------------------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/usuarios")
def obtener_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).all()

@app.get("/")
def home():
    return {"status": "Backend con MariaDB funcionando"}