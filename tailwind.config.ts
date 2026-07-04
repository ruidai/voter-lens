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
        news: {
          bg: "#F9F9F7",
          ink: "#111111",
          divider: "#E5E5E0",
          red: "#CC0000",
          neutral: {
            100: "#F5F5F5",
            200: "#E5E5E5",
            400: "#A3A3A3",
            500: "#737373",
            600: "#525252",
            700: "#404040",
          }
        }
      },
      fontFamily: {
        display: ["'Playfair Display'", "'Times New Roman'", "serif"],
        body: ["'Lora'", "Georgia", "serif"],
        sans: ["'Inter'", "'Helvetica Neue'", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Courier New'", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
