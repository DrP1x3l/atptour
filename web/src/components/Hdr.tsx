import { Av } from "./Av";
import { fmtDate, todayISO } from "../lib/format";
import type { Player, StatsMap } from "../types";

interface Props {
  leader: Player | null;
  stats: StatsMap;
  season: number;
}

export function Hdr({ leader, stats, season }: Props) {
  const pts = leader ? stats[leader.id]?.pts ?? 0 : 0;
  return (
    <header className="flex items-center gap-3 px-4 pt-4 pb-1 safe-top">
      <Av src={leader?.avatar} name={leader?.name} size={48} ring />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-[0.18em] text-text3 uppercase">
            N°1 · LEADER ATP
          </span>
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-text font-bold text-lg truncate">
            {leader?.name ?? "—"}
          </h1>
          <span className="text-mono text-gold text-sm font-bold">
            {pts.toLocaleString("it-IT")}
          </span>
        </div>
        <div className="text-text3 text-[11px] mt-0.5">
          {fmtDate(todayISO())} · <span className="text-gold font-bold">S{season}</span>
        </div>
      </div>
    </header>
  );
}
