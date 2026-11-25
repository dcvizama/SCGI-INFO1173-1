# Imagen del servidor mock para desplegarlo en Kubero (kubero.inf.uct.cl).
# La construye y publica en GHCR el workflow .github/workflows/mock-server-kubero.yml.
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

# Kubero puede cambiar el puerto con la variable PORT; JWT_SECRET se configura en la app.
ENV PORT=3000
EXPOSE 3000

CMD ["node", "index.js"]
