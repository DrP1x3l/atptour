# syntax=docker/dockerfile:1.7
# ATP Tour - monolite: un solo container, un solo processo Node.
# Fastify serve sia le API che il frontend React buildato.

# ---------- stage 1: build del frontend Vite ----------
FROM node:20-alpine AS web-builder
WORKDIR /web

# Build-time args incorporate nel bundle Vite (single-user: ok)
ARG VITE_API_BASE=/api
ARG VITE_APP_SECRET=""
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_APP_SECRET=$VITE_APP_SECRET

COPY web/package*.json ./
RUN npm ci

COPY web/tsconfig*.json web/vite.config.ts web/tailwind.config.ts \
     web/postcss.config.js web/index.html ./
COPY web/public ./public
COPY web/src ./src

RUN npm run build
# Output atteso in /web/dist

# ---------- stage 2: build del backend Fastify ----------
FROM node:20-alpine AS api-builder
WORKDIR /app

COPY api/package*.json ./
RUN npm ci

COPY api/tsconfig.json api/drizzle.config.ts ./
COPY api/src ./src
COPY api/migrations ./migrations

RUN npm run build
# Output atteso in /app/dist

# ---------- stage 3: runtime unico ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    PUBLIC_DIR=/app/public

# Solo dipendenze di runtime (no devDeps)
COPY api/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Artefatti
COPY --from=api-builder /app/dist        ./dist
COPY --from=api-builder /app/migrations  ./migrations
COPY --from=web-builder /web/dist        ./public

# Healthcheck via node (sempre disponibile, IPv4 esplicito)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"

EXPOSE 3000
USER node
CMD ["node", "dist/index.js"]
