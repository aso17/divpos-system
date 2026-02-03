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

const RoleService = {
  GetRolesByTenant: () => {
    const { tenantId } = getAuthInfo();
    return api.get("/GetRolesByTenant", {
      params: {
        tenant_id: encrypt(tenantId),
      },
    });
  },

  getRoles: (params = {}) => {
    const { tenantId } = getAuthInfo();
    return api.get("/roles", {
      params: {
        tenant_id: encrypt(tenantId),
        ...params,
      },
    });
  },

  createRole: (payload) => {
    const { tenantId, userLogin } = getAuthInfo();
    const finalPayload = {
      ...payload,
      tenant_id: tenantId,
      created_by: userLogin,
    };
    return api.post("/roles", finalPayload);
  },

  updateRole: (id, payload) => {
    const { tenantId, userLogin } = getAuthInfo();
    const finalPayload = {
      ...payload,
      tenant_id: tenantId,
      updated_by: userLogin,
      _method: "PUT",
    };
    return api.post(`/roles/${id}`, finalPayload);
  },

  deleteRole: (role_id) => {
    const { tenantId } = getAuthInfo();
    console.log("Deleting role with ID:", role_id, "for tenant ID:", tenantId);
    return api.delete(`/roles/${encrypt(role_id)}`, {
      params: { tenant_id: encrypt(tenantId) },
    });
  },
};

export default RoleService;
