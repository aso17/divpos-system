import api from "./api";

const RoleService = {
  GetRolesByTenant: () => {
    return api.get("/access-control/roles-by-tenant", {
      params: {},
    });
  },

  getRoles: (params = {}) => {
    return api.get("/access-control/roles", {
      params: {
        ...params,
      },
    });
  },

  createRole: (payload) => {
    const finalPayload = {
      ...payload,
    };
    return api.post("/access-control/roles", finalPayload);
  },

  updateRole: (id, payload) => {
    const finalPayload = {
      ...payload,
      _method: "PUT",
    };
    return api.post(`/access-control/roles/${id}`, finalPayload);
  },

  deleteRole: (id) => {
    return api.delete(`/access-control/roles/${id}`);
  },
};

export default RoleService;
