import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import compress from "@fastify/compress";
import rateLimit from "@fastify/rate-limit";
import { env } from "./env.js";
import { pool } from "./db/client.js";
import { runMigrations } from "./db/migrate.js";
import { authPlugin } from "./plugins/auth.js";
import { staticPlugin } from "./plugins/static.js";
import { stateRoutes } from "./routes/state.js";
import { matchesRoutes } from "./routes/matches.js";
import { playersRoutes } from "./routes/players.js";
import { seasonRoutes } from "./routes/season.js";

async function main() {
  const app = Fastify({
    logger:
      env.NODE_ENV === "production"
        ? { level: "info" }
        : { level: "debug", transport: { target: "pino-pretty" } },
    trustProxy: true,
    // Aumenta il body limit a 256KB per i payload di sync futuri.
    bodyLimit: 256 * 1024,
  });

  // Helmet con CSP disabilitato: la SPA include script inline di Vite
  // (workbox registerSW) e percio' un CSP rigido richiederebbe nonce per ogni build.
  // Tutti gli altri header di sicurezza restano attivi.
  await app.register(helmet, { contentSecurityPolicy: false });

  await app.register(cors, {
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-API-Key"],
  });

  // Compressione (sostituisce gzip di nginx): brotli/gzip per text/js/json/css/svg/wasm.
  await app.register(compress, {
    global: true,
    encodings: ["br", "gzip"],
    threshold: 1024,
  });

  await app.register(rateLimit, {
    max: 300,
    timeWindow: "1 minute",
    allowList: (req) => req.url === "/healthz",
  });

  app.get("/healthz", async () => ({ ok: true, uptime: process.uptime() }));

  // Routes API sotto /api (precedenza sulla wildcard di fastify-static)
  await app.register(
    async (api) => {
      await api.register(authPlugin);
      await api.register(stateRoutes);
      await api.register(matchesRoutes);
      await api.register(playersRoutes);
      await api.register(seasonRoutes);
    },
    { prefix: "/api" }
  );

  // Statici della SPA + SPA fallback. Registrato DOPO le routes API.
  await app.register(staticPlugin);

  // Migrazioni allo startup
  try {
    const r = await runMigrations();
    app.log.info({ applied: r.applied.length, skipped: r.skipped.length }, "migrations");
  } catch (err) {
    app.log.error({ err }, "migration failed");
    process.exit(1);
  }

  const close = async () => {
    app.log.info("shutting down");
    await app.close();
    await pool.end();
    process.exit(0);
  };
  process.on("SIGINT", close);
  process.on("SIGTERM", close);

  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
  } catch (err) {
    app.log.error({ err }, "listen failed");
    process.exit(1);
  }
}

main();
