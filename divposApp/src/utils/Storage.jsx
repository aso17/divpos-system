// 🔐 Impor fungsi enkripsi-dekripsi dari file Enkryption.js
import { encrypt, decrypt } from "../utils/Encryptions";

const PREFIX = "Div"; // Identitas unik aplikasi Mas A_so

/**
 * 🔒 Menyimpan data ke localStorage dengan Enkripsi dan Expiry
 */
export const SetWithExpiry = (key, value, ttlInMinutes) => {
  try {
    const now = new Date();
    const item = {
      value: value,
      expiry: now.getTime() + ttlInMinutes * 60 * 1000,
    };

    // 1. Ubah object jadi JSON String
    const rawData = JSON.stringify(item);

    // 2. 🔐 ENKRIPSI DATA SEBELUM DISIMPAN
    const encryptedData = encrypt(rawData);

    localStorage.setItem(`${PREFIX}${key}`, encryptedData);
  } catch (error) {
    console.error("Storage Encryption Error:", error);
  }
};

/**
 * 🔓 Mengambil, mendekripsi, dan mengecek kadaluwarsa data
 */
export const GetWithExpiry = (key) => {
  try {
    const encryptedStr = localStorage.getItem(`${PREFIX}${key}`);

    if (!encryptedStr) return null;

    // 1. 🔓 DEKRIPSI DATA SEBELUM DIPARSE
    const decryptedData = decrypt(encryptedStr);

    if (!decryptedData) return null; // Jika dekripsi gagal (corrupt/key salah)

    const item = JSON.parse(decryptedData);
    const now = new Date();

    // 2. Cek apakah item memiliki struktur yang benar
    if (!item || typeof item.expiry === "undefined") {
      return null;
    }

    // 3. Cek Expiry
    if (now.getTime() > item.expiry) {
      localStorage.removeItem(`${PREFIX}${key}`);
      return null;
    }

    return item.value;
  } catch (error) {
    console.error("Storage Decryption Error:", error);
    localStorage.removeItem(`${PREFIX}${key}`);
    return null;
  }
};

export const RemoveStorage = (key) => {
  localStorage.removeItem(`${PREFIX}${key}`);
};
