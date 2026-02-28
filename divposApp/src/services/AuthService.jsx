import api from "./api";
import { GetWithExpiry } from "../utils/Storage";

/**
 * ===============================
 * AUTH ENDPOINTS
 * ===============================
 */
const ENDPOINTS = {
  LOGIN: "/auth/login",
  LOGOUT: "/auth/logout",
  ME: "/auth/me",
  MENUS: "/auth/menus",
};

/**
 * ===============================
 * AUTH SERVICE
 * ===============================
 */
const AuthService = {
  /**
   * Login User
   * @param {Object} credentials
   * @returns {Promise}
   */
  async login(credentials) {
    // Tenant sebaiknya diambil dari subdomain atau server-side
    return api.post(ENDPOINTS.LOGIN, credentials);
  },

  /**
   * Logout User
   */
  async logout() {
    const refreshToken = GetWithExpiry("refresh_token");
    // console.log("Logging out with refresh token:", refreshToken);

    return api.post(ENDPOINTS.LOGOUT, {
      refresh_token: refreshToken,
    });
  },

  /**
   * Get Current User
   */
  async getMe() {
    return api.get(ENDPOINTS.ME);
  },

  /**
   * Get Role Based Menu
   */
  async getMenus() {
    return api.get(ENDPOINTS.MENUS);
  },
};

export default AuthService;
