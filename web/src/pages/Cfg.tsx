import { useState } from "react";
import { SL } from "../components/SL";
import { Av } from "../components/Av";
import { BottomSheet } from "../components/BottomSheet";
import { ConfirmSheet } from "../components/ConfirmSheet";
import { useStore } from "../store/useStore";
import { AVATAR_OPTIONS } from "../constants";
import { haptic } from "../lib/haptic";
import type { AppState, Player } from "../types";

export function Cfg({ state }: { state: AppState }) {
  const updatePlayer = useStore((s) => s.updatePlayer);
  const setSeason = useStore((s) => s.setSeason);
  const resetAll = useStore((s) => s.resetAll);

  const [picker, setPicker] = useState<Player | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="pt-2 pb-2">
      <SL>Impostazioni</SL>

      <div className="space-y-3">
        {state.players.map((p) => (
          <PlayerRow
            key={p.id}
            player={p}
            onName={(name) => updatePlayer(p.id, { name })}
            onAvatarPick={() => setPicker(p)}
          />
        ))}
      </div>

      <SL>Stagione</SL>
      <div className="squircle p-4">
        <div className="text-text3 text-xs mb-2">
          Stagione corrente. Aumenta a fine anno per separare le classifiche.
        </div>
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => state.season > 1 && setSeason(state.season - 1)}
            disabled={state.season <= 1}
            className="w-12 h-12 rounded-2xl bg-card2 border border-border2 disabled:opacity-40 text-text font-bold text-xl active:scale-95"
          >−</button>
          <div className="text-mono text-3xl font-bold text-gold">S{state.season}</div>
          <button
            onClick={() => setSeason(state.season + 1)}
            className="w-12 h-12 rounded-2xl bg-card2 border border-border2 text-text font-bold text-xl active:scale-95"
          >+</button>
        </div>
      </div>

      <SL>Reset</SL>
      <button
        onClick={() => setConfirmReset(true)}
        className="w-full py-3 rounded-2xl bg-card2 border border-red/40 text-red font-bold active:scale-95 transition-transform"
      >
        Cancella tutte le partite
      </button>

      <ConfirmSheet
        open={confirmReset}
        title="Reset completo?"
        message="Verranno cancellate TUTTE le partite. I giocatori restano. La stagione torna a S1."
        confirmLabel="Cancella tutto"
        danger
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => { setConfirmReset(false); resetAll(); }}
      />

      <BottomSheet
        open={!!picker}
        onClose={() => setPicker(null)}
        title={`Avatar per ${picker?.name ?? ""}`}
      >
        <div className="grid grid-cols-6 gap-2">
          {AVATAR_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                if (picker) {
                  haptic("light");
                  updatePlayer(picker.id, { avatar: emoji });
                  setPicker(null);
                }
              }}
              className="aspect-square rounded-xl bg-card2 border border-border2 flex items-center justify-center text-2xl active:scale-95 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            if (picker) {
              updatePlayer(picker.id, { avatar: null });
              setPicker(null);
            }
          }}
          className="mt-3 w-full py-3 rounded-2xl bg-card2 border border-border2 text-text2 font-semibold"
        >
          Rimuovi avatar
        </button>
      </BottomSheet>
    </div>
  );
}

function PlayerRow({
  player,
  onName,
  onAvatarPick,
}: {
  player: Player;
  onName: (n: string) => void;
  onAvatarPick: () => void;
}) {
  const [name, setName] = useState(player.name);
  return (
    <div className="squircle p-3 flex items-center gap-3">
      <button onClick={onAvatarPick} className="active:scale-95 transition-transform">
        <Av src={player.avatar} name={player.name} size={48} />
      </button>
      <input
        className="flex-1 bg-card2 border border-border2 rounded-xl px-3 py-2.5 outline-none focus:border-gold transition-colors"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name.trim() && name.trim() !== player.name && onName(name.trim())}
        placeholder="Nome"
        maxLength={30}
      />
    </div>
  );
}
