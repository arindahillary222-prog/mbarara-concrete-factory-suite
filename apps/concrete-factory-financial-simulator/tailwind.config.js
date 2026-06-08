/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 16px 45px rgba(23, 50, 77, 0.10)",
      },
      colors: {
        ink: "#1f2d3a",
        factory: {
          navy: "#17324d",
          green: "#2f7d5b",
          amber: "#bd8b32",
          steel: "#5d7182",
          clay: "#a24b3d",
          mist: "#f3f6f8",
        },
      },
    },
  },
  plugins: [],
};
