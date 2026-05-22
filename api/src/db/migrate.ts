// Migration runner minimale: legge tutti i file .sql in ../migrations
// ordinati per nome, salta quelli gia' applicati (atptour.schema_migrations).
// Idempotente. Eseguito in src/index.ts allo startup.

import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool } from "./client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MIGRATIONS_DIR = join(__dirname, "../../migrations");

export async function runMigrations(): Promise<{ applied: string[]; skipped: string[] }> {
  const client = await pool.connect();
  const applied: string[] = [];
  const skipped: string[] = [];
  try {
    // Bootstrap del tracker (potrebbe non esistere ancora)
    await client.query(`CREATE SCHEMA IF NOT EXISTS atptour;`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS atptour.schema_migrations (
        filename   TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const { rows } = await client.query(
        `SELECT 1 FROM atptour.schema_migrations WHERE filename = $1`,
        [file]
      );
      if (rows.length > 0) {
        skipped.push(file);
        continue;
      }
      const sqlText = await readFile(join(MIGRATIONS_DIR, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sqlText);
        await client.query(
          `INSERT INTO atptour.schema_migrations (filename) VALUES ($1)`,
          [file]
        );
        await client.query("COMMIT");
        applied.push(file);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }
  } finally {
    client.release();
  }
  return { applied, skipped };
}

// Standalone: `tsx src/db/migrate.ts`
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then((r) => {
      console.log(`[migrate] applied: ${r.applied.length}, skipped: ${r.skipped.length}`);
      r.applied.forEach((f) => console.log(`  + ${f}`));
      process.exit(0);
    })
    .catch((e) => {
      console.error("[migrate] error:", e);
      process.exit(1);
    });
}
