import api from "./api";

const RolespermissionService = {
  getRolePermissions: (roleId) => {
    return api.get("/access-control/role-permissions", {
      params: {
        roleid: roleId,
      },
    });
  },

  updatePermissions: (roleID, payload) => {
    // console.log(roleID);
    const finalPayload = {
      ...payload,
      roleid: roleID,
    };

    return api.post("/access-control/role-permissions", finalPayload);
  },
};

export default RolespermissionService;
