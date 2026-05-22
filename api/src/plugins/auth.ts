import type { FastifyPluginAsync } from "fastify";
import { env } from "../env.js";

/**
 * Shared-secret auth: ogni richiesta a /api/* deve avere
 * l'header X-API-Key con il valore di APP_SECRET.
 * /healthz e' escluso.
 */
export const authPlugin: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", async (req, reply) => {
    if (req.url === "/healthz" || req.url.startsWith("/healthz?")) return;
    if (req.method === "OPTIONS") return; // CORS preflight

    const key = req.headers["x-api-key"];
    if (typeof key !== "string" || key.length === 0) {
      return reply.code(401).send({ error: "missing_api_key" });
    }
    // confronto a tempo costante: contro brute-force timing attacks
    if (!safeEqual(key, env.APP_SECRET)) {
      return reply.code(401).send({ error: "invalid_api_key" });
    }
  });
};

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
