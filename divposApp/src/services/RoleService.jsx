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
    return api.get("/role", {
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
    return api.post("/role", finalPayload);
  },

  updateRole: (id, payload) => {
    const { tenantId, userLogin } = getAuthInfo();
    const finalPayload = {
      ...payload,
      tenant_id: tenantId,
      updated_by: userLogin,
      _method: "PUT",
    };
    return api.post(`/role/${id}`, finalPayload);
  },
  // RoleService.js

  deleteRole: (id) => {
    const { tenantId } = getAuthInfo();
    const roleId = encrypt(id);
    const tenant_id = encrypt(tenantId);
    return api.delete(`/role/${roleId}`, {
      params: { tenant_id: tenant_id },
    });
  },

  // deleteRole: (id) => {
  //   const { tenantId } = getAuthInfo();
  //   return api.delete(`/role/${encrypt(id)}`, {
  //     params: { tenant_id: encrypt(tenantId) },
  //   });
  // },
};

export default RoleService;
