/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        factory: {
          navy: "#17324d",
          green: "#2f7d5b",
          amber: "#b7842f",
          clay: "#a44a3f",
          blue: "#3b6ea8",
          paper: "#f6f8f5",
          ink: "#1f2933"
        }
      },
      boxShadow: {
        soft: "0 10px 26px rgba(23, 50, 77, 0.08)"
      }
    },
  },
  plugins: [],
};
