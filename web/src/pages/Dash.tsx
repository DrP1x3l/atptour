import { SL } from "../components/SL";
import { Av } from "../components/Av";
import { MiniChart } from "../components/MiniChart";
import { getH2H, getSeasonGSWinner, getRanking } from "../lib/stats";
import { fmtDate, fmtPts } from "../lib/format";
import type { AppState, StatsMap } from "../types";

export function Dash({ state, stats }: { state: AppState; stats: StatsMap }) {
  const ranking = getRanking(stats, state.players);
  const gsWinner = getSeasonGSWinner(state.matches, state.season);
  const gsPlayer = gsWinner ? state.players.find((p) => p.id === gsWinner) : null;
  const h2h = state.players.length >= 2
    ? getH2H(state.matches, state.players[0]!.id, state.players[1]!.id)
    : null;
  const last = state.matches[state.matches.length - 1];
  const lastTournament = last ? state.tournaments.find((t) => t.id === last.tournament) : null;

  return (
    <div className="pb-2">
      {gsPlayer && (
        <div className="squircle p-4 mt-2 mb-4 glow-gold animate-fade-in" style={{ background: "linear-gradient(135deg,#3a2e10,#1a1714)" }}>
          <div className="flex items-center gap-3">
            <div className="text-3xl animate-float">👑</div>
            <div>
              <div className="text-[10px] tracking-widest text-gold font-bold">
                GRAND SLAM · STAGIONE {state.season}
              </div>
              <div className="text-text font-extrabold text-lg">{gsPlayer.name}</div>
            </div>
          </div>
        </div>
      )}

      <SL>Classifica ATP</SL>
      <div className="squircle p-3 space-y-2">
        {ranking.map((r, i) => {
          const p = state.players.find((x) => x.id === r.id);
          if (!p) return null;
          return (
            <div key={r.id} className="flex items-center gap-3 p-2 rounded-xl bg-card2/60">
              <span className="text-mono text-text3 font-bold w-6 text-center">{r.pos}</span>
              <Av src={p.avatar} name={p.name} size={36} ring={i === 0} />
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{p.name}</div>
                <div className="text-text3 text-xs">
                  {stats[p.id]?.w ?? 0}V · {stats[p.id]?.l ?? 0}P
                </div>
              </div>
              <span className="text-mono text-gold font-bold">
                {fmtPts(r.pts)}
              </span>
            </div>
          );
        })}
      </div>

      {h2h && (
        <>
          <SL>Head to Head</SL>
          <div className="squircle p-4 flex items-center justify-around">
            <div className="flex flex-col items-center gap-1">
              <Av src={state.players[0]?.avatar} name={state.players[0]?.name} size={48} />
              <span className="text-xs text-text2">{state.players[0]?.name}</span>
              <span className="text-2xl font-extrabold text-gold text-mono">{h2h.a}</span>
            </div>
            <div className="text-text3 text-xs font-bold">vs</div>
            <div className="flex flex-col items-center gap-1">
              <Av src={state.players[1]?.avatar} name={state.players[1]?.name} size={48} />
              <span className="text-xs text-text2">{state.players[1]?.name}</span>
              <span className="text-2xl font-extrabold text-gold text-mono">{h2h.b}</span>
            </div>
          </div>
        </>
      )}

      <SL>Andamento Punti · Stagione {state.season}</SL>
      <MiniChart players={state.players} stats={stats} />

      {last && lastTournament && (
        <>
          <SL>Ultima Partita</SL>
          <div className="squircle p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{lastTournament.icon ?? "🎾"}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{lastTournament.name}</div>
                <div className="text-text3 text-xs">{fmtDate(last.date)}</div>
              </div>
              <div className="text-right">
                <div className="text-text2 text-[10px] tracking-wider">VINCITORE</div>
                <div className="font-bold text-gold">
                  {state.players.find((p) => p.id === last.winner)?.name ?? "—"}
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              {last.sets.map((s, i) => (
                <span key={i} className="text-mono text-sm bg-card2 px-2.5 py-1 rounded-lg border border-border2">
                  {s.s1}-{s.s2}
                  {s.isTb && s.tb1 !== null && s.tb2 !== null && (
                    <sup className="text-[9px] text-text3 ml-0.5">{Math.min(s.tb1, s.tb2)}</sup>
                  )}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
