import {
  pgSchema,
  text,
  integer,
  boolean,
  date,
  timestamp,
  serial,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const atptour = pgSchema("atptour");

export const tournaments = atptour.table("tournaments", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  surface: text("surface").notNull(),
  surfaceLabel: text("surface_label").notNull(),
  color: text("color"),
  icon: text("icon"),
  gradient: text("gradient"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const players = atptour.table("players", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const matches = atptour.table(
  "matches",
  {
    id: text("id").primaryKey(),
    tournamentId: text("tournament_id")
      .notNull()
      .references(() => tournaments.id),
    season: integer("season").notNull(),
    playedAt: date("played_at").notNull(),
    winnerId: text("winner_id")
      .notNull()
      .references(() => players.id),
    loserId: text("loser_id")
      .notNull()
      .references(() => players.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    seasonIdx: index("matches_season_idx").on(t.season),
    playedAtIdx: index("matches_played_at_idx").on(t.playedAt),
    winnerIdx: index("matches_winner_idx").on(t.winnerId),
  })
);

export const sets = atptour.table(
  "sets",
  {
    id: serial("id").primaryKey(),
    matchId: text("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    setIdx: integer("set_idx").notNull(),
    s1: integer("s1").notNull(),
    s2: integer("s2").notNull(),
    winnerId: text("winner_id")
      .notNull()
      .references(() => players.id),
    isTb: boolean("is_tb").notNull().default(false),
    tb1: integer("tb1"),
    tb2: integer("tb2"),
  },
  (t) => ({
    matchIdx: index("sets_match_idx").on(t.matchId),
  })
);

export const appConfig = atptour.table("app_config", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Helper: chiave del season corrente
export const CURRENT_SEASON_KEY = "current_season";
