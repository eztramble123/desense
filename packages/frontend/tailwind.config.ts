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
        background: "var(--background)",
        foreground: "var(--foreground)",
        zeus: {
          gold: "#B8860B",
          "gold-light": "#D4A843",
          "gold-dark": "#8B6508",
          stone: {
            50: "#FAFAF8",
            100: "#F5F5F0",
            200: "#E8E6DF",
            300: "#D4D0C8",
            400: "#A8A295",
            500: "#7C7568",
            600: "#5C554A",
            700: "#3D3832",
            800: "#2A2520",
            900: "#1A1714",
          },
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ['"GeistMono"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
