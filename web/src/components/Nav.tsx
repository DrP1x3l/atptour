import { TABS, type TabId } from "../constants";
import { haptic } from "../lib/haptic";

interface Props {
  page: TabId;
  onChange: (id: TabId) => void;
}

export function Nav({ page, onChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur border-t border-border safe-bottom"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 6px)" }}
    >
      <ul className="grid grid-cols-6">
        {TABS.map((t) => {
          const active = page === t.id;
          return (
            <li key={t.id}>
              <button
                onClick={() => { if (page !== t.id) { haptic("light"); onChange(t.id); } }}
                className={`w-full flex flex-col items-center gap-0.5 py-2.5 active:scale-95 transition-transform ${
                  active ? "text-gold" : "text-text2"
                }`}
                aria-label={t.l}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={`text-[22px] leading-none transition-transform ${
                    active ? "scale-110" : "scale-100"
                  }`}
                >
                  {t.e}
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase">
                  {t.l}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
