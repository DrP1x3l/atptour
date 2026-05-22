import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { db, pool } from "../db/client.js";
import { appConfig, CURRENT_SEASON_KEY, matches } from "../db/schema.js";
import { eq } from "drizzle-orm";

const seasonSchema = z.object({
  season: z.number().int().positive().max(999),
});

export const seasonRoutes: FastifyPluginAsync = async (app) => {
  // PATCH /api/season   { season: number }   imposta la stagione corrente
  app.patch("/season", async (req, reply) => {
    const parsed = seasonSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_body", details: parsed.error.flatten() });
    }
    await db
      .insert(appConfig)
      .values({ key: CURRENT_SEASON_KEY, value: { season: parsed.data.season } })
      .onConflictDoUpdate({
        target: appConfig.key,
        set: { value: { season: parsed.data.season } },
      });
    return { season: parsed.data.season };
  });

  // POST /api/reset    cancella tutti i matches (mantiene players e tournaments),
  // reset stagione a 1.
  app.post("/reset", async () => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // sets viene cancellato in cascade
      await client.query(`DELETE FROM atptour.matches`);
      await client.query(
        `INSERT INTO atptour.app_config (key, value)
         VALUES ($1, $2::jsonb)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [CURRENT_SEASON_KEY, JSON.stringify({ season: 1 })]
      );
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
    return { ok: true };
  });
};
