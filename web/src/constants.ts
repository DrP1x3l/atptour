// Costanti di dominio. Tournaments arrivano dal server (DB), ma li espongo qui
// per default in caso di startup offline.

export const PT = {
  win: 2000,
  lose: 1200,
  bagel: 100,
  dom: 150,
} as const;

export const MESI = [
  "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
  "Lug", "Ago", "Set", "Ott", "Nov", "Dic",
] as const;

export const TABS = [
  { id: "dash", l: "Home", e: "⚡" },
  { id: "new", l: "Match", e: "🎾" },
  { id: "hist", l: "Storico", e: "📋" },
  { id: "albo", l: "Albo", e: "🏆" },
  { id: "prof", l: "Profili", e: "👤" },
  { id: "cfg", l: "Setup", e: "⚙️" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export const AVATAR_OPTIONS = [
  "🧑‍🦱", "👨‍🦰", "👩‍🦳", "🧔", "🤴", "👸", "🥷",
  "🧙‍♂️", "🧝‍♂️", "🦸‍♂️", "🦹‍♂️", "🧛‍♂️",
  "🎾", "🏆", "👑", "🔥", "💪", "⚡",
  "🦁", "🐯", "🦅", "🦊", "🐺", "🐻",
];

export const SPONSORS: { name: string; bg: string }[] = [
  { name: "Emirates", bg: "#D71920" },
  { name: "Rolex", bg: "#006039" },
  { name: "Wilson", bg: "#E60000" },
  { name: "Lavazza", bg: "#003B4D" },
];

// TB target: 8 nei set normali, 10 nel super tie-break del 3° set.
export const TB_TARGET_REG = 8;
export const TB_TARGET_DECISIVE = 10;

// Set vinto quando games arrivano a 6 con margine >= 2, oppure 7-5 (5 = 4+1, vs 3 = 2+1)
// Internamente contiamo 0-based; vedi src/lib/scoring.ts.

export const STORAGE_KEY = "atptour_v3_cache";

export const SURFACE_LABELS: Record<string, string> = {
  hard: "Cemento",
  clay: "Terra Rossa",
  grass: "Erba",
};
