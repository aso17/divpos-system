import api from "./api";
import { GetWithExpiry } from "../utils/Storage";
import { encrypt } from "../utils/Encryptions";

const getAuthInfo = () => {
  const user = GetWithExpiry("user");
  return {
    tenantId: user?.tenant.id || null,
    userLogin: user ? user.id : null,
  };
};

const OutletService = {
  getOutlets: (params = {}) => {
    const { tenantId } = getAuthInfo();
    return api.get("/outlets", {
      params: {
        tenant_id: tenantId,
        ...params,
      },
    });
  },

  createOutlet: (payload) => {
    const { tenantId, userLogin } = getAuthInfo();
    const finalPayload = {
      ...payload,
      tenant_id: tenantId,
      created_by: userLogin,
    };
    return api.post("/outlets", finalPayload);
  },

  updateOutlet: (id, payload) => {
    const ID = encrypt(id);
    const { tenantId, userLogin } = getAuthInfo();
    const finalPayload = {
      ...payload,
      tenant_id: tenantId,
      updated_by: userLogin,
      _method: "PUT",
    };
    return api.post(`/outlets/${ID}`, finalPayload);
  },
  // OutletService.js

  deleteOutlet: (id) => {
    const { tenantId } = getAuthInfo();
    const tenant_id = tenantId;
    return api.delete(`/outlets/${id}`, {
      params: { tenant_id: tenant_id },
    });
  },
};

export default OutletService;
