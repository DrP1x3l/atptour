// Section Label: titoletti grigi in maiuscolo
import type { ReactNode } from "react";

export function SL({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-text3 text-[11px] font-bold tracking-[0.18em] uppercase px-1 mb-2 mt-5">
      {children}
    </h2>
  );
}
