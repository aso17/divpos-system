export const formatRupiah = (value) => {
  if (value === null || value === undefined || value === "") return "";
  // Pastikan value adalah angka sebelum diformat
  return new Intl.NumberFormat("id-ID").format(Number(value));
};

export const parseNumber = (value) => {
  if (!value) return 0;
  // 1. Ubah ke string
  // 2. Hapus semua karakter selain angka (biar aman dari titik, Rp, atau spasi)
  // 3. Ubah ke Integer (Angka)
  const clean = value.toString().replace(/[^0-9]/g, "");
  return clean ? parseInt(clean, 10) : 0;
};
