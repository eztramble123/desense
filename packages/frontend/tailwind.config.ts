import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        adi: {
          bg:       "#04091c",
          surface:  "#0a1530",
          surface2: "#0f1e42",
          border:   "#152046",
          blue:     "#2563eb",
          "blue-2": "#1d4ed8",
          muted:    "rgba(255,255,255,0.38)",
        },
      },
      fontFamily: {
        display:  ["'Barlow Condensed'", "sans-serif"],
        sans:     ["'Barlow'", "var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono:     ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
