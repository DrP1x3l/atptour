import { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "./store/useStore";
import { Nav } from "./components/Nav";
import { Hdr } from "./components/Hdr";
import { SponsorBar } from "./components/SponsorBar";
import { Toast } from "./components/Toast";
import { LoadingScreen } from "./components/Skeleton";
import { Dash } from "./pages/Dash";
import { NewMatch } from "./pages/NewMatch";
import { Hist } from "./pages/Hist";
import { Albo } from "./pages/Albo";
import { Prof } from "./pages/Prof";
import { Cfg } from "./pages/Cfg";
import { calcStats, getRanking } from "./lib/stats";
import type { TabId } from "./constants";

export default function App() {
  const loading = useStore((s) => s.loading);
  const state = useStore((s) => s.state);
  const page = useStore((s) => s.page);
  const setPage = useStore((s) => s.setPage);
  const load = useStore((s) => s.load);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    if (!state) return {};
    return calcStats(state.matches, state.players, state.tournaments);
  }, [state]);

  const leader = useMemo(() => {
    if (!state) return null;
    const rk = getRanking(stats, state.players);
    return state.players.find((p) => p.id === rk[0]?.id) ?? state.players[0] ?? null;
  }, [state, stats]);

  if (loading || !state) return <LoadingScreen />;

  const pages: Record<TabId, JSX.Element> = {
    dash: <Dash state={state} stats={stats} />,
    new: <NewMatch state={state} />,
    hist: <Hist state={state} />,
    albo: <Albo state={state} />,
    prof: <Prof state={state} stats={stats} />,
    cfg: <Cfg state={state} />,
  };

  return (
    <div className="min-h-screen bg-bg text-text pb-20">
      <Hdr leader={leader} stats={stats} season={state.season} />
      <SponsorBar />
      <main className="px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
          >
            {pages[page]}
          </motion.div>
        </AnimatePresence>
      </main>
      <Nav page={page} onChange={setPage} />
      <Toast />
    </div>
  );
}
