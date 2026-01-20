# 🚀 Guía de Trabajo con Git - Proyecto Corely

## 📋 Índice
- [Flujo de Trabajo con Ramas](#-flujo-de-trabajo-con-ramas)
- [Nomenclatura de Ramas](#-nomenclatura-de-ramas)
- [Convención de Commits](#-convención-de-commits)
- [Comandos Útiles](#-comandos-útiles)
- [Solución de Problemas](#-solución-de-problemas)

---

## 🌿 Flujo de Trabajo con Ramas

### 1. Crear y cambiar a nueva rama
```bash
git checkout -b nombre-de-tu-feature
```

### 2. Subir la nueva rama al repositorio remoto
```bash
git push -u origin nombre-de-tu-feature
```

### 3. Volver a la rama principal
```bash
git checkout main
```

### 4. Fusionar los cambios en main
```bash
git merge nombre-de-tu-feature
```

### 5. Subir los cambios a remoto
```bash
git push origin main
```

---

## 🏷️ Nomenclatura de Ramas

**Formato:** `tipo/descripcion-corta`

| Prefijo | Uso | Ejemplo |
|---------|-----|---------|
| `feat/` | Nuevas funcionalidades | `feat/login-usuario` |
| `fix/` | Corrección de errores | `fix/validacion-email` |
| `refactor/` | Mejoras de código sin nuevas funciones | `refactor/optimizar-queries` |
| `docs/` | Memoria y documentación | `docs/capitulo-backend` |
| `style/` | Cambios visuales/CSS | `style/ajustar-navbar` |

**Ejemplo completo:**
```bash
git checkout -b feat/autenticacion-jwt
```

---

## 💬 Convención de Commits

**Formato:** `tipo: descripción en español`

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `feat:` | Nueva funcionalidad | `feat: añadir asistente de voz IA` |
| `fix:` | Corrección de bug | `fix: error al conectar con MariaDB` |
| `refactor:` | Mejora de código existente | `refactor: limpiar estilos de Tailwind` |
| `docs:` | Documentación o memoria | `docs: escribir capítulo 1 de la memoria` |
| `style:` | Cambios visuales (CSS, UI) | `style: ajustar colores del dashboard` |
| `chore:` | Tareas técnicas (deps, config) | `chore: añadir librería de gráficos` |

**Ejemplo de uso:**
```bash
git add .
git commit -m "feat: integrar endpoint de Spotify"
```

---

## 🛠️ Comandos Útiles

### Corregir el último commit
Si te equivocaste en el mensaje del último commit:
```bash
git commit --amend -m "feat: nuevo mensaje corregido"
git push --force-with-lease origin nombre-de-tu-rama
```

### Ver estado actual
```bash
git status
```

### Ver historial de commits
```bash
git log --oneline
```

### Descartar cambios locales en un archivo
```bash
git checkout -- nombre-archivo.js
```

### Actualizar tu rama con los últimos cambios de main
```bash
git checkout main
git pull origin main
git checkout tu-rama
git merge main
```

### Eliminar rama local
```bash
git branch -d nombre-rama
```

### Eliminar rama remota
```bash
git push origin --delete nombre-rama
```

---

## ⚠️ Solución de Problemas

### Conflicto al hacer merge
1. Git marcará los archivos en conflicto
2. Abre los archivos y busca las marcas `<<<<<<<`, `=======`, `>>>>>>>`
3. Edita manualmente y elige qué código conservar
4. Una vez resuelto:
```bash
git add .
git commit -m "fix: resolver conflicto en archivo.js"
```

### Revertir un commit (sin borrarlo del historial)
```bash
git revert <hash-del-commit>
```

### Deshacer el último commit (mantener cambios)
```bash
git reset --soft HEAD~1
```

---

## 📌 Buenas Prácticas

✅ **Haz commits pequeños y frecuentes** - Facilita el seguimiento de cambios  
✅ **Escribe mensajes descriptivos** - Usa el formato de la convención  
✅ **Sincroniza con `main` regularmente** - Evita conflictos grandes  
✅ **Usa `--force-with-lease` en lugar de `--force`** - Más seguro para sobrescribir  
✅ **Revisa antes de hacer push** - `git status` y `git log` son tus amigos  

---

**Última actualización:** Enero 2026  
**Proyecto:** Corely - Sistema de Gestión de Eventos con IA