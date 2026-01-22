import axios from "axios";
import { showToast } from "../utils/Toast";
import { getWithExpiry } from "../utils/SetWithExpiry";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// --- Request Interceptor ---
api.interceptors.request.use(
  (config) => {
    const token = getWithExpiry("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// --- Response Interceptor ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    const message = response?.data?.message || "A system error has occurred.";

    if (response) {
      switch (response.status) {
        case 401:
          // Unauthorized: token invalid / expired
          showToast("Session expired. Please log in again.", "error");

          // Clear all stored data
          localStorage.clear();

          // Redirect to login page
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
          break;

        case 403:
          showToast(
            "You do not have permission to access this resource.",
            "error",
          );
          break;

        case 422:
          // Laravel validation error
          showToast(message, "error");
          break;

        case 500:
          showToast(
            "The server is experiencing problems (Internal Server Error).",
            "error",
          );
          break;

        default:
          showToast(message, "error");
          break;
      }
    } else if (error.request) {
      // Network / connection error
      showToast(
        "Connection failed. Please check your internet connection.",
        "error",
      );
    } else {
      showToast("An unexpected error has occurred.", "error");
    }

    return Promise.reject(error);
  },
);

export default api;
