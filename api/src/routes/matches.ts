import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { db, pool } from "../db/client.js";
import { matches, sets } from "../db/schema.js";
import { eq } from "drizzle-orm";

const setSchema = z.object({
  set: z.number().int().min(1).max(3),
  s1: z.number().int().min(0).max(20),
  s2: z.number().int().min(0).max(20),
  winner: z.string().min(1),
  isTb: z.boolean(),
  tb1: z.number().int().nullable().optional(),
  tb2: z.number().int().nullable().optional(),
});

const matchSchema = z.object({
  id: z.string().min(1).optional(),
  tournament: z.string().min(1),
  season: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  winner: z.string().min(1),
  loser: z.string().min(1),
  sets: z.array(setSchema).min(1).max(3),
});

function gid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  );
}

export const matchesRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/matches  — crea match + sets (transazione)
  app.post("/matches", async (req, reply) => {
    const parsed = matchSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_body", details: parsed.error.flatten() });
    }
    const m = parsed.data;
    const id = m.id ?? gid();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO atptour.matches (id, tournament_id, season, played_at, winner_id, loser_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, m.tournament, m.season, m.date, m.winner, m.loser]
      );
      for (const s of m.sets) {
        await client.query(
          `INSERT INTO atptour.sets (match_id, set_idx, s1, s2, winner_id, is_tb, tb1, tb2)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [id, s.set, s.s1, s.s2, s.winner, s.isTb, s.tb1 ?? null, s.tb2 ?? null]
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    return reply.code(201).send({ id });
  });

  // DELETE /api/matches/:id
  app.delete<{ Params: { id: string } }>("/matches/:id", async (req, reply) => {
    const { id } = req.params;
    const result = await db.delete(matches).where(eq(matches.id, id)).returning({ id: matches.id });
    if (result.length === 0) {
      return reply.code(404).send({ error: "not_found" });
    }
    return reply.code(204).send();
  });
};
