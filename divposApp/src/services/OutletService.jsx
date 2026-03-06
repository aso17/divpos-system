import api from "./api";

const OutletService = {
  getOutlets: (params = {}) => {
    return api.get("/outlets", {
      params: {
        ...params,
      },
    });
  },

  createOutlet: (payload) => {
    const finalPayload = {
      ...payload,
    };
    return api.post("/outlets", finalPayload);
  },

  updateOutlet: (id, payload) => {
    const finalPayload = {
      ...payload,
      _method: "PUT",
    };
    return api.post(`/outlets/${id}`, finalPayload);
  },
  // OutletService.js

  deleteOutlet: (id) => {
    return api.delete(`/outlets/${id}`);
  },
};

export default OutletService;
