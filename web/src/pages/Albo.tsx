import { useMemo } from "react";
import { SL } from "../components/SL";
import { getSeasonGSWinner } from "../lib/stats";
import type { AppState } from "../types";

export function Albo({ state }: { state: AppState }) {
  const seasons = useMemo(() => {
    const set = new Set<number>(state.matches.map((m) => m.season));
    return Array.from(set).sort((a, b) => b - a);
  }, [state.matches]);

  return (
    <div className="pt-2 pb-2">
      <SL>Albo d'Oro</SL>
      {seasons.length === 0 ? (
        <div className="squircle p-6 text-center text-text3 text-sm">
          Nessuno Slam vinto. Inizia da Match → seleziona torneo.
        </div>
      ) : (
        <div className="space-y-3">
          {seasons.map((sn) => {
            const gsWinnerId = getSeasonGSWinner(state.matches, sn);
            const gsPlayer = gsWinnerId
              ? state.players.find((p) => p.id === gsWinnerId)
              : null;
            return (
              <div key={sn} className="squircle p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-[10px] tracking-widest text-text3">STAGIONE</div>
                    <div className="text-gold font-extrabold text-xl text-mono">S{sn}</div>
                  </div>
                  {gsPlayer && (
                    <div className="bg-gold/15 border border-gold/40 px-3 py-1.5 rounded-full">
                      <span className="text-gold font-bold text-xs">
                        👑 {gsPlayer.name} · GRAND SLAM
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {state.tournaments.map((t) => {
                    const winnerMatch = state.matches.find(
                      (m) => m.season === sn && m.tournament === t.id
                    );
                    const winner = winnerMatch
                      ? state.players.find((p) => p.id === winnerMatch.winner)
                      : null;
                    return (
                      <div
                        key={t.id}
                        className="rounded-2xl p-3 text-center"
                        style={{
                          background: winner
                            ? t.gradient ?? t.color ?? "#222"
                            : "#1A1714",
                        }}
                      >
                        <div className="text-2xl mb-1">{t.icon ?? "🎾"}</div>
                        <div className="text-[10px] text-white/70 tracking-wider">
                          {t.name.split(" ")[0]?.toUpperCase()}
                        </div>
                        <div className={`text-sm font-bold truncate ${winner ? "text-white" : "text-text3"}`}>
                          {winner?.name ?? "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
