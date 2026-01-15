# 1. Construcción
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# 2. Servidor Nginx
FROM nginx:stable-alpine

# Ajuste para Angular 19: añadimos "/browser" al final de la ruta de origen
COPY --from=build /app/dist/restaurante-front/browser /usr/share/nginx/html

# Configuración para evitar errores 404 al recargar rutas de Angular
RUN echo "server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files \$uri \$uri/ /index.html; \
    } \
}" > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]