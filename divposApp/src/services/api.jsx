import axios from "axios";
import { apiUrl } from "../utils/Url";
import { showToast } from "../utils/Toast";
import { GetWithExpiry, SetWithExpiry, RemoveStorage } from "../utils/Storage";

/**
 * ===============================
 * AXIOS INSTANCE
 * ===============================
 */
const api = axios.create({
  baseURL: apiUrl(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * ===============================
 * TOKEN SERVICE (Encrypted)
 * ===============================
 */
const tokenService = {
  getAccessToken: () => GetWithExpiry("access_token"),
  setAccessToken: (token) => SetWithExpiry("access_token", token, 60),
  removeAccessToken: () => RemoveStorage("access_token"),
  getRefreshToken: () => GetWithExpiry("refresh_token"),
  setRefreshToken: (token) => SetWithExpiry("refresh_token", token, 1440),
  removeRefreshToken: () => RemoveStorage("refresh_token"),
};

/**
 * ===============================
 * REFRESH CONTROL (ANTI RACE)
 * ===============================
 */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

/**
 * ===============================
 * REQUEST INTERCEPTOR
 * ===============================
 */
api.interceptors.request.use(
  (config) => {
    const token = tokenService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * ===============================
 * RESPONSE INTERCEPTOR
 * ===============================
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 🛡️ 1. STANDAR DUNIA: Cek jika request dibatalkan (AbortController)
    if (axios.isCancel(error)) {
      // Return promise pending agar tidak masuk ke logic error UI
      return new Promise(() => {});
    }

    // 2. HANDLE 401 (TOKEN EXPIRED)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/logout") &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = tokenService.getRefreshToken();
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(`${apiUrl()}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        tokenService.setAccessToken(data.token);
        tokenService.setRefreshToken(data.refresh_token);

        processQueue(null, data.token);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        tokenService.removeAccessToken();
        tokenService.removeRefreshToken();
        if (window.location.pathname !== "/login") {
          showToast("Sesi habis, silakan login kembali.", "error");
          window.location.replace("/login");
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 3. CENTRALIZED ERROR HANDLING
    handleApiError(error);

    return Promise.reject(error);
  },
);

/**
 * ===============================
 * CENTRALIZED ERROR HANDLER
 * ===============================
 */
function handleApiError(error) {
  const response = error.response;

  // Jika tidak ada response, berarti masalah koneksi atau timeout
  if (!response) {
    if (error.code === "ECONNABORTED") {
      showToast("Koneksi lambat (Timeout). Coba lagi.", "error");
    } else {
      showToast("Koneksi terputus. Cek internet Mas A_so.", "error");
    }
    return;
  }

  const message = response.data?.message || "Terjadi kesalahan sistem.";

  switch (response.status) {
    case 403:
      showToast("Akses ditolak!", "error");
      break;
    case 422:
      const validationErrors = response.data?.errors;
      const firstError = validationErrors
        ? Object.values(validationErrors)[0][0]
        : message;
      showToast(firstError, "error");
      break;
    case 500:
      showToast("Server sedang bermasalah (500).", "error");
      break;
    default:
      // Abaikan 401 karena sudah ditangani di interceptor
      if (response.status !== 401) {
        showToast(message, "error");
      }
  }
}

export default api;
