import api from "./api";

// ─── DashboardService ─────────────────────────────────────────────────────────
// Konsisten dengan pola RoleService — satu object dengan method-method.
// Endpoint: GET /dashboard?period=Minggu+Ini

const DashboardService = {
  /**
   * Ambil semua data dashboard untuk period tertentu.
   *
   * @param {'Hari Ini'|'Minggu Ini'|'Bulan Ini'} period
   * @returns {Promise<AxiosResponse>}
   *
   * @example
   * const res = await DashboardService.getDashboard("Minggu Ini");
   * const stats = res.data.data.stats;
   */
  getDashboard: (period = "Minggu Ini") => {
    return api.get("/dashboard", {
      params: { period },
    });
  },
};

export default DashboardService;
