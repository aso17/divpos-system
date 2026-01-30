import CryptoJS from "crypto-js";

// Pastikan variabel ini ada di file .env kamu
const SECRET_KEY = import.meta.env.VITE_APP_SECRET_KEY || "fallback-secret-key";

/**
 * Enkripsi ID menjadi string aman URL
 */
export const encrypt = (id) => {
  if (!id) return "";

  const cipherText = CryptoJS.AES.encrypt(id.toString(), SECRET_KEY).toString();

  return cipherText.replace(/\//g, "_").replace(/\+/g, "-").replace(/=/g, "");
};

/**
 * Dekripsi string kembali ke ID asli
 */
export const decrypt = (cipherText) => {
  if (!cipherText) return "";

  const base64 = cipherText.replace(/_/g, "/").replace(/-/g, "+");

  const bytes = CryptoJS.AES.decrypt(base64, SECRET_KEY);
  const originalText = bytes.toString(CryptoJS.enc.Utf8);

  return originalText;
};
