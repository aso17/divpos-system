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

const RolespermissionService = {
  getRolePermissions: (roleId) => {
    const { tenantId } = getAuthInfo();
    return api.get("/rolespermission", {
      params: {
        tenantid: encrypt(tenantId),
        roleid: encrypt(roleId),
      },
    });
  },

  updatePermissions: (roleId, payload) => {
    const { tenantId, userLogin } = getAuthInfo();
    const finalPayload = {
      ...payload,
      role_id: roleId,
      tenant_id: tenantId,
      created_by: userLogin,
    };

    return api.post("/rolespermission", finalPayload);
  },
};

export default RolespermissionService;
