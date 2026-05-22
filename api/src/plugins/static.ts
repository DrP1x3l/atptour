// Plugin Fastify che serve i file statici del frontend Vite + implementa
// la stessa logica di nginx.conf (cache headers, security headers, SPA fallback).
//
// Il bundle React e' atteso in PUBLIC_DIR (default: ../public rispetto a dist/).
// Le routes /api/* e /healthz sono gestite altrove e prevalgono perche'
// registrate PRIMA di questo plugin.

import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import fastifyStatic from "@fastify/static";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ONE_YEAR = 60 * 60 * 24 * 365;

const NO_CACHE_FILES = new Set([
  "/sw.js",
  "/registerSW.js",
  "/manifest.webmanifest",
]);

const isWorkboxFile = (p: string): boolean => /^\/workbox-[a-f0-9]+\.js$/.test(p);
const isVersionedAsset = (p: string): boolean => p.startsWith("/assets/");

function pickCacheControl(urlPath: string): string {
  if (isVersionedAsset(urlPath)) {
    return `public, max-age=${ONE_YEAR}, immutable`;
  }
  if (NO_CACHE_FILES.has(urlPath) || isWorkboxFile(urlPath)) {
    return "no-cache, no-store, must-revalidate";
  }
  // index.html e qualunque altro file -> sempre fresco
  return "no-cache";
}

export const staticPlugin: FastifyPluginAsync = async (app) => {
  // PUBLIC_DIR puo' essere override via env (es. per dev); di default
  // ../public rispetto al file compilato (dist/plugins/static.js -> ../../public).
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const defaultPublic = resolve(__dirname, "../../public");
  const root = process.env.PUBLIC_DIR ?? defaultPublic;

  app.log.info({ root }, "serving static SPA");

  await app.register(fastifyStatic, {
    root,
    index: "index.html", // GET / -> index.html
    wildcard: false,     // serve solo file esistenti; il fallback lo gestiamo noi
    setHeaders: (res, filePath) => {
      const rel = "/" + relative(root, filePath).replace(/\\/g, "/");
      res.setHeader("Cache-Control", pickCacheControl(rel));
    },
  });

  // SPA fallback + 404 JSON per /api: questo handler scatta SOLO se nessuna
  // route esplicita (api, healthz) e nessun file statico ha matchato.
  app.setNotFoundHandler(async (req: FastifyRequest, reply: FastifyReply) => {
    // Su /api/... ritorna sempre JSON (mai HTML)
    if (req.url.startsWith("/api/") || req.url === "/api") {
      return reply.code(404).send({ error: "not_found" });
    }
    // /healthz non dovrebbe mai cadere qui, ma per sicurezza:
    if (req.url.startsWith("/healthz")) {
      return reply.code(404).send({ error: "not_found" });
    }
    // GET di navigazione -> SPA fallback su index.html
    if (req.method === "GET") {
      const accept = (req.headers.accept ?? "") as string;
      if (accept.includes("text/html") || accept === "" || accept === "*/*") {
        reply.header("Cache-Control", "no-cache");
        return reply.type("text/html").sendFile("index.html");
      }
    }
    return reply.code(404).send({ error: "not_found" });
  });
};
