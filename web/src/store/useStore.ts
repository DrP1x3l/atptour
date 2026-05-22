// Store globale Zustand. Carica lo state dal server al boot, espone azioni
// che fanno mutazioni ottimistiche + chiamata API, con rollback su errore.
//
// Cache localStorage come fallback offline (solo lettura iniziale).

import { create } from "zustand";
import type { AppState, Match, Player } from "../types";
import { api } from "../lib/api";
import { STORAGE_KEY } from "../constants";
import type { TabId } from "../constants";

interface UiState {
  page: TabId;
  setPage: (p: TabId) => void;
  toast: { msg: string; kind: "ok" | "err" } | null;
  pushToast: (msg: string, kind?: "ok" | "err") => void;
  clearToast: () => void;
}

interface DataState {
  loading: boolean;
  error: string | null;
  state: AppState | null;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
  addMatch: (m: Omit<Match, "id"> & { id?: string }) => Promise<Match | null>;
  removeMatch: (id: string) => Promise<void>;
  updatePlayer: (id: string, body: Partial<Pick<Player, "name" | "avatar">>) => Promise<void>;
  setSeason: (s: number) => Promise<void>;
  resetAll: () => Promise<void>;
}

export type StoreState = UiState & DataState;

const cache = {
  read(): AppState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AppState) : null;
    } catch { return null; }
  },
  write(s: AppState) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* noop */ }
  },
};

export const useStore = create<StoreState>((set, get) => ({
  page: "dash",
  setPage: (p) => set({ page: p }),
  toast: null,
  pushToast: (msg, kind = "ok") => {
    set({ toast: { msg, kind } });
    setTimeout(() => {
      if (get().toast?.msg === msg) set({ toast: null });
    }, 2500);
  },
  clearToast: () => set({ toast: null }),

  loading: true,
  error: null,
  state: cache.read(),

  load: async () => {
    set({ loading: true, error: null });
    try {
      const s = await api.state();
      set({ state: s, loading: false });
      cache.write(s);
    } catch (e) {
      const msg = (e as Error).message || "load_failed";
      const cached = cache.read();
      if (cached) set({ state: cached, loading: false, error: msg });
      else set({ loading: false, error: msg });
    }
  },

  refresh: async () => {
    try {
      const s = await api.state();
      set({ state: s });
      cache.write(s);
    } catch { /* ignore: rimaniamo su quel che abbiamo */ }
  },

  addMatch: async (m) => {
    const cur = get().state;
    if (!cur) return null;
    // ottimistica: id provvisorio
    const tempId = m.id ?? `tmp_${Date.now()}`;
    const optimistic: Match = { ...m, id: tempId };
    set({ state: { ...cur, matches: [...cur.matches, optimistic] } });
    try {
      const { id } = await api.createMatch({ ...m, id: m.id ?? tempId });
      const next = get().state;
      if (!next) return null;
      const finalMatch: Match = { ...optimistic, id };
      const matches = next.matches.map((x) => (x.id === tempId ? finalMatch : x));
      const newState = { ...next, matches };
      set({ state: newState });
      cache.write(newState);
      get().pushToast("Match salvato ✓", "ok");
      return finalMatch;
    } catch (e) {
      // rollback
      const next = get().state;
      if (next) set({ state: { ...next, matches: next.matches.filter((x) => x.id !== tempId) } });
      get().pushToast("Errore salvataggio", "err");
      console.error(e);
      return null;
    }
  },

  removeMatch: async (id) => {
    const cur = get().state;
    if (!cur) return;
    const removed = cur.matches.find((m) => m.id === id);
    set({ state: { ...cur, matches: cur.matches.filter((m) => m.id !== id) } });
    try {
      await api.deleteMatch(id);
      cache.write(get().state!);
      get().pushToast("Match eliminato", "ok");
    } catch (e) {
      if (removed) {
        const next = get().state;
        if (next) set({ state: { ...next, matches: [...next.matches, removed] } });
      }
      get().pushToast("Errore eliminazione", "err");
      console.error(e);
    }
  },

  updatePlayer: async (id, body) => {
    const cur = get().state;
    if (!cur) return;
    const prev = cur.players.find((p) => p.id === id);
    if (!prev) return;
    const next: Player = {
      ...prev,
      name: body.name ?? prev.name,
      avatar: body.avatar !== undefined ? body.avatar : prev.avatar,
    };
    set({
      state: { ...cur, players: cur.players.map((p) => (p.id === id ? next : p)) },
    });
    try {
      await api.updatePlayer(id, body);
      cache.write(get().state!);
    } catch (e) {
      set({ state: cur });
      get().pushToast("Errore aggiornamento", "err");
      console.error(e);
    }
  },

  setSeason: async (s) => {
    const cur = get().state;
    if (!cur) return;
    set({ state: { ...cur, season: s } });
    try {
      await api.setSeason(s);
      cache.write(get().state!);
    } catch (e) {
      set({ state: cur });
      get().pushToast("Errore stagione", "err");
      console.error(e);
    }
  },

  resetAll: async () => {
    const cur = get().state;
    if (!cur) return;
    try {
      await api.reset();
      await get().refresh();
      get().pushToast("Reset eseguito", "ok");
    } catch (e) {
      get().pushToast("Errore reset", "err");
      console.error(e);
    }
  },
}));
