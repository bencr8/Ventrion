import type { Config } from "tailwindcss";
import path from "path";

const config: Config = {
  content: [
    path.join(__dirname, "src/pages/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(__dirname, "src/components/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(__dirname, "src/app/**/*.{js,ts,jsx,tsx,mdx}"),
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        hanken: ["var(--font-hanken)", "sans-serif"],
        jakarta: ["var(--font-jakarta)", "sans-serif"],
        sans: ["var(--font-jakarta)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      colors: {
        porcelain: {
          50: "#FAFAF7",
          100: "#F6F4EE", // Main canvas background
          200: "#EFECE3",
          300: "#E5E1D3",
          400: "#D3CDC0",
        },
        obsidian: "#0F0F11", // Deep crisp black typography
        slateText: "#3A3A3E", // Muted secondary text
        peach: {
          400: "#F8A882",
          500: "#E58B6D", // Accent glow & chart line
          600: "#C96D50",
        },
      },
      boxShadow: {
        porcelain: "0 30px 60px -15px rgba(50, 40, 30, 0.08), 0 10px 25px -10px rgba(0, 0, 0, 0.04)",
        cardFloat: "0 20px 40px -10px rgba(15, 15, 17, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02)",
        coinShadow: "0 35px 50px -15px rgba(180, 110, 80, 0.28), 0 15px 25px -5px rgba(0, 0, 0, 0.12)",
        glowPeach: "0 0 35px 2px rgba(229, 139, 109, 0.35)",
        insetCoin: "inset 0 4px 8px rgba(255, 255, 255, 0.9), inset 0 -4px 8px rgba(0, 0, 0, 0.08)",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.85" },
          "50%": { opacity: "1", filter: "drop-shadow(0 0 12px rgba(229,139,109,0.7))" },
        },
      },
      animation: {
        shimmer: "shimmer 2s infinite ease-in-out",
        float: "floatSlow 6s ease-in-out infinite",
        pulseGlow: "pulseGlow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
