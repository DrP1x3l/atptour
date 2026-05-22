# ---- builder ----
FROM node:20-alpine AS builder
WORKDIR /app

# Build-time args per Vite (incorporate nel bundle finale)
ARG VITE_API_BASE=/api
ARG VITE_APP_SECRET=""
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_APP_SECRET=$VITE_APP_SECRET

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json vite.config.ts tailwind.config.ts postcss.config.js index.html ./
COPY public ./public
COPY src ./src

RUN npm run build

# ---- runtime ----
FROM nginx:alpine AS runtime

# Configurazione Nginx custom (reverse proxy /api -> api container, SPA fallback)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Statica buildata
COPY --from=builder /app/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

EXPOSE 80
