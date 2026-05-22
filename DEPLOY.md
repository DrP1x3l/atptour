# Deploy sul Lonaserver — passo passo (architettura monolite)

Assunzioni: SSH sul Mac Mini, OrbStack attivo, `server-postgres` e `server-redis`
girano, `server-cloudflared` configurato in modalita' tunnel-token.

## 1. Prepara il database (solo prima volta)

Connettiti al Postgres del server e crea utente + database:

```bash
docker exec -it server-postgres psql -U admin -d main
```

```sql
CREATE USER atptour WITH PASSWORD 'METTI_UNA_PASSWORD_VERA';
CREATE DATABASE atptour OWNER atptour;
GRANT ALL PRIVILEGES ON DATABASE atptour TO atptour;
\q
```

Verifica:

```bash
docker exec -e PGPASSWORD='LA_PASSWORD' server-postgres \
  psql -U atptour -d atptour -c '\conninfo'
```

## 2. Clona o aggiorna il repo sul Mac Mini

Prima volta:

```bash
cd ~/apps
git clone https://github.com/RickyLona/atptour.git
cd atptour
git checkout refactor-v2
```

Aggiornamenti successivi:

```bash
cd ~/apps/atptour
git pull
```

## 3. Configura le env

```bash
cp .env.example .env
# - sostituisci CHANGE_ME nella DATABASE_URL con la password reale
# - genera APP_SECRET con: openssl rand -hex 32
# - copia lo STESSO APP_SECRET su VITE_APP_SECRET
# - CORS_ORIGIN: il tuo dominio Cloudflare (es. https://tennis.lonardoni.it)
chmod 600 .env
```

## 4. Build & avvio

```bash
docker compose up -d --build
docker compose logs -f
```

Atteso: `atptour` healthy su `127.0.0.1:3018`.

Test rapidi sul Mini:

```bash
source .env
curl -s http://127.0.0.1:3018/healthz                                # {"ok":true,...}
curl -sI http://127.0.0.1:3018/ | head -3                            # 200 OK
curl -s -H "X-API-Key: $APP_SECRET" http://127.0.0.1:3018/api/state \
  | python3 -m json.tool | head
```

## 5. Cloudflare Tunnel (solo prima volta o se cambia porta)

Il tunnel-token e' gia' montato dentro `server-cloudflared`. La route si configura
da web: **https://one.dash.cloudflare.com → Networks → Tunnels → [il tuo tunnel] → Public Hostnames**.

**Aggiungi o aggiorna** la public hostname `tennis.lonardoni.it`:

| Campo | Valore |
|---|---|
| Subdomain | `tennis` |
| Domain | `lonardoni.it` |
| Path | (vuoto) |
| Service Type | `HTTP` |
| URL | `atptour:3000` |

> Nota: il vecchio valore era `atptour-web:80`. Ora il container e' **uno solo**,
> si chiama `atptour` e ascolta su `3000` internamente.

`HTTP2 connection: On`, `No TLS Verify: On`. Save: niente restart necessario.

Test esterno (anche da rete mobile, fuori casa):

```bash
curl -sI https://tennis.lonardoni.it/ | head -5
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://tennis.lonardoni.it/api/state
# Atteso 401 senza header X-API-Key
```

## 6. Auto-deploy via webhook (opzionale)

Sul `server-webhook` (porta 9000) aggiungi un endpoint che esegue:

```bash
cd ~/apps/atptour && git pull && docker compose up -d --build
```

Webhook GitHub del repo: `Settings → Webhooks → Add webhook` con payload sull'endpoint.

## Troubleshooting

| Sintomo | Causa probabile | Fix |
|---|---|---|
| `atptour` riavvia loop | `DATABASE_URL` errata o pg non raggiungibile dalla rete | Verifica rete `server_default` e credenziali |
| `network server_default could not be found` | Nome rete diverso sul tuo server | `docker network ls`, poi aggiusta `networks.lonaserver.name` |
| 404 su rotte SPA tipo `/hist` | SPA fallback non attivo | Verifica che `staticPlugin` sia registrato in `src/index.ts` dopo le routes API |
| Service worker non aggiorna | Cache aggressiva del browser | Vedi `pickCacheControl()` in `plugins/static.ts`: `sw.js` e `manifest.webmanifest` sono no-cache |
| Build Vite fallisce | `VITE_APP_SECRET` mancante in `.env` | Imposta la variabile prima di `docker compose up --build` |
| API risponde 401 anche con chiave giusta | `APP_SECRET` != `VITE_APP_SECRET` | Devono essere identici nel `.env` |
