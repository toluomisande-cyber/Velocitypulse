import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#faf9f5",
        "surface-soft": "#f5f0e8",
        "surface-card": "#efe9de",
        "surface-cream-strong": "#e8e0d2",
        "surface-dark": "#181715",
        "surface-dark-elevated": "#252320",
        "surface-dark-soft": "#1f1e1b",

        primary: {
          DEFAULT: "#cc785c", // Claude Coral
          active: "#a9583e",
          disabled: "#e6dfd8",
        },

        ink: "#141413",
        body: "#3d3d3a",
        "body-strong": "#252523",
        muted: {
          DEFAULT: "#6c6a64",
          soft: "#8e8b82",
        },
        hairline: {
          DEFAULT: "#e6dfd8",
          soft: "#ebe6df",
        },

        accent: {
          teal: "#5db8a6",
          amber: "#e8a55a",
        },
        success: "#5db872",
        warning: "#d4a017",
        error: "#c64545",

        "on-primary": "#ffffff",
        "on-dark": "#faf9f5",
        "on-dark-soft": "#a09d96",
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Tiempos Headline", "Copernicus", "Georgia", "serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        pill: "9999px",
      },
      boxShadow: {
        subtle: "0 1px 3px rgba(20, 20, 19, 0.06)",
        card: "0 2px 8px -2px rgba(20, 20, 19, 0.05)",
        dark: "0 4px 20px -2px rgba(0, 0, 0, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
