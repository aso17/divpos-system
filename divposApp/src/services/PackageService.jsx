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

const PackageService = {
  getNextCode: (serviceId, categoryId) => {
    const { tenantId } = getAuthInfo();
    const service_Id = encrypt(serviceId);
    const category_Id = encrypt(categoryId);
    return api.get("/generate-code", {
      params: {
        tenant_id: encrypt(tenantId),
        service_id: service_Id,
        category_id: category_Id,
        module: "package",
      },
    });
  },

  getPackages: (params = {}) => {
    const { tenantId } = getAuthInfo();
    return api.get("/package", {
      params: {
        tenant_id: encrypt(tenantId),
        ...params,
      },
    });
  },

  // Buat paket baru
  createPackage: (payload) => {
    console.log(payload);
    const { tenantId, userLogin } = getAuthInfo();
    const finalPayload = {
      ...payload,
      tenant_id: encrypt(tenantId),
      created_by: encrypt(userLogin),
    };
    return api.post("/package", finalPayload);
  },

  // Update data paket
  updatePackage: (id, payload) => {
    const { tenantId, userLogin } = getAuthInfo();
    const package_id = encrypt(id);
    const finalPayload = {
      ...payload,
      tenant_id: encrypt(tenantId),
      updated_by: encrypt(userLogin),
      _method: "PUT",
    };
    return api.post(`/package/${package_id}`, finalPayload);
  },

  // Hapus paket (Soft Delete)
  deletePackage: (id) => {
    const { tenantId } = getAuthInfo();
    const package_id = encrypt(id);
    return api.delete(`/package/${package_id}`, {
      params: {
        tenant_id: encrypt(tenantId),
      },
    });
  },
};

export default PackageService;
