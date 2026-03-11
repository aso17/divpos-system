import api from "./api";

const PackageService = {
  getPackages: (params = {}) => {
    return api.get("/packages", {
      params: {
        ...params,
      },
    });
  },

  // Buat paket baru
  createPackage: (payload) => {
    console.log(payload);
    const finalPayload = {
      ...payload,
    };
    return api.post("/packages", finalPayload);
  },

  // Update data paket
  updatePackage: (id, payload) => {
    const finalPayload = {
      ...payload,
      _method: "PUT",
    };
    return api.post(`/packages/${id}`, finalPayload);
  },

  // Hapus paket (Soft Delete)
  deletePackage: (id) => {
    return api.delete(`/packages/${id}`);
  },
};

export default PackageService;
