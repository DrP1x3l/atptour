# ---- builder ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json drizzle.config.ts ./
COPY src ./src
COPY migrations ./migrations

RUN npm run build

# ---- runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Solo le dipendenze di runtime
COPY package*.json ./
RUN npm ci --omit=dev

# Artefatti di build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations

# Healthcheck con wget (incluso in alpine via busybox)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=5 \
  CMD wget -qO- http://localhost:3012/healthz || exit 1

EXPOSE 3012
USER node
CMD ["node", "dist/index.js"]
