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

const MasterService = {
  getMasterServices: (params = {}) => {
    const { tenantId } = getAuthInfo();
    return api.get("/masterservice", {
      params: {
        tenant_id: encrypt(tenantId),
        ...params,
      },
    });
  },

  createMasterService: (payload) => {
    const { tenantId, userLogin } = getAuthInfo();
    const finalPayload = {
      ...payload,
      tenant_id: encrypt(tenantId),
      created_by: encrypt(userLogin),
    };
    return api.post("/masterservice", finalPayload);
  },

  updateMasterService: (id, payload) => {
    const { tenantId, userLogin } = getAuthInfo();
    const finalPayload = {
      ...payload,
      tenant_id: encrypt(tenantId),
      updated_by: encrypt(userLogin),
      _method: "PUT",
    };
    return api.post(`/masterservice/${id}`, finalPayload);
  },
  // myserviceService.js

  deleteMasterService: (id) => {
    const { tenantId } = getAuthInfo();
    const masterServiceId = encrypt(id);
    const tenant_id = encrypt(tenantId);
    return api.delete(`/masterservice/${masterServiceId}`, {
      params: { tenant_id: tenant_id },
    });
  },
};

export default MasterService;
