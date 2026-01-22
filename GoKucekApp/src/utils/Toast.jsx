// src/utils/toast.js
export const showToast = (message, type = "success") => {
  const event = new CustomEvent("global-toast", {
    detail: { message, type },
  });
  window.dispatchEvent(event);
};
