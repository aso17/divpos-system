// src/utils/confirm.js
export const showConfirm = (
  message,
  title = "",
  type = "warning",
  options = {},
) => {
  return new Promise((resolve) => {
    const event = new CustomEvent("global-confirm", {
      detail: {
        message,
        title,
        type,
        resolve,
        // Gunakan Optional Chaining (?.) agar lebih aman
        confirmText: options?.confirmText,
        cancelText: options?.cancelText,
      },
    });
    window.dispatchEvent(event);
  });
};

// Daftarkan ke global window
window.showConfirm = showConfirm;

export default showConfirm;
