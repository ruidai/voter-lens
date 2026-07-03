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
        voter: {
          blue: {
            50: "#f0f7ff",
            100: "#e0efff",
            500: "#2563eb",
            600: "#1d4ed8",
            700: "#1e40af",
          },
          green: {
            50: "#f0fdf4",
            100: "#dcfce7",
            500: "#22c55e",
            600: "#16a34a",
          }
        }
      },
    },
  },
  plugins: [],
};
export default config;
