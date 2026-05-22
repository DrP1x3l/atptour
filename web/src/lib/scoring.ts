// Logica scoreboard per NewMatch.
// Replico la semantica del monolite (riga 320-322).
//
// I games sono numerati 0-based internamente; il counter "g" significa "game vinti".
// Set chiuso senza TB:
//   p1 vince: (g1 === 4 && g2 <= 2) || (g1 === 5 && g2 === 3)   -> rappresentati 6-X
//   p2 vince: simmetrico
// TB attivo quando g1 === 4 && g2 === 4 (sul 5-5 logico)
// TB target: 8 normalmente, 10 nel super TB del 3° set
// Si vince con >= target e margin >= 2
//
// Quando si chiude un TB normale, il games count del vincitore TB diventa 5+1=6
// (cioe' 7-6 in display).
//
// Stato di un set salvato:
//   { set, s1, s2, winner, isTb, tb1, tb2 }
//
// NOTA: nel monolite s1/s2 erano scritti come games "internal" (es. 4-2, 5-3),
// e 7-6 quando TB. Manteniamo lo stesso formato per compatibilita' dello storico.

import { TB_TARGET_DECISIVE, TB_TARGET_REG } from "../constants";
import type { MatchSet } from "../types";

export interface ScoreboardState {
  curSet: 1 | 2 | 3;
  g1: number;
  g2: number;
  tbOn: boolean;
  t1: number;
  t2: number;
  sets: MatchSet[];
}

export function initialScoreboard(): ScoreboardState {
  return { curSet: 1, g1: 0, g2: 0, tbOn: false, t1: 0, t2: 0, sets: [] };
}

export type AddGameResult =
  | { kind: "ongoing"; state: ScoreboardState }
  | { kind: "setClosed"; state: ScoreboardState }
  | { kind: "matchDone"; state: ScoreboardState; winner: "p1" | "p2" };

export function addGame(
  prev: ScoreboardState,
  who: 1 | 2,
  p1Id: string,
  p2Id: string
): AddGameResult {
  const g1 = who === 1 ? prev.g1 + 1 : prev.g1;
  const g2 = who === 2 ? prev.g2 + 1 : prev.g2;

  // set chiuso senza TB
  const p1Wins =
    (g1 === 4 && g2 <= 2) || (g1 === 5 && g2 === 3); // 6-0, 6-1, 6-2, 7-5
  const p2Wins =
    (g2 === 4 && g1 <= 2) || (g2 === 5 && g1 === 3);

  if (p1Wins || p2Wins) {
    return closeSet(
      { ...prev, g1, g2 },
      p1Wins ? p1Id : p2Id,
      false,
      null,
      null,
      p1Id,
      p2Id
    );
  }

  // attivazione TB su 5-5 (4-4 nel counter 0-based)
  if (g1 === 4 && g2 === 4) {
    return { kind: "ongoing", state: { ...prev, g1, g2, tbOn: true, t1: 0, t2: 0 } };
  }
  return { kind: "ongoing", state: { ...prev, g1, g2 } };
}

export function addTb(
  prev: ScoreboardState,
  who: 1 | 2,
  p1Id: string,
  p2Id: string
): AddGameResult {
  const t1 = who === 1 ? prev.t1 + 1 : prev.t1;
  const t2 = who === 2 ? prev.t2 + 1 : prev.t2;
  const target = prev.curSet === 3 ? TB_TARGET_DECISIVE : TB_TARGET_REG;

  const p1Wins = t1 >= target && t1 - t2 >= 2;
  const p2Wins = t2 >= target && t2 - t1 >= 2;

  if (!p1Wins && !p2Wins) {
    return { kind: "ongoing", state: { ...prev, t1, t2 } };
  }
  const winnerId = p1Wins ? p1Id : p2Id;

  if (prev.curSet === 3) {
    // super TB del 3° set: chiude DIRETTAMENTE il match con set finale
    const finalSet: MatchSet = {
      set: 3, s1: t1, s2: t2, winner: winnerId, isTb: true, tb1: t1, tb2: t2,
    };
    const all = [...prev.sets, finalSet];
    return {
      kind: "matchDone",
      state: { ...prev, t1, t2, sets: all },
      winner: p1Wins ? "p1" : "p2",
    };
  }
  // TB normale: chiude il set con 7-6
  const finalG1 = p1Wins ? prev.g1 + 1 : prev.g1; // 5+1 = 6 nel monolite => display 7-6
  const finalG2 = p2Wins ? prev.g2 + 1 : prev.g2;
  return closeSet(
    { ...prev, g1: finalG1, g2: finalG2, t1, t2 },
    winnerId,
    true,
    t1,
    t2,
    p1Id,
    p2Id
  );
}

function closeSet(
  prev: ScoreboardState,
  winnerId: string,
  isTb: boolean,
  tb1: number | null,
  tb2: number | null,
  p1Id: string,
  p2Id: string
): AddGameResult {
  const ns: MatchSet = {
    set: prev.curSet,
    s1: prev.g1,
    s2: prev.g2,
    winner: winnerId,
    isTb,
    tb1,
    tb2,
  };
  const all = [...prev.sets, ns];
  const w1 = all.filter((s) => s.winner === p1Id).length;
  const w2 = all.filter((s) => s.winner === p2Id).length;

  if (w1 === 2 || w2 === 2) {
    return {
      kind: "matchDone",
      state: { ...prev, sets: all },
      winner: w1 === 2 ? "p1" : "p2",
    };
  }
  if (w1 === 1 && w2 === 1) {
    // super tie-break decisivo
    return {
      kind: "setClosed",
      state: { ...prev, sets: all, curSet: 3, g1: 0, g2: 0, tbOn: true, t1: 0, t2: 0 },
    };
  }
  return {
    kind: "setClosed",
    state: {
      ...prev,
      sets: all,
      curSet: (prev.curSet + 1) as 1 | 2 | 3,
      g1: 0,
      g2: 0,
      tbOn: false,
      t1: 0,
      t2: 0,
    },
  };
}

/** Renderizza un set in display 7-6 / 6-4 ecc.
 *  Internamente i contatori arrivano fino a 5+1=6 (TB chiude a 7-6).
 *  Il monolite salvava 4-X / 5-3 / 7-6: qui adottiamo lo STESSO formato salvato. */
export function displaySet(s: MatchSet): string {
  if (s.isTb && s.set === 3) {
    return `${s.s1}-${s.s2}`; // super TB
  }
  return `${s.s1}-${s.s2}`;
}
