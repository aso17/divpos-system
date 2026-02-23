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

const PaymentMethodService = {
  // Ambil list metode pembayaran dengan filter/keyword
  getPaymentMethods: (params = {}) => {
    const { tenantId } = getAuthInfo();
    return api.get("/payment-method", {
      params: {
        tenant_id: encrypt(tenantId),
        ...params,
      },
    });
  },

  // Buat metode pembayaran baru
  createPaymentMethod: (payload) => {
    const { tenantId, userLogin } = getAuthInfo();
    const finalPayload = {
      ...payload,
      tenant_id: encrypt(tenantId),
      created_by: encrypt(userLogin),
    };
    return api.post("/payment-method", finalPayload);
  },

  // Update data metode pembayaran
  updatePaymentMethod: (id, payload) => {
    const { tenantId, userLogin } = getAuthInfo();
    const method_id = encrypt(id);
    const finalPayload = {
      ...payload,
      tenant_id: encrypt(tenantId),
      updated_by: encrypt(userLogin),
      _method: "PUT",
    };
    return api.post(`/payment-method/${method_id}`, finalPayload);
  },

  // Hapus metode pembayaran (Soft Delete)
  deletePaymentMethod: (id) => {
    const { tenantId } = getAuthInfo();
    const method_id = encrypt(id);
    return api.delete(`/payment-method/${method_id}`, {
      params: {
        tenant_id: encrypt(tenantId),
      },
    });
  },
};

export default PaymentMethodService;
