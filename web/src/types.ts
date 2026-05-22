export type SurfaceType = "hard" | "clay" | "grass";

export interface Tournament {
  id: string;
  name: string;
  surface: SurfaceType;
  surfaceLabel: string;
  color: string | null;
  icon: string | null;
  gradient: string | null;
  sortOrder?: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: string | null;
}

export interface MatchSet {
  set: number;
  s1: number;
  s2: number;
  winner: string;
  isTb: boolean;
  tb1: number | null;
  tb2: number | null;
}

export interface Match {
  id: string;
  tournament: string;
  season: number;
  date: string; // YYYY-MM-DD
  winner: string;
  loser: string;
  sets: MatchSet[];
}

export interface AppState {
  season: number;
  players: Player[];
  tournaments: Tournament[];
  matches: Match[];
}

export interface PlayerStats {
  played: number;
  w: number;
  l: number;
  sW: number;
  sL: number;
  tbW: number;
  tbL: number;
  pts: number;
  slams: number;
  bagels: number;
  doms: number;
  streak: number;
  best: number;
  byT: Record<string, { w: number; l: number }>;
  bySn: Record<number, { pts: number; w: number; l: number; slams: number }>;
  bySurf: Record<SurfaceType, { w: number; l: number }>;
  ptsHistory: number[];
  form: ("V" | "P")[];
}

export type StatsMap = Record<string, PlayerStats>;
