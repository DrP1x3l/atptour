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

# Healthcheck via node (sempre disponibile)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:3012/healthz',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"

EXPOSE 3012
USER node
CMD ["node", "dist/index.js"]
