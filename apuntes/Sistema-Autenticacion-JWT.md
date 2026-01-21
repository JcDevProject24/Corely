# Sistema de Autenticación JWT - Corely

**Fecha de implementación:** 20 de enero de 2026
**Migración:** Supabase → FastAPI + JWT

---

## 📋 Resumen Ejecutivo

Hemos migrado completamente el sistema de autenticación de Supabase a un backend propio con FastAPI y JWT (JSON Web Tokens). Esto nos da control total sobre la autenticación, elimina dependencias de servicios externos y permite personalización completa.

---

## 🏗️ Estructura del Backend Implementada

```
backend/
├── config.py                    # Configuración global (SECRET_KEY, JWT settings)
├── main.py                      # Aplicación principal FastAPI
├── requirements.txt             # Dependencias Python
│
├── models/
│   ├── __init__.py
│   └── user.py                  # Modelo SQLAlchemy del usuario
│
└── auth/
    ├── __init__.py
    ├── router.py                # Endpoints de autenticación
    ├── schemas.py               # Schemas Pydantic (validación)
    ├── utils.py                 # Utilidades (hash, JWT)
    └── dependencies.py          # Dependencies de FastAPI (protección)
```

---

## 🔐 ¿Qué son los JWT (JSON Web Tokens)?

### Concepto básico

Un JWT es un **token autofirmado** que contiene información del usuario codificada. Es como un "carnet digital" que el servidor crea y firma, y que el cliente guarda y presenta en cada petición.

### Estructura de un JWT

Un JWT tiene 3 partes separadas por puntos:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
|____________HEADER_____________|.|____________PAYLOAD____________|.|____________SIGNATURE____________|
```

1. **Header**: Algoritmo usado (HS256 en nuestro caso)
2. **Payload**: Datos del usuario (user_id, email, exp)
3. **Signature**: Firma criptográfica que garantiza que no ha sido alterado

### Ventajas de JWT

- **Stateless**: El servidor no necesita guardar sesiones en memoria
- **Escalable**: Funciona perfectamente en arquitecturas distribuidas
- **Autónomo**: Toda la info está en el token
- **Seguro**: Firmado criptográficamente (nadie puede alterarlo sin la SECRET_KEY)

### ¿Por qué es seguro?

La **firma** se genera con una **SECRET_KEY** que solo conoce el servidor. Si alguien intenta modificar el token, la firma no coincidirá y el servidor lo rechazará.

---

## 📁 Explicación de Archivos del Backend

### 1. `config.py` - Configuración Global

**Propósito:** Centralizar todas las configuraciones de la aplicación.

```python
class Settings(BaseSettings):
    SECRET_KEY: str = "clave_secreta_para_firmar_tokens"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 30
    DATABASE_URL: str = "mysql+pymysql://..."
```

**Por qué existe:**
- Evita hardcodear valores en múltiples archivos
- Permite leer variables de entorno (archivo `.env`)
- Facilita cambios de configuración entre desarrollo/producción

**SECRET_KEY:** Es la clave maestra para firmar los JWT. **Debe ser única y secreta en producción.**

---

### 2. `models/user.py` - Modelo de Usuario

**Propósito:** Define la estructura de la tabla `users` en la base de datos.

```python
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
```

**Campos importantes:**
- `email`: Único, usado para login
- `hashed_password`: Contraseña hasheada (NUNCA se guarda en texto plano)
- `username`: Nombre para mostrar en la UI

**Por qué hashed_password:** Por seguridad. Si alguien roba la base de datos, no puede ver las contraseñas reales.

---

### 3. `auth/schemas.py` - Validación de Datos

**Propósito:** Define los formatos de entrada/salida de la API usando Pydantic.

```python
# Lo que recibimos al registrar
class UserCreate(BaseModel):
    email: EmailStr        # Valida formato de email
    username: str
    password: str

# Lo que devolvemos (sin password)
class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    created_at: datetime
```

**Por qué usar schemas:**
- **Validación automática**: Pydantic verifica que el email sea válido, etc.
- **Seguridad**: Nunca devolvemos el password al cliente
- **Documentación**: FastAPI genera automáticamente la documentación en `/docs`

---

### 4. `auth/utils.py` - Utilidades de Seguridad

**Propósito:** Funciones para hashear contraseñas y manejar JWT.

#### Funciones clave:

**a) `hash_password(password: str) -> str`**
```python
def hash_password(password: str) -> str:
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')
```

- **Qué hace:** Convierte una contraseña legible en un hash ilegible
- **Ejemplo:** `"miPassword123"` → `"$2b$12$KIXxC3.../xyz"`
- **Por qué:** Si roban la BD, no pueden ver las contraseñas reales
- **bcrypt:** Algoritmo diseñado para ser lento → dificulta ataques de fuerza bruta

**b) `verify_password(plain, hashed) -> bool`**
```python
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'),
                         hashed_password.encode('utf-8'))
```

- **Qué hace:** Comprueba si una contraseña coincide con su hash
- **Usado en:** Login, para verificar credenciales

**c) `create_access_token(data: dict) -> str`**
```python
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=30)
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
    return encoded_jwt
```

- **Qué hace:** Crea un JWT con los datos del usuario
- **Payload típico:** `{"user_id": 1, "email": "test@example.com", "exp": 1738281600}`
- **exp:** Fecha de expiración (30 días después)

**d) `verify_token(token: str) -> dict | None`**
```python
def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except JWTError:
        return None
```

- **Qué hace:** Decodifica y verifica un JWT
- **Retorna:** Datos del token si es válido, `None` si es inválido/expirado

---

### 5. `auth/dependencies.py` - Protección de Endpoints

**Propósito:** Dependency de FastAPI que protege rutas privadas.

```python
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials

    # 1. Verificar token
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Token inválido")

    # 2. Buscar usuario en BD
    user_id = payload.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    return user
```

**Cómo se usa:**
```python
@router.get("/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    # Si llegamos aquí, el usuario está autenticado
    return current_user
```

**Proceso:**
1. Cliente envía: `Authorization: Bearer <token>`
2. Dependency extrae el token
3. Verifica la firma y decodifica
4. Busca el usuario en la base de datos
5. Si todo está OK, devuelve el usuario
6. Si algo falla, retorna `401 Unauthorized`

---

### 6. `auth/router.py` - Endpoints de Autenticación

**Propósito:** Define las rutas de la API de autenticación.

#### **POST /auth/register**

```python
@router.post("/register", status_code=201)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # 1. Verificar si email existe
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(400, "El email ya está registrado")

    # 2. Crear usuario con password hasheada
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hash_password(user_data.password),
    )

    # 3. Guardar en BD
    db.add(new_user)
    db.commit()

    return {"message": "Usuario creado", "user": {...}}
```

**Flujo:**
1. Valida el formato del email
2. Verifica que el email no esté registrado
3. Hashea la contraseña
4. Crea el usuario en la base de datos
5. Retorna confirmación

---

#### **POST /auth/login**

```python
@router.post("/login")
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    # 1. Buscar usuario por email
    user = db.query(User).filter(User.email == credentials.email).first()

    # 2. Verificar password
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(401, "Credenciales incorrectas")

    # 3. Crear JWT
    access_token = create_access_token({
        "user_id": user.id,
        "email": user.email
    })

    # 4. Devolver token + datos del usuario
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {...}
    }
```

**Flujo:**
1. Busca el usuario por email
2. Verifica la contraseña con bcrypt
3. Si es correcto, genera un JWT
4. Devuelve el token al cliente
5. Cliente guarda el token en `localStorage`

---

#### **GET /auth/me** (Protegida)

```python
@router.get("/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        created_at=current_user.created_at,
    )
```

**Flujo:**
1. Cliente envía: `Authorization: Bearer <token>`
2. Dependency `get_current_user` verifica el token
3. Si es válido, devuelve los datos del usuario
4. Usado por el frontend para verificar si hay sesión activa

---

### 7. `main.py` - Aplicación Principal

**Cambios realizados:**

```python
# Importar configuración y modelos
from config import settings
from models.user import Base, User
from auth.router import router as auth_router

# CORS configurado para permitir frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción: ["https://corely.es"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir router de autenticación
app.include_router(auth_router)
```

**Por qué CORS:**
- Frontend (localhost:5173) y Backend (localhost:8000) son orígenes distintos
- Sin CORS, el navegador bloquea las peticiones por seguridad
- `allow_origins=["*"]` permite cualquier origen (OK para desarrollo)

---

## 🎨 Frontend - Archivos Actualizados

### 1. `AuthContext.tsx` - Context de Autenticación

**Cambios principales:**

**ANTES (Supabase):**
```typescript
const { data, error } = await supabase.auth.signIn({ email, password })
```

**AHORA (Backend propio):**
```typescript
const response = await fetch('http://localhost:8000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
})
const data = await response.json()
localStorage.setItem('access_token', data.access_token)
```

**Funciones implementadas:**

**a) `signUpNewUser(email, password, username)`**
- Hace POST a `/auth/register`
- Si tiene éxito, hace login automáticamente

**b) `lognInUser(email, password)`**
- Hace POST a `/auth/login`
- Guarda el token en `localStorage`
- Actualiza el estado del usuario

**c) `logOut()`**
- Elimina el token de `localStorage`
- Limpia el estado del usuario
- Redirige a `/login`

**d) `checkAuth()` (ejecutado al cargar la app)**
- Lee el token de `localStorage`
- Hace GET a `/auth/me` con el token
- Si es válido, establece el usuario
- Si es inválido, limpia la sesión

---

### 2. `LoginPage.tsx` y `SignupPage.tsx`

**Cambios:**
- Descomentadas las llamadas a `lognInUser()` y `signUpNewUser()`
- Activada la navegación con React Router
- Manejo de errores mejorado

**Flujo de Login:**
1. Usuario ingresa email y password
2. Se valida el formulario
3. Se llama a `lognInUser(email, password)`
4. Si es exitoso → Guarda token → Redirige a `/`
5. Si falla → Muestra error

---

### 3. `PrivateRoute.tsx` y `PublicRoute.tsx`

**Funcionamiento:**

**PrivateRoute:** Protege rutas privadas (dashboard)
```typescript
return user ? <>{children}</> : <Navigate to="/login" replace />;
```
- Si hay usuario → Muestra el contenido
- Si no hay usuario → Redirige a login

**PublicRoute:** Evita que usuarios autenticados accedan al login
```typescript
return !user ? <>{children}</> : <Navigate to="/" replace />;
```
- Si no hay usuario → Muestra login/signup
- Si hay usuario → Redirige al dashboard

---

### 4. `DashboardLayout.tsx`

**Actualización:**
```typescript
const { user } = userAuth();

return (
    <h2>Bienvenido {user?.username}!</h2>
)
```

Ahora muestra el nombre del usuario obtenido del AuthContext.

---

### 5. `SettingsPage.tsx` - Nueva Funcionalidad

**Implementación completa del logout:**

```typescript
const { logOut, user } = userAuth();

const handleLogOut = async () => {
    await logOut();
    navigate("/login");
};
```

**Características:**
- Muestra información del usuario (username, email)
- Botón de cerrar sesión con diseño atractivo
- Al cerrar sesión:
  - Elimina el token
  - Limpia el estado
  - Redirige a login

---

## 🔄 Flujo Completo de Autenticación

### 1. Registro de Usuario

```
FRONTEND                  BACKEND                   DATABASE
  |                         |                          |
  |-- POST /auth/register ->|                          |
  |   { email, username,    |                          |
  |     password }          |                          |
  |                         |-- Hashear password       |
  |                         |                          |
  |                         |-- INSERT INTO users ---->|
  |                         |                          |
  |<---- 201 Created -------|                          |
  |   { message, user }     |                          |
  |                         |                          |
  |-- POST /auth/login ---->| (login automático)       |
```

### 2. Login

```
FRONTEND                  BACKEND                   DATABASE
  |                         |                          |
  |-- POST /auth/login ---->|                          |
  |   { email, password }   |                          |
  |                         |-- SELECT * FROM users -->|
  |                         |<---- user data ----------|
  |                         |                          |
  |                         |-- verify_password()      |
  |                         |-- create_access_token()  |
  |                         |                          |
  |<---- 200 OK ------------|                          |
  |   { access_token,       |                          |
  |     user }              |                          |
  |                         |                          |
  |-- Guardar token en      |                          |
  |   localStorage          |                          |
```

### 3. Acceso a Ruta Protegida

```
FRONTEND                  BACKEND                   DATABASE
  |                         |                          |
  |-- GET /auth/me -------->|                          |
  |   Header: Authorization |                          |
  |   Bearer <token>        |                          |
  |                         |-- verify_token()         |
  |                         |-- decode JWT             |
  |                         |   { user_id: 1, ... }    |
  |                         |                          |
  |                         |-- SELECT * FROM users -->|
  |                         |<---- user data ----------|
  |                         |                          |
  |<---- 200 OK ------------|                          |
  |   { id, email,          |                          |
  |     username }          |                          |
```

### 4. Logout

```
FRONTEND                  BACKEND
  |                         |
  |-- Eliminar token de     |
  |   localStorage          |
  |                         |
  |-- Limpiar estado        |
  |   (user = null)         |
  |                         |
  |-- Navigate('/login')    |
```

**Nota:** El logout es principalmente del lado del cliente. El token sigue siendo válido hasta que expire, pero el cliente lo descarta.

---

## 🔒 Consideraciones de Seguridad

### 1. **Contraseñas Hasheadas**
- NUNCA guardamos contraseñas en texto plano
- Usamos bcrypt (algoritmo diseñado para ser lento)
- Cada contraseña tiene un "salt" único

### 2. **SECRET_KEY**
- Debe ser única y compleja en producción
- Si alguien la conoce, puede falsificar tokens
- Cambiarla invalida todos los tokens existentes

### 3. **HTTPS en Producción**
- Los tokens viajan en headers HTTP
- Sin HTTPS, pueden ser interceptados
- SIEMPRE usar HTTPS en producción

### 4. **Expiración de Tokens**
- Tokens configurados para expirar en 30 días
- Limita el daño si un token es robado
- Se puede reducir a 1-7 días para mayor seguridad

### 5. **CORS Restrictivo**
```python
# Desarrollo
allow_origins=["*"]

# Producción
allow_origins=["https://corely.es"]
```

### 6. **Validación de Entrada**
- Pydantic valida automáticamente formatos
- EmailStr verifica que sea un email válido
- Previene inyecciones SQL (SQLAlchemy ORM)

---

## 📦 Dependencias Instaladas

```txt
fastapi                    # Framework web
uvicorn[standard]          # Servidor ASGI
sqlalchemy                 # ORM para base de datos
pymysql                    # Driver MySQL/MariaDB
python-jose[cryptography]  # Librería JWT
bcrypt                     # Hash de contraseñas
python-multipart           # Manejo de forms
pydantic-settings          # Configuración con .env
email-validator            # Validación de emails
```

---

## 🚀 Cómo Levantar el Sistema

### Backend:
```bash
cd backend

# Activar entorno virtual
.\venv\Scripts\Activate.ps1

# Instalar dependencias (solo primera vez)
pip install -r requirements.txt

# Levantar servidor
uvicorn main:app --reload
```

### Frontend:
```bash
cd frontend
npm run dev
```

### Base de Datos:
```bash
docker-compose up -d db
```

---

## 🎯 Endpoints de la API

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Registrar nuevo usuario | No |
| POST | `/auth/login` | Iniciar sesión | No |
| GET | `/auth/me` | Obtener usuario actual | Sí (Bearer token) |
| POST | `/auth/logout` | Cerrar sesión | No (solo frontend) |

### Documentación interactiva:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## 🐛 Problemas Comunes y Soluciones

### 1. Error de CORS
**Problema:** `Access-Control-Allow-Origin header is missing`
**Solución:** Verificar que CORS esté configurado en `main.py`

### 2. Error de bcrypt
**Problema:** `ValueError: password cannot be longer than 72 bytes`
**Solución:** Ya resuelto, usamos bcrypt directamente sin passlib

### 3. Token expirado
**Problema:** `401 Unauthorized` en rutas protegidas
**Solución:** Hacer logout y login nuevamente

### 4. MariaDB no conecta
**Problema:** `OperationalError: Can't connect to MySQL server`
**Solución:** Verificar que el contenedor esté corriendo: `docker ps`

---

## 📝 Próximas Mejoras

1. **Refresh Tokens:** Tokens de larga duración para renovar access tokens
2. **Blacklist de Tokens:** Invalidar tokens antes de expirar
3. **Rate Limiting:** Limitar intentos de login
4. **2FA (Two-Factor Auth):** Autenticación de dos factores
5. **Recuperación de contraseña:** Envío de emails con links de reset
6. **Roles y permisos:** Admin, user, etc.

---

## 🎓 Conceptos Clave Aprendidos

1. **JWT vs Sesiones:** JWT es stateless, las sesiones requieren almacenamiento en servidor
2. **Hash vs Cifrado:** El hash es unidireccional (no se puede revertir)
3. **Bearer Token:** Estándar para enviar tokens en headers HTTP
4. **Dependency Injection:** Patrón usado por FastAPI para reutilizar lógica
5. **CORS:** Mecanismo de seguridad del navegador
6. **ORM (SQLAlchemy):** Trabajar con BD sin escribir SQL directamente

---

## 📚 Recursos Adicionales

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [JWT.io](https://jwt.io/) - Decodificar y debuggear tokens
- [bcrypt Explained](https://auth0.com/blog/hashing-in-action-understanding-bcrypt/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/en/20/)

---

**Implementado por:** Claude Code
**Fecha:** 20 de enero de 2026
**Proyecto:** Corely - Sistema de Gestión
