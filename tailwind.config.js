/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0b1829",
          900: "#0d1f35",
          800: "#162d4a",
          700: "#1f3a5f",
          500: "#33527a",
          200: "#b9c9e0",
          100: "#d6e0ef",
          50: "#eff4fb",
        },
        accent: {
          800: "#8f1a12",
          700: "#b52318",
          600: "#d62d20",
          500: "#e14a3f",
        },
        gold: {
          600: "#d69400",
          500: "#f0a500",
          400: "#f6b938",
        },
        surface: {
          50: "#f5f7fa",
          0: "#ffffff",
        },
        ink: {
          900: "#2d3748",
          700: "#475569",
          600: "#64748b",
          500: "#7b8796",
          400: "#9aa7b8",
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', "system-ui", "-apple-system", "sans-serif"],
        sans: ['"Plus Jakarta Sans"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(13, 31, 53, 0.04), 0 12px 32px -16px rgba(13, 31, 53, 0.16)",
        lift: "0 2px 4px rgba(13, 31, 53, 0.05), 0 22px 44px -24px rgba(13, 31, 53, 0.24)",
        ring: "0 0 0 1px rgba(13, 31, 53, 0.06)",
      },
      borderRadius: {
        DEFAULT: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.02em",
        "wider-plus": "0.14em",
      },
    },
  },
  plugins: [],
};
