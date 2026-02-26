// src/utils/storage.js

export const SetWithExpiry = (key, value, ttlInMinutes) => {
  const now = new Date();
  const item = {
    value: value,
    expiry: now.getTime() + ttlInMinutes * 60 * 1000,
  };

  localStorage.setItem(key, JSON.stringify(item));
};

export const GetWithExpiry = (key) => {
  const itemStr = localStorage.getItem(key);

  if (!itemStr) return null;

  const item = JSON.parse(itemStr);
  const now = new Date();

  if (now.getTime() > item.expiry) {
    localStorage.removeItem(key);
    return null;
  }

  return item.value;
};
