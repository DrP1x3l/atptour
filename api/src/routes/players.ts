import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";
import { players } from "../db/schema.js";
import { eq } from "drizzle-orm";

const updateSchema = z
  .object({
    name: z.string().min(1).max(40).optional(),
    avatar: z.string().nullable().optional(),
  })
  .refine((d) => d.name !== undefined || d.avatar !== undefined, {
    message: "at least one of name|avatar required",
  });

export const playersRoutes: FastifyPluginAsync = async (app) => {
  app.patch<{ Params: { id: string } }>("/players/:id", async (req, reply) => {
    const { id } = req.params;
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_body", details: parsed.error.flatten() });
    }
    const result = await db
      .update(players)
      .set(parsed.data)
      .where(eq(players.id, id))
      .returning();
    if (result.length === 0) return reply.code(404).send({ error: "not_found" });
    const p = result[0]!;
    return { id: p.id, name: p.name, avatar: p.avatar };
  });
};
