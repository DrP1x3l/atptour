import { MESI } from "../constants";

export function fmtDate(iso: string): string {
  // YYYY-MM-DD -> "12 Mag 2025"
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  const month = MESI[Number(m) - 1] ?? m;
  return `${Number(d)} ${month} ${y}`;
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fmtPts(n: number): string {
  return n.toLocaleString("it-IT");
}

export function gid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
