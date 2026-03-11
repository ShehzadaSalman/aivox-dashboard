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
          100: "#d6e0ef",
          50: "#eff4fb",
        },
        accent: {
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
          600: "#64748b",
          500: "#7b8796",
        },
      },
      fontFamily: {
        display: ['"Oswald"', '"Arial Narrow"', "sans-serif"],
        sans: ['"Source Sans 3"', '"Helvetica Neue"', "Arial", "sans-serif"],
      },
      boxShadow: {
        soft: "0 20px 60px -40px rgba(13, 31, 53, 0.7)",
        lift: "0 18px 45px -30px rgba(13, 31, 53, 0.65)",
      },
      borderRadius: {
        DEFAULT: "6px",
        md: "10px",
        lg: "14px",
        xl: "18px",
      },
      letterSpacing: {
        "tightest": "-0.04em",
        "wider-plus": "0.18em",
      },
    },
  },
  plugins: [],
};
