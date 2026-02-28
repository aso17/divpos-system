import api from "./api";
import { GetWithExpiry } from "../utils/Storage";
import { encrypt } from "../utils/Encryptions";

const getAuthInfo = () => {
  const user = GetWithExpiry("user");
  return {
    tenantId: user?.tenant_id || null,
    userLogin: user ? `${user.id}-${user.full_name}` : "system",
  };
};

const TransactionService = {
  getInitData: (params = {}) => {
    const { tenantId } = getAuthInfo();
    return api.get("/transaction/init-data", {
      params: {
        tenant_id: encrypt(tenantId),
        ...params,
      },
    });
  },
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

  getPaymentMethods: (params = {}) => {
    const { tenantId } = getAuthInfo();
    return api.get("/paymentmethod-transaction", {
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

  getTransactionHistory: (params = {}) => {
    const { tenantId } = getAuthInfo();
    return api.get("/transactions-history", {
      params: {
        tenant_id: encrypt(tenantId),
        ...params,
      },
    });
  },

  // Simpan transaksi baru
  createTransaction: async (payload) => {
    // console.log("Payload sebelum enkripsi:", payload);
    const { tenantId, userLogin } = getAuthInfo();

    const finalPayload = {
      ...payload,
      tenant_id: encrypt(tenantId),
      created_by: encrypt(userLogin),
    };

    try {
      const response = await api.post("/transactions", finalPayload);
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default TransactionService;
