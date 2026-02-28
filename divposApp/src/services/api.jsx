import axios from "axios";
import { apiUrl } from "../utils/Url";
import { showToast } from "../utils/Toast";
import { GetWithExpiry, SetWithExpiry } from "../utils/Storage";

/**
 * ===============================
 * AXIOS INSTANCE
 * ===============================
 */
const api = axios.create({
  baseURL: apiUrl(),
  timeout: 10000,
  withCredentials: false, // Bearer token (NOT cookie based)
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * ===============================
 * TOKEN SERVICE
 * ===============================
 */
const tokenService = {
  getAccessToken: () => GetWithExpiry("access_token"),
  setAccessToken: (token) => SetWithExpiry("access_token", token, 60),
  removeAccessToken: () => localStorage.removeItem("access_token"),

  getRefreshToken: () => localStorage.getItem("refresh_token"),
  setRefreshToken: (token) => localStorage.setItem("refresh_token", token),
  removeRefreshToken: () => localStorage.removeItem("refresh_token"),

  getTenant: () => GetWithExpiry("tenant_name"),
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
    const tenant = tokenService.getTenant();

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
    const response = error.response;

    // ===============================
    // HANDLE 401 (TOKEN EXPIRED)
    // ===============================
    if (
      response?.status === 401 &&
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

        if (!refreshToken) {
          throw new Error("No refresh token found");
        }

        const { data } = await axios.post(`${apiUrl()}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const newAccessToken = data.token;
        const newRefreshToken = data.refresh_token;

        tokenService.setAccessToken(newAccessToken);
        tokenService.setRefreshToken(newRefreshToken);

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        tokenService.removeAccessToken();
        tokenService.removeRefreshToken();
        localStorage.removeItem("tenant_name");

        if (window.location.pathname !== "/login") {
          showToast("Session expired. Please login again.", "error");
          window.location.replace("/login");
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ===============================
    // OTHER ERRORS
    // ===============================
    handleApiError(response);

    return Promise.reject(error);
  },
);

/**
 * ===============================
 * CENTRALIZED ERROR HANDLER
 * ===============================
 */
function handleApiError(response) {
  if (!response) {
    showToast("Network error. Please check your connection.", "error");
    return;
  }

  const message = response.data?.message || "Unexpected system error occurred.";

  switch (response.status) {
    case 403:
      showToast("Access denied.", "error");
      break;

    case 422:
      const validationErrors = response.data?.errors;
      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0][0];
        showToast(firstError, "error");
      } else {
        showToast(message, "error");
      }
      break;

    case 500:
      showToast("Server error. Please try again later.", "error");
      break;

    default:
      if (response.status !== 401) {
        showToast(message, "error");
      }
  }
}

export default api;
