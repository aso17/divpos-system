/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Warna Brand Utama (Emerald Green)
        primary: {
          50: "#ecfdf5",
          100: "#d1fae5",
          500: "#10b981", // Warna utama GoKucek Green
          600: "#059669", // Hover state
          700: "#047857",
          900: "#064e3b", // Deep green untuk footer/card
        },
        // Warna Pendukung (Slate/Neutral)
        slate: {
          50: "#f8fafc", // Background App
          100: "#f1f5f9", // Border halus / Background Hover menu
          500: "#64748b", // Teks keterangan / secondary
          800: "#1e293b", // Teks Utama
          900: "#0f172a", // Teks Judul/Heading
        },
        // Alias untuk memudahkan pemanggilan di class
        app: "#f8fafc", // bg-app
        border: "#e2e8f0", // border-border
      },
      fontFamily: {
        // Menggunakan Inter sebagai utama, sangat modern untuk SaaS
        sans: ["Inter", "Plus Jakarta Sans", "ui-sans-serif", "system-ui"],
      },
      fontSize: {
        xxs: "0.625rem", // 10px
        tiny: "0.5rem", // 8px
      },
      boxShadow: {
        // Shadow halus untuk card agar terlihat modern
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        brand:
          "0 10px 15px -3px rgba(16, 185, 129, 0.1), 0 4px 6px -2px rgba(16, 185, 129, 0.05)",
      },
    },
  },
  plugins: [],
};
