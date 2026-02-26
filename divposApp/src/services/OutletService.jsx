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

const OutletService = {
  getOutlets: (params = {}) => {
    const { tenantId } = getAuthInfo();
    return api.get("/outlet", {
      params: {
        tenant_id: encrypt(tenantId),
        ...params,
      },
    });
  },

  generateCode: () => {
    const { tenantId } = getAuthInfo();
    return api.get("/outlet/generatecode", {
      params: {
        tenant_id: encrypt(tenantId),
      },
    });
  },

  createOutlet: (payload) => {
    const { tenantId, userLogin } = getAuthInfo();
    const finalPayload = {
      ...payload,
      tenant_id: encrypt(tenantId),
      created_by: encrypt(userLogin),
    };
    return api.post("/outlet", finalPayload);
  },

  updateOutlet: (id, payload) => {
    const { tenantId, userLogin } = getAuthInfo();
    const finalPayload = {
      ...payload,
      tenant_id: encrypt(tenantId),
      updated_by: encrypt(userLogin),
      _method: "PUT",
    };
    return api.post(`/outlet/${id}`, finalPayload);
  },
  // OutletService.js

  deleteOutlet: (id) => {
    const { tenantId } = getAuthInfo();
    const OutletId = encrypt(id);
    const tenant_id = encrypt(tenantId);
    return api.delete(`/outlet/${OutletId}`, {
      params: { tenant_id: tenant_id },
    });
  },
};

export default OutletService;
