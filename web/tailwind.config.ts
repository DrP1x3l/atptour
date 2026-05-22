import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0A0908",
        card: "#141210",
        card2: "#1A1714",
        border: "#2A2520",
        border2: "#342E28",
        text: "#F0EBE3",
        text2: "#A89E94",
        text3: "#6B6058",
        gold: "#D4A843",
        gold2: "#C49632",
        gold3: "#B08428",
        goldsoft: "rgba(212,168,67,0.08)",
        green: "#22C55E",
        red: "#EF4444",
        hard: "#3B9FE7",
        clay: "#D4612B",
      },
      fontFamily: {
        sans: ["Nunito", "-apple-system", "system-ui", "sans-serif"],
        mono: ["Space Mono", "ui-monospace", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "score-pop": "scorePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "sponsor-scroll": "sponsorScroll 25s linear infinite",
        float: "float 3s ease-in-out infinite",
        "badge-pop": "badgePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        scorePop: { "0%": { transform: "scale(1)" }, "50%": { transform: "scale(1.15)" }, "100%": { transform: "scale(1)" } },
        sponsorScroll: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-4px)" } },
        badgePop: { "0%": { transform: "scale(0)", opacity: "0" }, "60%": { transform: "scale(1.2)", opacity: "1" }, "100%": { transform: "scale(1)", opacity: "1" } },
      },
    },
  },
  plugins: [],
} satisfies Config;
