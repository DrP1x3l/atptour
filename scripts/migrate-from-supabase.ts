/**
 * Migrazione one-shot: legge il blob `data` dalla tabella `atptour_state`
 * di Supabase (un solo record per `DEVICE_ID`), e lo splatta nelle tabelle
 * normalizzate del Postgres locale (schema `atptour`).
 *
 * USO:
 *   SUPA_URL="https://<projectref>.supabase.co" \
 *   SUPA_KEY="<anon_key>" \
 *   DATABASE_URL="postgresql://atptour:PWD@localhost:5432/atptour" \
 *     npm run migrate
 *
 * Idempotente: i match sono skippati per id se gia' presenti.
 */

import pg from "pg";

const SUPA_URL = process.env.SUPA_URL ?? "";
const SUPA_KEY = process.env.SUPA_KEY ?? "";
const DATABASE_URL = process.env.DATABASE_URL ?? "";
const DEVICE_ID = process.env.DEVICE_ID ?? "atptour_shared";

if (!SUPA_URL || !SUPA_KEY || !DATABASE_URL) {
  console.error("ERR: SUPA_URL / SUPA_KEY / DATABASE_URL sono obbligatori");
  process.exit(1);
}

interface SupaSet {
  set: number;
  s1: number;
  s2: number;
  winner: string;
  isTb: boolean;
  tb1: number | null;
  tb2: number | null;
}
interface SupaMatch {
  id: string;
  tournament: string;
  season: number;
  date: string;
  winner: string;
  loser: string;
  sets: SupaSet[];
}
interface SupaState {
  season: number;
  players: { id: string; name: string; avatar: string | null }[];
  matches: SupaMatch[];
}

async function fetchSupabase(): Promise<SupaState | null> {
  const url = `${SUPA_URL}/rest/v1/atptour_state?device_id=eq.${DEVICE_ID}&select=data`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPA_KEY,
      Authorization: `Bearer ${SUPA_KEY}`,
    },
  });
  if (!res.ok) {
    console.error(`Supabase HTTP ${res.status}: ${await res.text()}`);
    return null;
  }
  const rows = (await res.json()) as { data: SupaState }[];
  return rows[0]?.data ?? null;
}

async function main() {
  console.log("→ Fetch blob da Supabase…");
  const blob = await fetchSupabase();
  if (!blob) {
    console.error("Nessun blob trovato. Nulla da migrare.");
    process.exit(1);
  }
  console.log(
    `   players=${blob.players.length}, matches=${blob.matches.length}, season=${blob.season}`
  );

  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  let inserted = 0;
  let skipped = 0;
  try {
    await client.query("BEGIN");

    // Players: upsert su id (preserva eventuali cambi di nome dal db locale)
    for (const p of blob.players) {
      await client.query(
        `INSERT INTO atptour.players (id, name, avatar)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, avatar = EXCLUDED.avatar`,
        [p.id, p.name, p.avatar]
      );
    }

    // Season
    await client.query(
      `INSERT INTO atptour.app_config (key, value)
       VALUES ('current_season', $1::jsonb)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [JSON.stringify({ season: blob.season })]
    );

    // Matches + sets (skip se id gia' presente)
    for (const m of blob.matches) {
      const { rows: existing } = await client.query(
        `SELECT 1 FROM atptour.matches WHERE id = $1`,
        [m.id]
      );
      if (existing.length > 0) { skipped++; continue; }
      await client.query(
        `INSERT INTO atptour.matches (id, tournament_id, season, played_at, winner_id, loser_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [m.id, m.tournament, m.season, m.date, m.winner, m.loser]
      );
      for (const s of m.sets) {
        await client.query(
          `INSERT INTO atptour.sets (match_id, set_idx, s1, s2, winner_id, is_tb, tb1, tb2)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [m.id, s.set, s.s1, s.s2, s.winner, s.isTb, s.tb1, s.tb2]
        );
      }
      inserted++;
    }

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
    await pool.end();
  }

  console.log(`✓ Migrazione completata. inseriti=${inserted}, gia' presenti=${skipped}`);
}

main().catch((e) => {
  console.error("✗ Errore migrazione:", e);
  process.exit(1);
});
