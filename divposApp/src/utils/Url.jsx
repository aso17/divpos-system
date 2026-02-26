const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_URL = import.meta.env.VITE_API_URL;

export const apiUrl = (path = "") => {
  return `${API_URL}${path}`;
};

export const assetUrl = (path = "") => {
  return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};
