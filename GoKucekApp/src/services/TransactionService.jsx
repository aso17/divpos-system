import api from "./api";
import { GetWithExpiry } from "../utils/SetWithExpiry";
import { encrypt } from "../utils/Encryptions";

const getAuthInfo = () => {
  const user = GetWithExpiry("user");
  return {
    tenantId: user?.tenant_id || null,
    userLogin: user ? `${user.id}-${user.full_name}` : "system",
  };
};

const TransactionService = {
  // Ambil data pelanggan untuk dropdown
  getCustomers: (params = {}) => {
    const { tenantId } = getAuthInfo();
    return api.get("/customer-transaction", {
      params: {
        tenant_id: encrypt(tenantId),
        ...params,
      },
    });
  },

  // Ambil data paket laundry
  getPackages: (params = {}) => {
    const { tenantId } = getAuthInfo();
    return api.get("/package-transaction", {
      params: {
        tenant_id: encrypt(tenantId),
        ...params,
      },
    });
  },

  // Ambil data paket laundry
  getOutlets: (params = {}) => {
    const { tenantId } = getAuthInfo();
    return api.get("/outlet-transaction", {
      params: {
        tenant_id: encrypt(tenantId),
        ...params,
      },
    });
  },

  // Simpan transaksi baru
  createTransaction: (payload) => {
    const { tenantId, userLogin } = getAuthInfo();
    const finalPayload = {
      ...payload,
      tenant_id: encrypt(tenantId),
      created_by: encrypt(userLogin),
    };
    return api.post("/transaction", finalPayload);
  },
};

export default TransactionService;
