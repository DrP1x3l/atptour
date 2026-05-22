import { useEffect, useState } from "react";
import { SPONSORS } from "../constants";

export function SponsorBar() {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const iv = setInterval(() => {
      setFade(false);
      const t = setTimeout(() => {
        setIdx((p) => (p + 1) % SPONSORS.length);
        setFade(true);
      }, 400);
      return () => clearTimeout(t);
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  const s = SPONSORS[idx]!;
  return (
    <div
      className="mx-4 my-2 h-[60px] rounded-2xl overflow-hidden flex items-center justify-center transition-colors duration-500"
      style={{ background: s.bg }}
    >
      <span
        className="font-black text-white tracking-wider transition-opacity duration-400"
        style={{
          opacity: fade ? 1 : 0,
          fontSize: 22,
          letterSpacing: "0.1em",
          fontFamily: "Nunito, sans-serif",
        }}
      >
        {s.name.toUpperCase()}
      </span>
    </div>
  );
}
