import type { FastifyPluginAsync } from "fastify";
import { db } from "../db/client.js";
import { tournaments, players, matches, sets, appConfig, CURRENT_SEASON_KEY } from "../db/schema.js";
import { eq, asc } from "drizzle-orm";

/**
 * GET /api/state
 * Snapshot completo per inizializzare il client:
 *   { season, players[], tournaments[], matches[] (con sets nested) }
 */
export const stateRoutes: FastifyPluginAsync = async (app) => {
  app.get("/state", async () => {
    const [seasonRow, ts, ps, ms, sts] = await Promise.all([
      db
        .select()
        .from(appConfig)
        .where(eq(appConfig.key, CURRENT_SEASON_KEY))
        .limit(1),
      db.select().from(tournaments).orderBy(asc(tournaments.sortOrder)),
      db.select().from(players).orderBy(asc(players.id)),
      db.select().from(matches).orderBy(asc(matches.playedAt)),
      db.select().from(sets).orderBy(asc(sets.matchId), asc(sets.setIdx)),
    ]);

    const season =
      (seasonRow[0]?.value as { season?: number } | undefined)?.season ?? 1;

    // Raggruppa sets per matchId
    const setsByMatch = new Map<string, typeof sts>();
    for (const s of sts) {
      const arr = setsByMatch.get(s.matchId) ?? [];
      arr.push(s);
      setsByMatch.set(s.matchId, arr);
    }

    const matchesOut = ms.map((m) => ({
      id: m.id,
      tournament: m.tournamentId,
      season: m.season,
      date: m.playedAt,
      winner: m.winnerId,
      loser: m.loserId,
      sets: (setsByMatch.get(m.id) ?? []).map((s) => ({
        set: s.setIdx,
        s1: s.s1,
        s2: s.s2,
        winner: s.winnerId,
        isTb: s.isTb,
        tb1: s.tb1,
        tb2: s.tb2,
      })),
    }));

    return {
      season,
      tournaments: ts,
      players: ps.map((p) => ({ id: p.id, name: p.name, avatar: p.avatar })),
      matches: matchesOut,
    };
  });
};
