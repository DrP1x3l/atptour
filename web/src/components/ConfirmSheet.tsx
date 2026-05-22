import { BottomSheet } from "./BottomSheet";
import { haptic } from "../lib/haptic";

interface Props {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmSheet({
  open,
  title,
  message,
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <BottomSheet open={open} onClose={onCancel} title={title}>
      {message && <p className="text-text2 text-sm mb-5">{message}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => { haptic("medium"); onCancel(); }}
          className="flex-1 py-3 rounded-2xl bg-card2 border border-border2 text-text2 font-semibold active:scale-95 transition-transform"
        >
          {cancelLabel}
        </button>
        <button
          onClick={() => { haptic(danger ? "error" : "success"); onConfirm(); }}
          className={`flex-1 py-3 rounded-2xl font-bold active:scale-95 transition-transform ${
            danger
              ? "bg-red text-white"
              : "bg-gold text-bg"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </BottomSheet>
  );
}
