import api from "./api";

import { GetWithExpiry } from "../utils/SetWithExpiry";

const getTenantId = () => {
  const user = GetWithExpiry("user");
  return user?.tenant_id || null;
};

const RoleService = {
  GetRolesByTenant: () => {
    const tenantId = getTenantId();
    return api.get("/GetRolesByTenant", {
      params: {
        tenant_id: tenantId,
      },
    });
  },

  getRoles: (params = {}) => {
    const tenantId = getTenantId();
    return api.get("/roles", {
      params: {
        tenant_id: tenantId,
        ...params,
      },
    });
  },

  getRolePermissions: (params = {}) => {
    const tenantId = getTenantId();
    return api.get("/roles/permissions", {
      params: {
        tenant_id: tenantId,
        ...params,
      },
    });
  },
};

export default RoleService;
