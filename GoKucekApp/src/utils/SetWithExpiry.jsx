// src/utils/storage.js

export const SetWithExpiry = (key, value, ttlInMinutes) => {
  const now = new Date();

  // Buat objek yang menampung data asli dan waktu kadaluarsa
  const item = {
    value: value,
    expiry: now.getTime() + ttlInMinutes * 60 * 1000, // Konversi menit ke milidetik
  };

  localStorage.setItem(key, JSON.stringify(item));
};

export const getWithExpiry = (key) => {
  const itemStr = localStorage.getItem(key);

  // Jika data tidak ada
  if (!itemStr) return null;

  const item = JSON.parse(itemStr);
  const now = new Date();

  // Bandingkan waktu sekarang dengan waktu expired
  if (now.getTime() > item.expiry) {
    // Jika sudah lewat, hapus dari storage dan kembalikan null
    localStorage.removeItem(key);
    return null;
  }

  return item.value;
};
