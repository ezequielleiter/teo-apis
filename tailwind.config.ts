import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0c6cfc",
          hover: "#72a0fd",
          light: "#93b6fd",
        },
        secondary: {
          DEFAULT: "#fc8d32",
          hover: "#fc7100",
        },
        dark: {
          DEFAULT: "#1b202d",
          lighter: "#2a3441",
        },
        light: {
          DEFAULT: "#f6f5f2",
          blue: "#93b6fd",
        },
        "background-light": "#f6f5f2", 
        "background-dark": "#1b202d",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem", 
        xl: "0.75rem",
        full: "9999px",
      },
      container: {
        screens: {
          "640px": "640px",
          "480px": "480px",
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
  ],
};

export default config;