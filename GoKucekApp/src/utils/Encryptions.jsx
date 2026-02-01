import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_APP_SECRET_KEY;

export const encrypt = (id) => {
  if (!id) return "";

  // 1. Derivasi Key yang kuat (SHA256)
  const key = CryptoJS.SHA256(SECRET_KEY);

  // 2. Generate IV Acak (16 bytes) - INI KUNCI KEAMANANNYA
  const iv = CryptoJS.lib.WordArray.random(16);

  // 3. Encrypt
  const encrypted = CryptoJS.AES.encrypt(id.toString(), key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  // 4. Gabungkan IV + Ciphertext (agar backend tahu IV mana yang dipakai)
  const combined = iv.concat(encrypted.ciphertext);

  // 5. Convert ke Base64 URL Safe
  return combined
    .toString(CryptoJS.enc.Base64)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

export const decrypt = (cipherText) => {
  if (!cipherText) return "";
  try {
    const key = CryptoJS.SHA256(SECRET_KEY);

    // Kembalikan ke Base64 standar
    let base64 = cipherText.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";

    const rawData = CryptoJS.enc.Base64.parse(base64);

    // Ambil 16 byte pertama sebagai IV, sisanya adalah ciphertext
    const iv = CryptoJS.lib.WordArray.create(rawData.words.slice(0, 4));
    const ciphertext = CryptoJS.lib.WordArray.create(rawData.words.slice(4));

    const decrypted = CryptoJS.AES.decrypt({ ciphertext: ciphertext }, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    return "";
  }
};
