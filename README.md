# ATP Tour v2 — monolite

App personale per tracciare partite tennis. **Un solo container, un solo processo Node**:
il server Fastify serve sia le API sia il bundle React buildato. Niente nginx,
niente container separati.

- **Single-user** (Ricky), shared-secret in header.
- **Mobile-first**, dark mode, PWA installabile.
- **Postgres condiviso** col resto dello stack del Lonaserver.

## Struttura

```
atptour/
├── api/         # Fastify + TS + Drizzle ORM. Serve /api/*, /healthz E i file statici della SPA.
├── web/         # Vite + React + TS + Tailwind. Compilato in static, copiato in /app/public dentro il container.
├── scripts/     # Migrazione one-shot dal blob Supabase (storico)
├── Dockerfile          # Unico, multi-stage: web build + api build + runtime
├── docker-compose.yml  # Un solo servizio "app"
└── .env.example
```

## Quick start (dev locale sul Mac)

```bash
cp .env.example .env
# - APP_SECRET / VITE_APP_SECRET: stesso valore (openssl rand -hex 32)
# - DATABASE_URL: punta al tuo postgres dev

# Avvia (build + run)
docker compose up -d --build

# App -> http://localhost:3018
# healthz -> http://localhost:3018/healthz
```

In dev senza Postgres del Lonaserver: decommenta il servizio `postgres` nel
`docker-compose.yml` e cambia `networks.lonaserver` da `external: true` a `driver: bridge`.

## Deploy sul Lonaserver

Vedi `DEPLOY.md`. Sintesi:

1. Database: schema `atptour` dentro `server-postgres` (utente `atptour`).
2. Rete: il container `atptour` si attacca a `server_default` (dove vivono `server-postgres` e `server-redis`).
3. Porta host: `3018` (configurabile via `HOST_PORT` in `.env`).
4. Cloudflare Tunnel: route verso `atptour:3000` (interno alla rete docker) oppure verso `127.0.0.1:3018` dell'host.

## Stack

| Layer | Tech |
|---|---|
| Server unico | Node 20 + Fastify 4 + TypeScript |
| Static SPA | @fastify/static + SPA fallback su `index.html` |
| Compressione | @fastify/compress (br + gzip) |
| ORM | Drizzle ORM su PostgreSQL 16 |
| Frontend | React 18 + Vite 5 + Tailwind + Zustand + Framer Motion |
| PWA | vite-plugin-pwa (workbox, service worker) |
| Auth | Shared secret in header `X-API-Key` |
| Build | Docker multi-stage |
| Deploy | OrbStack + Cloudflare Tunnel |

## Comandi utili

```bash
docker compose logs -f                       # logs live
docker compose up -d --build                 # rebuild + restart
docker compose exec app sh                   # shell nel container
docker compose down                          # stop

# Typecheck locale (richiede npm install)
cd api && npm install && npm run lint
cd web && npm install && npm run lint
```

## Note di architettura

- `api/src/index.ts` registra in ordine: helmet → cors → compress → rateLimit → `/healthz` → `/api/*` (con auth) → `staticPlugin`.
- `staticPlugin` (`api/src/plugins/static.ts`) replica il vecchio `nginx.conf`:
  - `/assets/*` → `Cache-Control: public, max-age=31536000, immutable`
  - `sw.js`, `registerSW.js`, `manifest.webmanifest`, `workbox-*.js` → `no-cache, no-store, must-revalidate`
  - tutto il resto → `Cache-Control: no-cache`
  - GET non-API non-asset → `setNotFoundHandler` ritorna `index.html` (SPA fallback)
  - 404 su `/api/...` → JSON, mai HTML
