import type { AppState, Match } from "../types";

const BASE = import.meta.env.VITE_API_BASE || "/api";
const SECRET = import.meta.env.VITE_APP_SECRET || "";

async function http<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": SECRET,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "omit",
  });
  if (!res.ok) {
    let detail: unknown;
    try { detail = await res.json(); } catch { /* noop */ }
    const err = new Error(`HTTP ${res.status} ${path}`) as Error & { status?: number; detail?: unknown };
    err.status = res.status;
    err.detail = detail;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  state: () => http<AppState>("GET", "/state"),
  createMatch: (m: Omit<Match, "id"> & { id?: string }) =>
    http<{ id: string }>("POST", "/matches", m),
  deleteMatch: (id: string) => http<void>("DELETE", `/matches/${id}`),
  updatePlayer: (id: string, body: { name?: string; avatar?: string | null }) =>
    http<{ id: string; name: string; avatar: string | null }>(
      "PATCH",
      `/players/${id}`,
      body
    ),
  setSeason: (season: number) =>
    http<{ season: number }>("PATCH", "/season", { season }),
  reset: () => http<{ ok: true }>("POST", "/reset"),
};
