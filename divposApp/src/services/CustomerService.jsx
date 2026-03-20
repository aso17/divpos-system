import api from "./api";

// ─── CustomerService ──────────────────────────────────────────────────────────
// Konsisten dengan pola RoleService & TransactionService

const CustomerService = {
  // ── List dengan filter & pagination ────────────────────────────────────────
  getCustomers: (params = {}) => {
    return api.get("/customers", { params });
  },

  // ── Detail ─────────────────────────────────────────────────────────────────
  getCustomer: (id) => {
    return api.get(`/customers/${id}`);
  },

  // ── Tambah pelanggan baru ───────────────────────────────────────────────────
  createCustomer: (payload) => {
    return api.post("/customers", payload);
  },

  // ── Edit pelanggan ──────────────────────────────────────────────────────────
  updateCustomer: (id, payload) => {
    console.log(id);
    return api.post(`/customers/${id}`, {
      ...payload,
      _method: "PUT", // Laravel method spoofing — konsisten dengan updateRole
    });
  },

  // ── Hapus pelanggan ─────────────────────────────────────────────────────────
  deleteCustomer: (id) => {
    return api.delete(`/customers/${id}`);
  },
};

export default CustomerService;
