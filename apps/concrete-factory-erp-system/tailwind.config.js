/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#21313c",
        factory: {
          navy: "#17324d",
          green: "#2f7d5b",
          amber: "#b7842f",
          clay: "#a44a3f",
          steel: "#5d7182",
          mist: "#f3f6f8",
          blue: "#3b6ea8",
        },
      },
      boxShadow: {
        soft: "0 16px 44px rgba(23, 50, 77, 0.10)",
      },
    },
  },
  plugins: [],
};
