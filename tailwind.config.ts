import type { Config } from "tailwindcss";

// Tokens de design da MedLink — ver app/globals.css para os valores.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#16324F", 900: "#0E2238", 700: "#244A70", 100: "#E6ECF3" },
        teal: { DEFAULT: "#0F766E", 700: "#0B5D57", 50: "#ECF8F6" },
        mint: "#D1FAE5",
        sky: "#E0F2FE",
        canvas: "#F5F7FA",
        line: "#E2E7EE",
        ink: { DEFAULT: "#132233", soft: "#4A5A6C", faint: "#7B8898" },
        amber: { DEFAULT: "#B45309", bg: "#FEF3C7", line: "#F5D58A" },
        danger: { DEFAULT: "#B42318", bg: "#FEE4E2", line: "#F9B4AE" },
      },
      fontFamily: {
        sans: ["'Hanken Grotesk Variable'", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.1rem" }],
        sm: ["0.8125rem", { lineHeight: "1.25rem" }],
        base: ["0.9375rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.6rem" }],
        xl: ["1.375rem", { lineHeight: "1.8rem" }],
        "2xl": ["1.75rem", { lineHeight: "2.1rem" }],
      },
      borderRadius: { sm: "4px", DEFAULT: "6px", md: "8px", lg: "12px" },
      boxShadow: {
        pop: "0 12px 32px -8px rgba(22, 50, 79, 0.28), 0 2px 6px rgba(22, 50, 79, 0.08)",
        line: "0 0 0 1px #E2E7EE",
      },
      keyframes: {
        "slide-in": { from: { transform: "translateY(8px)", opacity: "0" }, to: { transform: "none", opacity: "1" } },
      },
      animation: { "slide-in": "slide-in 160ms ease-out" },
    },
  },
  plugins: [],
};
export default config;
