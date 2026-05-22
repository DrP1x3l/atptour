import { SL } from "../components/SL";
import { Av } from "../components/Av";
import { fmtPts } from "../lib/format";
import type { AppState, StatsMap } from "../types";

export function Prof({ state, stats }: { state: AppState; stats: StatsMap }) {
  return (
    <div className="pt-2 pb-2">
      <SL>Profili Giocatori</SL>
      <div className="space-y-3">
        {state.players.map((p) => {
          const s = stats[p.id];
          if (!s) return null;
          const winRate = s.played > 0 ? Math.round((s.w / s.played) * 100) : 0;
          return (
            <div key={p.id} className="squircle p-4">
              <div className="flex items-center gap-3 mb-3">
                <Av src={p.avatar} name={p.name} size={56} />
                <div>
                  <div className="font-extrabold text-lg">{p.name}</div>
                  <div className="text-text3 text-xs">
                    {s.w}V – {s.l}P · {s.played} partite
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Stat label="PUNTI ATP" value={fmtPts(s.pts)} accent />
                <Stat label="WIN RATE" value={`${winRate}%`} />
                <Stat label="SLAM 🏆" value={String(s.slams)} />
              </div>
              <div className="grid grid-cols-5 gap-2 mt-2">
                <Stat label="Set" value={`${s.sW}/${s.sW + s.sL}`} small />
                <Stat label="TB" value={`${s.tbW}/${s.tbW + s.tbL}`} small />
                <Stat label="Streak" value={String(s.streak)} small />
                <Stat label="Bagel" value={String(s.bagels)} small />
                <Stat label="Dom" value={String(s.doms)} small />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <SurfaceStat surface="hard" w={s.bySurf.hard?.w ?? 0} l={s.bySurf.hard?.l ?? 0} />
                <SurfaceStat surface="clay" w={s.bySurf.clay?.w ?? 0} l={s.bySurf.clay?.l ?? 0} />
              </div>
              <div className="flex gap-1 mt-3">
                {s.form.length === 0 ? (
                  <span className="text-text3 text-[10px]">Nessuna partita</span>
                ) : (
                  s.form.map((f, i) => (
                    <span
                      key={i}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        f === "V" ? "bg-green text-bg" : "bg-red text-white"
                      }`}
                    >
                      {f}
                    </span>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: string;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div className="bg-card2 rounded-xl p-2 text-center border border-border2">
      <div className="text-[9px] tracking-wider text-text3 uppercase mb-0.5">{label}</div>
      <div
        className={`text-mono font-bold ${
          accent ? "text-gold" : "text-text"
        } ${small ? "text-sm" : "text-base"}`}
      >
        {value}
      </div>
    </div>
  );
}

function SurfaceStat({ surface, w, l }: { surface: "hard" | "clay"; w: number; l: number }) {
  return (
    <div
      className="rounded-xl p-2 text-center"
      style={{ background: surface === "hard" ? "#1a3a5c" : "#5c2a1a" }}
    >
      <div className="text-[9px] tracking-wider text-white/70 uppercase">
        {surface === "hard" ? "Cemento" : "Terra Rossa"}
      </div>
      <div className="text-white font-bold text-mono text-sm">{w}V · {l}P</div>
    </div>
  );
}
