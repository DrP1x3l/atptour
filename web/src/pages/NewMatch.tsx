import { useState } from "react";
import { motion } from "framer-motion";
import { SL } from "../components/SL";
import { Av } from "../components/Av";
import { ConfirmSheet } from "../components/ConfirmSheet";
import { addGame, addTb, initialScoreboard, type ScoreboardState } from "../lib/scoring";
import { useStore } from "../store/useStore";
import { haptic } from "../lib/haptic";
import { todayISO } from "../lib/format";
import { getBadges } from "../lib/stats";
import type { AppState, Match } from "../types";

type Step = "select" | "play" | "confirm" | "victory";

export function NewMatch({ state }: { state: AppState }) {
  const [step, setStep] = useState<Step>("select");
  const [tournament, setTournament] = useState<string | null>(null);
  const [sb, setSb] = useState<ScoreboardState>(initialScoreboard());
  const [scoreKey, setScoreKey] = useState(0);
  const [undoStack, setUndoStack] = useState<ScoreboardState[]>([]);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [savedMatch, setSavedMatch] = useState<Match | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const addMatch = useStore((s) => s.addMatch);

  const p1 = state.players[0]!;
  const p2 = state.players[1]!;

  const reset = () => {
    setStep("select");
    setTournament(null);
    setSb(initialScoreboard());
    setUndoStack([]);
    setWinnerId(null);
    setSavedMatch(null);
  };

  const push = (cur: ScoreboardState) => setUndoStack((s) => [...s, cur]);

  const handleGame = (who: 1 | 2) => {
    if (sb.tbOn) return;
    haptic("medium");
    push(sb);
    setScoreKey((k) => k + 1);
    const res = addGame(sb, who, p1.id, p2.id);
    setSb(res.state);
    if (res.kind === "matchDone") {
      setWinnerId(res.winner === "p1" ? p1.id : p2.id);
      setStep("confirm");
    }
  };

  const handleTb = (who: 1 | 2) => {
    if (!sb.tbOn) return;
    haptic("medium");
    push(sb);
    setScoreKey((k) => k + 1);
    const res = addTb(sb, who, p1.id, p2.id);
    setSb(res.state);
    if (res.kind === "matchDone") {
      setWinnerId(res.winner === "p1" ? p1.id : p2.id);
      setStep("confirm");
    }
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    haptic("light");
    const prev = undoStack[undoStack.length - 1]!;
    setUndoStack((s) => s.slice(0, -1));
    setSb(prev);
    setScoreKey((k) => k + 1);
  };

  const save = async () => {
    if (!tournament || !winnerId) return;
    const loserId = winnerId === p1.id ? p2.id : p1.id;
    const match: Omit<Match, "id"> = {
      tournament,
      season: state.season,
      date: todayISO(),
      winner: winnerId,
      loser: loserId,
      sets: sb.sets,
    };
    const created = await addMatch(match);
    if (created) {
      setSavedMatch(created);
      setStep("victory");
      haptic("success");
    }
  };

  // ---------- RENDER ----------
  if (step === "victory" && savedMatch) {
    const wP = state.players.find((p) => p.id === savedMatch.winner)!;
    const badges = getBadges(savedMatch, state.matches, state.tournaments);
    const trn = state.tournaments.find((t) => t.id === savedMatch.tournament);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="pt-4 text-center pb-4"
      >
        <motion.div
          initial={{ y: -20, scale: 0.6, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 14, stiffness: 200 }}
          className="text-7xl mb-2"
        >
          🏆
        </motion.div>
        <div className="text-[10px] tracking-[0.2em] text-gold font-bold">CAMPIONE</div>
        <div className="text-2xl font-extrabold mb-1">{wP.name}</div>
        <div className="text-text3 text-sm mb-4">{trn?.name}</div>
        <div className="flex justify-center gap-2 mb-5 flex-wrap">
          {savedMatch.sets.map((s, i) => (
            <span key={i} className="text-mono text-base bg-card2 px-3 py-1.5 rounded-lg border border-gold/30 text-gold font-bold">
              {s.s1}-{s.s2}
            </span>
          ))}
        </div>
        {badges.length > 0 && (
          <div className="flex flex-col gap-2 px-4 mb-5">
            {badges.map((b, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.15, type: "spring", damping: 12 }}
                className="squircle p-3 text-gold font-bold animate-badge-pop"
              >
                {b}
              </motion.div>
            ))}
          </div>
        )}
        <button
          onClick={reset}
          className="mx-4 mt-2 w-[calc(100%-2rem)] py-3.5 rounded-2xl bg-gold text-bg font-bold active:scale-95 transition-transform"
        >
          Nuovo Match
        </button>
      </motion.div>
    );
  }

  if (step === "confirm") {
    const wP = state.players.find((p) => p.id === winnerId)!;
    const trn = state.tournaments.find((t) => t.id === tournament);
    return (
      <div className="pt-2 pb-2">
        <SL>Conferma Risultato</SL>
        <div className="squircle p-4 mb-3">
          <div className="text-[10px] tracking-widest text-text3 mb-2">{trn?.name}</div>
          <div className="text-text font-extrabold text-lg">Vincitore: {wP.name}</div>
          <div className="mt-3 flex gap-2 flex-wrap">
            {sb.sets.map((s, i) => (
              <span key={i} className="text-mono text-base bg-card2 px-3 py-1.5 rounded-lg border border-border2 text-text">
                {s.s1}-{s.s2}
                {s.isTb && s.tb1 !== null && s.tb2 !== null && (
                  <sup className="text-[10px] text-text3 ml-0.5">{Math.min(s.tb1, s.tb2)}</sup>
                )}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { haptic("light"); reset(); }}
            className="flex-1 py-3 rounded-2xl bg-card2 border border-border2 text-text2 font-semibold active:scale-95 transition-transform"
          >
            Annulla
          </button>
          <button
            onClick={save}
            className="flex-1 py-3 rounded-2xl bg-gold text-bg font-bold active:scale-95 transition-transform"
          >
            Salva Risultato ✓
          </button>
        </div>
      </div>
    );
  }

  if (step === "select") {
    return (
      <div className="pt-2 pb-2">
        <SL>Nuovo Match · Seleziona Torneo</SL>
        <div className="grid grid-cols-1 gap-3">
          {state.tournaments.map((t) => (
            <button
              key={t.id}
              onClick={() => { haptic("medium"); setTournament(t.id); setStep("play"); }}
              className="rounded-3xl p-5 text-left active:scale-[0.98] transition-transform"
              style={{ background: t.gradient ?? t.color ?? "#222" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-4xl">{t.icon ?? "🎾"}</span>
                <div className="flex-1">
                  <div className="text-white font-extrabold text-lg">{t.name}</div>
                  <div className="text-white/70 text-xs">{t.surfaceLabel}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // step === "play": scoreboard
  const wnSets1 = sb.sets.filter((s) => s.winner === p1.id).length;
  const wnSets2 = sb.sets.filter((s) => s.winner === p2.id).length;
  const tourn = state.tournaments.find((t) => t.id === tournament);

  return (
    <div className="pt-2 pb-2">
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <div className="text-[10px] tracking-widest text-text3">{tourn?.name}</div>
          <div className="text-gold font-bold text-sm">
            {sb.curSet === 3 && sb.tbOn ? "SUPER TIE-BREAK DECISIVO" : sb.tbOn ? "TIE-BREAK" : `SET ${sb.curSet}`}
          </div>
        </div>
        <button
          onClick={() => setConfirmCancel(true)}
          className="text-text3 text-xs px-3 py-1.5 rounded-lg bg-card2 border border-border2"
        >
          Esci
        </button>
      </div>

      {/* SCORE PANEL */}
      <div className="squircle p-4">
        {/* SET WIN dots */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3].slice(0, Math.max(2, sb.curSet)).map((idx) => {
            const sFor1 = sb.sets[idx - 1]?.winner === p1.id;
            const sFor2 = sb.sets[idx - 1]?.winner === p2.id;
            return (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded-full ${sFor1 ? "bg-gold" : "bg-border2"}`} />
                <div className={`w-2.5 h-2.5 rounded-full ${sFor2 ? "bg-gold" : "bg-border2"}`} />
              </div>
            );
          })}
        </div>

        {/* PLAYER ROWS */}
        {[p1, p2].map((p, idx) => {
          const isP1 = idx === 0;
          const g = isP1 ? sb.g1 : sb.g2;
          const t = isP1 ? sb.t1 : sb.t2;
          const wnSets = isP1 ? wnSets1 : wnSets2;
          return (
            <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0 border-border">
              <div className="flex items-center gap-3 min-w-0">
                <Av src={p.avatar} name={p.name} size={40} />
                <div className="min-w-0">
                  <div className="font-bold truncate">{p.name}</div>
                  <div className="text-text3 text-[10px]">SET VINTI {wnSets}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {sb.sets.map((s, i) => (
                  <span key={i} className="text-mono text-sm text-text2 w-5 text-center">
                    {isP1 ? s.s1 : s.s2}
                  </span>
                ))}
                <motion.span
                  key={`${p.id}-${scoreKey}`}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.3 }}
                  className="text-mono text-3xl text-gold font-bold w-10 text-center"
                >
                  {sb.tbOn ? t : g}
                </motion.span>
              </div>
            </div>
          );
        })}
      </div>

      {/* TASTI */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          onClick={() => (sb.tbOn ? handleTb(1) : handleGame(1))}
          className="py-5 rounded-2xl bg-card2 border border-border2 active:scale-95 transition-transform"
        >
          <div className="text-text2 text-[10px] tracking-wider mb-1">{p1.name.toUpperCase()}</div>
          <div className="text-gold font-extrabold text-xl">
            +1 {sb.tbOn ? "Punto" : "Game"}
          </div>
        </button>
        <button
          onClick={() => (sb.tbOn ? handleTb(2) : handleGame(2))}
          className="py-5 rounded-2xl bg-card2 border border-border2 active:scale-95 transition-transform"
        >
          <div className="text-text2 text-[10px] tracking-wider mb-1">{p2.name.toUpperCase()}</div>
          <div className="text-gold font-extrabold text-xl">
            +1 {sb.tbOn ? "Punto" : "Game"}
          </div>
        </button>
      </div>

      <button
        onClick={undo}
        disabled={undoStack.length === 0}
        className="mt-2 w-full py-2.5 rounded-2xl text-text3 text-sm border border-border disabled:opacity-40"
      >
        ↩ Annulla ultimo
      </button>

      <ConfirmSheet
        open={confirmCancel}
        title="Uscire dalla partita?"
        message="Il punteggio verrà perso. Confermi?"
        confirmLabel="Esci"
        cancelLabel="Resta"
        danger
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => { setConfirmCancel(false); reset(); }}
      />
    </div>
  );
}
