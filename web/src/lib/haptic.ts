// Wrapper haptic feedback con fallback a vibrate API.
type Strength = "light" | "medium" | "heavy" | "success" | "warning" | "error";

const map: Record<Strength, number | number[]> = {
  light: 8,
  medium: 18,
  heavy: 35,
  success: [10, 30, 10],
  warning: [25, 40, 25],
  error: [40, 60, 40, 60],
};

export function haptic(strength: Strength = "light") {
  if (typeof window === "undefined") return;
  const nav = window.navigator as Navigator & {
    vibrate?: (p: number | number[]) => boolean;
  };
  if (typeof nav.vibrate === "function") {
    try { nav.vibrate(map[strength]); } catch { /* noop */ }
  }
}
