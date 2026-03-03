import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_APP_SECRET_KEY;

export const encrypt = (id) => {
  if (!id) return "";

  // 1. Derivasi Key & IV Statis (Harus sama dengan PHP)
  const key = CryptoJS.SHA256(SECRET_KEY);
  // Ambil 16 karakter pertama dari hash secret key sebagai IV
  const iv = CryptoJS.enc.Utf8.parse(
    CryptoJS.SHA256(SECRET_KEY).toString().substring(0, 16),
  );

  // 2. Encrypt
  const encrypted = CryptoJS.AES.encrypt(id.toString(), key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  // 3. Convert ke Base64 URL Safe (Tanpa gabung IV)
  return encrypted.ciphertext
    .toString(CryptoJS.enc.Base64)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

export const decrypt = (cipherText) => {
  if (!cipherText) return "";
  try {
    const key = CryptoJS.SHA256(SECRET_KEY);
    const iv = CryptoJS.enc.Utf8.parse(
      CryptoJS.SHA256(SECRET_KEY).toString().substring(0, 16),
    );

    let base64 = cipherText.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";

    const decrypted = CryptoJS.AES.decrypt(base64, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    console.error("Decryption failed:", e);
    return "";
  }
};
