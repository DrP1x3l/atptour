import { useMemo, useState } from "react";
import type { Player, StatsMap } from "../types";

interface Props {
  players: Player[];
  stats: StatsMap;
}

export function MiniChart({ players, stats }: Props) {
  const [sel, setSel] = useState<number | null>(null);

  const series = useMemo(() => {
    const arr = players.map((p) => ({
      id: p.id,
      name: p.name,
      data: stats[p.id]?.ptsHistory ?? [],
    }));
    return arr;
  }, [players, stats]);

  const maxLen = Math.max(0, ...series.map((s) => s.data.length));
  const maxVal = Math.max(1, ...series.flatMap((s) => s.data));

  if (maxLen === 0) {
    return (
      <div className="squircle p-4 text-text3 text-center text-sm">
        Nessuna partita ancora.
      </div>
    );
  }

  const W = 320;
  const H = 130;
  const px = (i: number) => (maxLen <= 1 ? W / 2 : (i / (maxLen - 1)) * (W - 16) + 8);
  const py = (v: number) => H - 12 - (v / maxVal) * (H - 24);

  const colors = ["#D4A843", "#6B6058"]; // leader gold, sfidante grigio

  return (
    <div className="squircle p-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* grid baseline */}
        <line x1="8" y1={H - 12} x2={W - 8} y2={H - 12} stroke="#2A2520" strokeWidth="1" />
        {series.map((s, idx) => {
          if (s.data.length === 0) return null;
          const d = s.data
            .map((v, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${py(v)}`)
            .join(" ");
          return (
            <g key={s.id}>
              <path d={d} stroke={colors[idx] ?? "#888"} strokeWidth="2.5" fill="none" />
              {s.data.map((v, i) => (
                <circle
                  key={i}
                  cx={px(i)}
                  cy={py(v)}
                  r={sel === i ? 4 : 2.2}
                  fill={colors[idx] ?? "#888"}
                  onPointerDown={() => setSel(i)}
                />
              ))}
            </g>
          );
        })}
        {sel !== null && (
          <g>
            <line x1={px(sel)} y1="4" x2={px(sel)} y2={H - 12} stroke="#A89E94" strokeDasharray="3 3" />
          </g>
        )}
      </svg>
      <div className="text-[10px] text-text3 text-center mt-1">
        {sel === null
          ? "Tocca un punto per vedere il dettaglio"
          : series
              .map((s) => `${s.name}: ${s.data[sel]?.toLocaleString("it-IT") ?? "—"}`)
              .join("  ·  ")}
      </div>
    </div>
  );
}
