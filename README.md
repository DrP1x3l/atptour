# ATP Tour v2

Refactor completo dell'app personale di tracking partite. Da monolite HTML+Babel+Supabase
a **frontend Vite/React/TS** + **backend Fastify/TS** + **Postgres locale** sul Lonaserver.

Single-user (Ricky), shared-secret in header, dark-mode mobile-first, PWA installabile.

## Struttura

```
atptour-v2/
├── web/         # Vite + React + TS + Tailwind, build statica servita da Nginx
├── api/         # Fastify + TS + Drizzle ORM, parla con Postgres del Lonaserver
├── scripts/     # Migrazione one-shot dal blob Supabase
├── docker-compose.yml
└── .env.example
```

## Quick start (dev locale sul tuo Mac)

```bash
cp .env.example .env
# edita .env e metti un APP_SECRET serio

# avvia tutto (web + api, attaccati al postgres del Lonaserver)
docker compose up -d --build

# web -> http://localhost:3011
# api -> http://localhost:3012/healthz
```

## Deploy sul Lonaserver

Già pensato per il tuo stack OrbStack:

1. **Database**: crea schema `atptour` dentro `server-postgres` (vedi `api/migrations`).
2. **Rete**: i container `atptour-web` e `atptour-api` si attaccano alla rete dove gira
   `server-postgres` (modifica `networks.lonaserver.name` in `docker-compose.yml` con
   il nome reale della rete — vedi `docker network ls`).
3. **Porte**: web su `3011`, api su `3012` (entrambe libere nella tua mappa).
4. **Cloudflare Tunnel**: aggiungi una route `atptour.<tuodominio>` → `http://localhost:3011`.
   L'API è raggiungibile dal web tramite `/api/*` via reverse proxy Nginx interno (vedi `web/nginx.conf`).

Il dettaglio passo-passo è in `DEPLOY.md`.

## Migrazione dati da Supabase

```bash
cd scripts
npm install
SUPA_URL=... SUPA_KEY=... DATABASE_URL=... npm run migrate
```

Lo script pulla il blob da Supabase e lo splatta nelle tabelle normalizzate.
È idempotente: se rilanciato, salta i match già importati per `id`.

## Stack tecnico

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite 5, TypeScript, Tailwind CSS, Zustand, Framer Motion |
| Backend | Node 20, Fastify 4, TypeScript, Drizzle ORM, Zod |
| Database | PostgreSQL 16 (riusa `server-postgres` esistente) |
| Cache | Redis 7 (riusa `server-redis`, DB 1) — solo se serve |
| Auth | Shared secret in header `X-API-Key` |
| Build | Docker multi-stage, Nginx Alpine per il web |
| Deploy | OrbStack + Cloudflare Tunnel |

## Roadmap implementata

- [x] Refactor architetturale (Fase A): build proper, niente Babel runtime
- [x] Backend proprio (Fase B): Postgres normalizzato, Supabase smontato
- [x] UX/UI mobile curata (Fase C): bottom-sheet, swipe, haptic, PWA, skeleton
- [x] Containerizzazione Docker per il Lonaserver

## Comandi utili

```bash
# logs live
docker compose logs -f web api

# rebuild solo del web
docker compose up -d --build web

# entra nel container api
docker compose exec api sh

# genera nuova migrazione drizzle
cd api && npm run db:generate

# applica migrazioni al db
cd api && npm run db:migrate
```
