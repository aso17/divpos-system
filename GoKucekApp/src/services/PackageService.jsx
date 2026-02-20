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

const PackageService = {
  // Ambil daftar paket (Master Paket)
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
    const finalPayload = {
      ...payload,
      tenant_id: encrypt(tenantId),
      updated_by: encrypt(userLogin),
      _method: "PUT", // Gunakan POST + _method PUT untuk kompatibilitas Laravel
    };
    return api.post(`/package/${id}`, finalPayload);
  },

  // Hapus paket (Soft Delete)
  deletePackage: (id) => {
    const { tenantId } = getAuthInfo();
    return api.delete(`/package/${encrypt(id)}`, {
      params: {
        tenant_id: encrypt(tenantId),
      },
    });
  },
};

export default PackageService;
