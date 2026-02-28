// src/utils/storage.js

const PREFIX = "DivPOS"; // Identitas unik aplikasi Mas A_so

export const SetWithExpiry = (key, value, ttlInMinutes) => {
  try {
    const now = new Date();
    const item = {
      value: value,
      expiry: now.getTime() + ttlInMinutes * 60 * 1000,
    };
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(item));
  } catch (error) {
    console.error("Storage Error:", error);
    // Fallback: Jika localStorage penuh (QuotaExceededError)
  }
};

export const GetWithExpiry = (key) => {
  try {
    const itemStr = localStorage.getItem(`${PREFIX}${key}`);

    if (!itemStr) return null;

    const item = JSON.parse(itemStr);
    const now = new Date();

    // Cek apakah item memiliki struktur yang benar
    if (!item || typeof item.expiry === "undefined") {
      return null;
    }

    if (now.getTime() > item.expiry) {
      localStorage.removeItem(`${PREFIX}${key}`);
      return null;
    }

    return item.value;
  } catch (error) {
    localStorage.removeItem(`${PREFIX}${key}`);
    return null;
  }
};

export const RemoveStorage = (key) => {
  localStorage.removeItem(`${PREFIX}${key}`);
};
