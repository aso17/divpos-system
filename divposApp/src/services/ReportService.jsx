import api from "./api";

const ReportService = {
  /**
   * Rekap Pembayaran — list + summary dengan pagination & filter
   *
   * @param {Object} params
   * @param {number}  params.page
   * @param {number}  params.per_page
   * @param {string}  params.keyword
   * @param {string}  params.outlet_id
   * @param {string}  params.payment_method_id
   * @param {string}  params.payment_status   - PAID | PARTIAL | UNPAID
   * @param {string}  params.date_from        - YYYY-MM-DD
   * @param {string}  params.date_to          - YYYY-MM-DD
   */
  getPaymentRecap: (params = {}) => api.get("/reports/payments", { params }),

  /**
   * Export Rekap Pembayaran ke Excel (blob response)
   *
   * @param {Object} params - Filter yang sama seperti getPaymentRecap (tanpa page/per_page)
   */
  exportPaymentRecap: (params = {}) =>
    api.get("/reports/payments/export", {
      params,
      responseType: "blob",
    }),

  /**
   * Analisa Pendapatan — list + summary
   *
   * @param {Object} params
   * @param {string}  params.date_from
   * @param {string}  params.date_to
   * @param {string}  params.outlet_id
   * @param {string}  params.group_by  - day | week | month
   */
  getRevenueAnalysis: (params = {}) => api.get("/reports/revenue", { params }),

  /**
   * Export Analisa Pendapatan ke Excel
   */
  exportRevenueAnalysis: (params = {}) =>
    api.get("/reports/revenue/export", {
      params,
      responseType: "blob",
    }),
};

export default ReportService;
