import api from "./api";

const TransactionService = {
  getInitData: (params = {}) => {
    return api.get("/transactions/init-data");
  },

  searchCustomer: (params = {}, config = {}) => {
    return api.get("/transactions/customers", {
      params: {
        ...params,
      },
      ...config,
    });
  },

  // Simpan transaksi baru
  createTransaction: async (payload) => {
    // console.log("Payload sebelum enkripsi:", payload);

    const finalPayload = {
      ...payload,
    };

    try {
      const response = await api.post("/transactions", finalPayload);
      return response;
    } catch (error) {
      throw error;
    }
  },

  getTransactionHistory: (params = {}) => {
    return api.get("/transactions/history", {
      params: {
        ...params,
      },
    });
  },
  processPaymentHistory: async (payload) => {
    // console.log("Payload sebelum enkripsi:", payload);

    const finalPayload = {
      ...payload,
    };

    try {
      const response = await api.post(
        "/transactions/paymentUpdate",
        finalPayload
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  cancelTransaction: (id, reason) => {
    return api.patch("/transactions/cancel", {
      transaction_id: id,
      reason,
    });
  },
};

export default TransactionService;
