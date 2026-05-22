// Port di calcStats dal monolite (riga 89-116).
// Mantenuta la stessa semantica numerica (win/lose/bagel/dom in punti).

import type { Match, Player, StatsMap, Tournament } from "../types";
import { PT } from "../constants";

export function calcStats(
  matches: Match[],
  players: Player[],
  tournaments: Tournament[]
): StatsMap {
  const s: StatsMap = {};
  for (const p of players) {
    s[p.id] = {
      played: 0,
      w: 0,
      l: 0,
      sW: 0,
      sL: 0,
      tbW: 0,
      tbL: 0,
      pts: 0,
      slams: 0,
      bagels: 0,
      doms: 0,
      streak: 0,
      best: 0,
      byT: {},
      bySn: {},
      bySurf: { hard: { w: 0, l: 0 }, clay: { w: 0, l: 0 }, grass: { w: 0, l: 0 } },
      ptsHistory: [],
      form: [],
    };
    for (const t of tournaments) s[p.id]!.byT[t.id] = { w: 0, l: 0 };
  }

  const cumPts: Record<string, number> = {};
  for (const p of players) cumPts[p.id] = 0;

  const ordered = [...matches].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const m of ordered) {
    const W = s[m.winner];
    const L = s[m.loser];
    if (!W || !L) continue;
    W.played++; L.played++;
    W.w++; L.l++;
    for (const st of m.sets) {
      if (st.winner === m.winner) { W.sW++; L.sL++; }
      else { L.sW++; W.sL++; }
      if (st.isTb) {
        if (st.winner === m.winner) { W.tbW++; L.tbL++; }
        else { L.tbW++; W.tbL++; }
      }
    }
    const bag = m.sets.some((st) => (st.s1 === 0 || st.s2 === 0) && !st.isTb);
    const dom =
      m.sets.filter((st) => st.winner === m.winner).length === 2 &&
      m.sets.length === 2;

    let wp = PT.win;
    const lp = PT.lose;
    if (bag) { wp += PT.bagel; W.bagels++; }
    if (dom) { wp += PT.dom; W.doms++; }
    W.pts += wp; L.pts += lp;
    W.slams++;
    if (W.byT[m.tournament]) W.byT[m.tournament]!.w++;
    if (L.byT[m.tournament]) L.byT[m.tournament]!.l++;
    const sn = m.season;
    if (!W.bySn[sn]) W.bySn[sn] = { pts: 0, w: 0, l: 0, slams: 0 };
    if (!L.bySn[sn]) L.bySn[sn] = { pts: 0, w: 0, l: 0, slams: 0 };
    W.bySn[sn]!.pts += wp; W.bySn[sn]!.w++; W.bySn[sn]!.slams++;
    L.bySn[sn]!.pts += lp; L.bySn[sn]!.l++;
    const surfType = (tournaments.find((t) => t.id === m.tournament)?.surface ?? "hard") as keyof typeof W.bySurf;
    W.bySurf[surfType]!.w++; L.bySurf[surfType]!.l++;
    W.streak = W.streak >= 0 ? W.streak + 1 : 1;
    L.streak = L.streak <= 0 ? L.streak - 1 : -1;
    W.best = Math.max(W.best, W.streak);
    cumPts[m.winner]! += wp;
    cumPts[m.loser]! += lp;
    W.ptsHistory.push(cumPts[m.winner]!);
    L.ptsHistory.push(cumPts[m.loser]!);
    W.form.push("V"); L.form.push("P");
  }
  for (const p of players) s[p.id]!.form = s[p.id]!.form.slice(-5);
  return s;
}

export function getRanking(stats: StatsMap, players: Player[]) {
  return players
    .map((p) => ({ id: p.id, pts: stats[p.id]?.pts ?? 0, name: p.name }))
    .sort((a, b) => b.pts - a.pts)
    .map((r, i) => ({ ...r, pos: i + 1 }));
}

export function getH2H(matches: Match[], a: string, b: string) {
  const r = matches.filter(
    (m) => (m.winner === a && m.loser === b) || (m.winner === b && m.loser === a)
  );
  return {
    a: r.filter((m) => m.winner === a).length,
    b: r.filter((m) => m.winner === b).length,
    total: r.length,
  };
}

/** Achievements unificati (era duplicato nel monolite). */
export function getBadges(
  match: Match,
  allMatches: Match[],
  tournaments: Tournament[]
): string[] {
  const out: string[] = [];
  const tName = tournaments.find((t) => t.id === match.tournament)?.name ?? "";
  const tWins = allMatches.filter(
    (m) => m.winner === match.winner && m.tournament === match.tournament
  ).length;
  if (tWins === 1) out.push(`🎉 Prima vittoria al ${tName}!`);

  // streak alla vigilia di questo match (escluso)
  const before = allMatches
    .filter((m) => m.id !== match.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let streak = 1; // include il match corrente
  for (let i = before.length - 1; i >= 0; i--) {
    if (before[i]!.winner === match.winner) streak++;
    else break;
  }
  if (streak === 3) out.push("🔥 3 vittorie di fila!");
  if (streak === 5) out.push("💀 5 vittorie di fila! Inarrestabile!");

  const totalSlams = allMatches.filter((m) => m.winner === match.winner).length;
  if (totalSlams === 1) out.push("🏆 Primo Slam vinto!");

  const sWins = new Set(
    allMatches
      .filter((m) => m.season === match.season && m.winner === match.winner)
      .map((m) => m.tournament)
  );
  if (sWins.size === 3) out.push("👑 GRAND SLAM! Tutti e 3 i tornei!");

  const isDom =
    match.sets.filter((st) => st.winner === match.winner).length === 2 &&
    match.sets.length === 2;
  if (isDom) out.push("💪 Domination! Vittoria 2-0!");

  const hasBagel = match.sets.some(
    (st) => (st.s1 === 0 || st.s2 === 0) && !st.isTb
  );
  if (hasBagel) out.push("🥯 Bagel servito!");

  return out;
}

/** Vincitore Grand Slam di una stagione, se esiste. */
export function getSeasonGSWinner(
  matches: Match[],
  season: number
): string | null {
  const sW = new Map<string, Set<string>>();
  for (const m of matches.filter((m) => m.season === season)) {
    const set = sW.get(m.winner) ?? new Set();
    set.add(m.tournament);
    sW.set(m.winner, set);
  }
  for (const [pid, ts] of sW) if (ts.size === 3) return pid;
  return null;
}
