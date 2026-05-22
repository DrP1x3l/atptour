# Deploy sul Lonaserver — passo passo

Assunzioni: hai SSH sul Mac Mini, OrbStack è attivo, `server-postgres` e
`server-redis` girano. Tu sei l'unico utente.

## 1. Prepara il database

Connettiti al Postgres del server e crea utente + database:

```bash
docker exec -it server-postgres psql -U postgres
```

```sql
CREATE USER atptour WITH PASSWORD 'METTI_UNA_PASSWORD_VERA';
CREATE DATABASE atptour OWNER atptour;
GRANT ALL PRIVILEGES ON DATABASE atptour TO atptour;
\q
```

## 2. Scopri il nome della rete OrbStack

```bash
docker inspect server-postgres --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}'
```

Annotati il nome (es. `lonaserver_default`, `server_default`, `bridge`).
Aggiornalo in `docker-compose.yml` alla voce `networks.lonaserver.name`.

## 3. Clona il repo sul Mac Mini

```bash
cd ~/apps   # o dove tieni le altre app del server
git clone https://github.com/RickyLona/atptour.git
cd atptour
git checkout refactor-v2   # branch dove ho lavorato
```

## 4. Configura le env

```bash
cp .env.example .env
# - sostituisci CHANGE_ME nella DATABASE_URL con la password reale
# - genera APP_SECRET con: openssl rand -hex 32
# - copia lo STESSO APP_SECRET su VITE_APP_SECRET
# - imposta CORS_ORIGIN col dominio Cloudflare Tunnel
```

## 5. Applica le migrazioni del database

```bash
cd api
npm install
npm run db:migrate
cd ..
```

(In alternativa: il container API esegue automaticamente le migrazioni all'avvio.)

## 6. Migra i dati esistenti da Supabase (una sola volta)

```bash
cd scripts
npm install
SUPA_URL="https://casmuuhouepdzbuzsnce.supabase.co" \
SUPA_KEY="<anon_key_supabase>" \
DATABASE_URL="postgresql://atptour:PWD@localhost:5432/atptour" \
  npm run migrate
cd ..
```

Verifica:

```bash
docker exec -it server-postgres psql -U atptour -d atptour \
  -c "SELECT COUNT(*) FROM atptour.matches;"
```

## 7. Build & avvio

```bash
docker compose up -d --build
docker compose logs -f
```

Atteso:
- `atptour-api` healthy su `127.0.0.1:3012`
- `atptour-web` su `127.0.0.1:3011`

Test rapidi:

```bash
curl http://127.0.0.1:3012/healthz
curl -H "X-API-Key: $APP_SECRET" http://127.0.0.1:3012/api/state | jq
curl http://127.0.0.1:3011/
```

## 8. Cloudflare Tunnel

Aggiungi al config del tuo `server-cloudflared` una nuova route:

```yaml
ingress:
  - hostname: atptour.tuodominio.it
    service: http://host.docker.internal:3011
  # ... le altre tue route
  - service: http_status:404
```

Riavvia il tunnel:

```bash
docker compose restart server-cloudflared
# oppure il tuo modo di gestirlo
```

## 9. Auto-deploy via webhook (opzionale)

Sul tuo `server-webhook` (porta 9000) aggiungi un endpoint che esegue:

```bash
cd ~/apps/atptour && git pull && docker compose up -d --build
```

Configura il webhook GitHub del repo per chiamare
`https://webhook.tuodominio.it/atptour` su push del branch `main`.

## Troubleshooting

| Sintomo | Causa probabile | Fix |
|---|---|---|
| `atptour-api` riavvia loop | `DATABASE_URL` errata o pg non raggiungibile dalla rete | Verifica nome rete e credenziali |
| `502 Bad Gateway` su `/api/*` | api non healthy o nginx non risolve `api` | `docker compose logs api` |
| Build web fallisce | `VITE_APP_SECRET` mancante in `.env` | Imposta la variabile prima di `up --build` |
| Match non salvano | `X-API-Key` non passa | Stesso `APP_SECRET` su api e web (vedi `.env`) |
