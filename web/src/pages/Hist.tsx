import { useMemo, useState } from "react";
import { SL } from "../components/SL";
import { SwipeRow } from "../components/SwipeRow";
import { ConfirmSheet } from "../components/ConfirmSheet";
import { useStore } from "../store/useStore";
import { fmtDate } from "../lib/format";
import type { AppState } from "../types";

export function Hist({ state }: { state: AppState }) {
  const removeMatch = useStore((s) => s.removeMatch);
  const [delId, setDelId] = useState<string | null>(null);
  const [seasonFilter, setSeasonFilter] = useState<number | "all">(state.season);

  const seasons = useMemo(() => {
    const set = new Set<number>(state.matches.map((m) => m.season));
    return Array.from(set).sort((a, b) => b - a);
  }, [state.matches]);

  const matches = useMemo(() => {
    const arr = seasonFilter === "all"
      ? state.matches
      : state.matches.filter((m) => m.season === seasonFilter);
    return [...arr].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [state.matches, seasonFilter]);

  return (
    <div className="pt-2 pb-2">
      <SL>Storico Partite</SL>
      <div className="flex gap-2 mb-3 overflow-x-auto -mx-1 px-1">
        <Chip active={seasonFilter === "all"} onClick={() => setSeasonFilter("all")}>Tutte</Chip>
        {seasons.map((s) => (
          <Chip key={s} active={seasonFilter === s} onClick={() => setSeasonFilter(s)}>
            S{s}
          </Chip>
        ))}
      </div>

      {matches.length === 0 ? (
        <div className="squircle p-6 text-center text-text3 text-sm">
          Nessuna partita.
        </div>
      ) : (
        <div className="space-y-2">
          {matches.map((m) => {
            const t = state.tournaments.find((x) => x.id === m.tournament);
            const winner = state.players.find((p) => p.id === m.winner)?.name ?? "—";
            const loser = state.players.find((p) => p.id === m.loser)?.name ?? "—";
            return (
              <SwipeRow key={m.id} onDelete={() => setDelId(m.id)}>
                <div className="squircle p-3 border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{t?.icon ?? "🎾"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{t?.name ?? m.tournament}</div>
                      <div className="text-text3 text-[11px]">{fmtDate(m.date)} · S{m.season}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-gold text-xs font-bold">{winner}</div>
                      <div className="text-text3 text-[10px]">def. {loser}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    {m.sets.map((s, i) => (
                      <span key={i} className="text-mono text-[11px] bg-card2 px-2 py-0.5 rounded-md text-text2">
                        {s.s1}-{s.s2}
                        {s.isTb && s.tb1 !== null && s.tb2 !== null && (
                          <sup className="text-[9px] text-text3 ml-0.5">{Math.min(s.tb1, s.tb2)}</sup>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </SwipeRow>
            );
          })}
        </div>
      )}

      <ConfirmSheet
        open={!!delId}
        title="Eliminare la partita?"
        message="L'operazione non è reversibile."
        confirmLabel="Elimina"
        danger
        onCancel={() => setDelId(null)}
        onConfirm={() => {
          if (delId) removeMatch(delId);
          setDelId(null);
        }}
      />
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
        active
          ? "bg-gold text-bg border-gold"
          : "bg-card2 text-text2 border-border2"
      }`}
    >
      {children}
    </button>
  );
}
