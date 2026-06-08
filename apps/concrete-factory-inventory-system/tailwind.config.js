/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#21313c",
        factory: {
          navy: "#183247",
          green: "#2f7d5b",
          amber: "#b7842f",
          clay: "#a44a3f",
          steel: "#5e7380",
          mist: "#f2f6f7",
          blue: "#3b6ea8",
        },
      },
      boxShadow: {
        soft: "0 16px 44px rgba(24, 50, 71, 0.10)",
      },
    },
  },
  plugins: [],
};
