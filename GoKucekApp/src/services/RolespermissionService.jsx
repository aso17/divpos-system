import api from "./api";
import { GetWithExpiry } from "../utils/SetWithExpiry";
import { encrypt } from "../utils/Encryptions";
const getTenantId = () => {
  const user = GetWithExpiry("user");
  return user?.tenant_id || null;
};

const RolespermissionService = {
  getRolePermissions: (roleId) => {
    const tenantId = getTenantId();
    return api.get("/rolespermission", {
      params: {
        tenantid: encrypt(tenantId),
        roleid: encrypt(roleId),
      },
    });
  },

  updatePermissions: (roleId, payload) => {
    const tenantId = getTenantId();
    return api.post("/rolespermission/update", payload, {
      params: {
        tenantid: tenantId,
        roleid: roleId,
      },
    });
  },
};

export default RolespermissionService;
