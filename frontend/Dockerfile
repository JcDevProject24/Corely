FROM node:20-alpine

WORKDIR /app

# Copiamos archivos de dependencias primero para aprovechar la caché de Docker
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Vite necesita --host para que Docker pueda redirigir el tráfico
CMD ["npm", "run", "dev", "--", "--host"]