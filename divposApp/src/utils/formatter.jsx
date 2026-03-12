// 1. UNTUK TAMPILAN (UI) - Tetap sama, sudah bagus
export const formatRupiah = (value) => {
  if (value === null || value === undefined || value === "") return "0";
  return new Intl.NumberFormat("id-ID").format(Number(value));
};

// 2. UNTUK PERHITUNGAN - Tetap sama
export const toNum = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

// 3. UNTUK MEMBERSIHKAN INPUT (REVISI TOTAL)
export const parseNumber = (value) => {
  if (typeof value !== "string") return value;

  // 🛡️ LANGKAH KRUSIAL:
  // 1. Hapus SEMUA titik (karena di Indo itu pemisah ribuan, bukan desimal)
  // 2. Ubah koma jadi titik (karena JS hanya kenal titik untuk desimal)
  // 3. Buang semua karakter selain angka dan titik desimal
  const clean = value
    .replace(/\./g, "") // Hapus titik ribuan (Contoh: 3.000 -> 3000)
    .replace(",", ".") // Ubah koma desimal jadi titik
    .replace(/[^0-9.]/g, ""); // Buang Rp, spasi, dsb.

  return clean; // Kembalikan STRING agar user bisa ngetik "0.5"
};
