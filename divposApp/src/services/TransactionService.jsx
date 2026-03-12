import api from "./api";

const TransactionService = {
  getInitData: (params = {}) => {
    return api.get("/transactions/init-data");
  },

  // Tambahkan parameter 'config' setelah 'params'
  searchCustomer: (params = {}, config = {}) => {
    return api.get("/transactions/customers", {
      params: {
        ...params,
      },
      ...config,
    });
  },

  getTransactionHistory: (params = {}) => {
    return api.get("/transactions-history", {
      params: {
        ...params,
      },
    });
  },

  // Simpan transaksi baru
  createTransaction: async (payload) => {
    console.log("Payload sebelum enkripsi:", payload);

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
};

export default TransactionService;
