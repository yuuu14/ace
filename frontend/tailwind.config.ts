import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ace: {
          bg: "var(--ace-bg)",
          panel: "var(--ace-panel)",
          border: "var(--ace-border)",
          rose: "var(--ace-rose)",
          mint: "var(--ace-mint)",
          cyan: "var(--ace-cyan)",
          muted: "var(--ace-muted)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
