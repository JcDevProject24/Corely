# Levantar Corely

## Requisitos previos

| Windows/Mac | Ubuntu/Linux |
|-------------|--------------|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | `sudo apt install docker.io docker-compose` |
| [Git](https://git-scm.com/) | `sudo apt install git` |

Solo si usas desarrollo local (sin Docker):
- [Node.js](https://nodejs.org/) v20+
- [Python](https://python.org/) 3.11+

---

## Primer paso (solo PC nuevo)

```bash
git clone https://github.com/tu-usuario/Corely.git
cd Corely
```

Crear `frontend/.env`:
```
VITE_GOOGLE_OAUTH_CLIENT_ID=tu_client_id_de_google
```

Crear `backend/.env`:
```
GOOGLE_CLIENT_ID=tu_client_id_de_google
GOOGLE_CLIENT_SECRET=tu_client_secret_de_google
```

Si ya tenias BD antigua y da error, borra el volumen:
```bash
docker compose down -v
```

---

## Opcion 1: Desarrollo local (sin Docker)

### Frontend
```bash
cd frontend
npm install        # solo la primera vez
npm run dev
```
Abre: http://localhost:5173

### Backend
```bash
cd backend
python -m venv .venv              # solo la primera vez
.venv\Scripts\activate            # Windows
# source .venv/bin/activate       # Mac/Linux
pip install -r requirements.txt   # solo la primera vez
uvicorn main:app --reload
```
Abre: http://localhost:8000

### Base de datos (necesitas Docker para MariaDB)
```bash
docker compose up db -d
```

---

## Opcion 2: Docker Compose (todo junto)

### Levantar normal
```bash
docker compose up -d
```

### Levantar con rebuild (cuando cambias codigo)
```bash
docker compose up -d --build
```

### Levantar con rebuild SIN cache (cuando agregas dependencias)
```bash
docker compose build --no-cache
docker compose up -d
```

### Ver logs
```bash
docker compose logs -f           # todos
docker compose logs -f frontend  # solo frontend
docker compose logs -f backend   # solo backend
```

### Parar todo
```bash
docker compose down
```

---

## URLs

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:8000 |
| BD       | localhost:3306 |
