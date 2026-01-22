export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        hover: "#F1F5F9",
        text: "#0F172A",
        border: "#E2E8F0",
        app: "#F8FAFC",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      fontSize: {
        xxs: "0.625rem", // 10px
        tiny: "0.5rem", // 8px
      },
    },
  },
  plugins: [],
};
