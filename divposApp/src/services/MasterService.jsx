import api from "./api";

const MasterService = {
  getMasterServices: (params = {}) => {
    return api.get("/master-services", {
      params: {
        ...params,
      },
    });
  },

  createMasterService: (payload) => {
    const finalPayload = {
      ...payload,
    };
    return api.post("/master-services", finalPayload);
  },

  updateMasterService: (id, payload) => {
    const finalPayload = {
      ...payload,
      _method: "PUT",
    };
    return api.post(`/master-services/${id}`, finalPayload);
  },
  // myserviceService.js

  deleteMasterService: (id) => {
    return api.delete(`/master-services/${id}`);
  },
};

export default MasterService;
