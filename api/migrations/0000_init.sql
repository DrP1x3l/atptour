-- ATP Tour v2 — schema iniziale
-- Eseguito da src/db/migrate.ts in idempotenza.

CREATE SCHEMA IF NOT EXISTS atptour;

CREATE TABLE IF NOT EXISTS atptour.tournaments (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  surface       TEXT NOT NULL,
  surface_label TEXT NOT NULL,
  color         TEXT,
  icon          TEXT,
  gradient      TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS atptour.players (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  avatar     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS atptour.matches (
  id            TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL REFERENCES atptour.tournaments(id),
  season        INTEGER NOT NULL,
  played_at     DATE NOT NULL,
  winner_id     TEXT NOT NULL REFERENCES atptour.players(id),
  loser_id      TEXT NOT NULL REFERENCES atptour.players(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS matches_season_idx     ON atptour.matches(season);
CREATE INDEX IF NOT EXISTS matches_played_at_idx  ON atptour.matches(played_at);
CREATE INDEX IF NOT EXISTS matches_winner_idx     ON atptour.matches(winner_id);

CREATE TABLE IF NOT EXISTS atptour.sets (
  id         SERIAL PRIMARY KEY,
  match_id   TEXT NOT NULL REFERENCES atptour.matches(id) ON DELETE CASCADE,
  set_idx    INTEGER NOT NULL,
  s1         INTEGER NOT NULL,
  s2         INTEGER NOT NULL,
  winner_id  TEXT NOT NULL REFERENCES atptour.players(id),
  is_tb      BOOLEAN NOT NULL DEFAULT FALSE,
  tb1        INTEGER,
  tb2        INTEGER
);

CREATE INDEX IF NOT EXISTS sets_match_idx ON atptour.sets(match_id);

CREATE TABLE IF NOT EXISTS atptour.app_config (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabella tracking migrazioni applicate
CREATE TABLE IF NOT EXISTS atptour.schema_migrations (
  filename   TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed tornei (idempotente)
INSERT INTO atptour.tournaments (id, name, surface, surface_label, color, icon, gradient, sort_order) VALUES
  ('ao', 'Australian Open', 'hard', 'Cemento',     '#3B9FE7', '🇦🇺', 'linear-gradient(135deg,#1a3a5c,#2563a0)', 1),
  ('rg', 'Roland Garros',   'clay', 'Terra Rossa', '#D4612B', '🇫🇷', 'linear-gradient(135deg,#5c2a1a,#a04325)', 2),
  ('uo', 'US Open',         'hard', 'Cemento',     '#1E40AF', '🇺🇸', 'linear-gradient(135deg,#1a2a5c,#1e40af)', 3)
ON CONFLICT (id) DO NOTHING;

-- Seed players di default (id fissi p1/p2)
INSERT INTO atptour.players (id, name, avatar) VALUES
  ('p1', 'Giocatore 1', NULL),
  ('p2', 'Giocatore 2', NULL)
ON CONFLICT (id) DO NOTHING;

-- Stagione corrente di default = 1
INSERT INTO atptour.app_config (key, value) VALUES
  ('current_season', '{"season": 1}'::jsonb)
ON CONFLICT (key) DO NOTHING;
