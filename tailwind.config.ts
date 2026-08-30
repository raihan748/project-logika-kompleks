import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981", // Primary Emerald
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        slate: {
          850: "#151e2e",
          950: "#0b0f19",
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.07)",
        "glass-lg": "0 12px 40px 0 rgba(0, 0, 0, 0.12)",
        "glass-sm": "0 4px 16px 0 rgba(0, 0, 0, 0.05)",
        "inner-glow": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.4)",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
