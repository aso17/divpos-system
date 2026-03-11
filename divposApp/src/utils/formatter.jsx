// 1. UNTUK TAMPILAN (UI)
export const formatRupiah = (value) => {
  if (value === null || value === undefined || value === "") return "0";
  return new Intl.NumberFormat("id-ID").format(Number(value));
};

// 2. UNTUK PERHITUNGAN (LOGIKA / REDUCE)
// Ini pengganti safeNumber yang lebih tangguh untuk desimal
export const toNum = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

// 3. UNTUK MEMBERSIHKAN INPUT (Hanya jika inputnya ada karakter non-angka)
export const parseNumber = (value) => {
  if (typeof value !== "string") return value;
  // Menghapus Rp, spasi, tapi menyisakan angka dan TITIK/KOMA desimal
  const clean = value.replace(/[^0-9.,]/g, "").replace(",", ".");
  return parseFloat(clean) || 0;
};
