import api from "./api";
import { GetWithExpiry } from "../utils/Storage";
import { encrypt } from "../utils/Encryptions";

const getTenantId = () => {
  const user = GetWithExpiry("user");
  return user?.tenant_id || null;
};

const UsersService = {
  getUsers: (params = {}) => {
    const tenantId = getTenantId();
    const encriptedTenantId = encrypt(tenantId);
    return api.get("/user", {
      params: {
        tenant_id: encriptedTenantId,
        ...params,
      },
    });
  },

  createUser: (payload) => {
    const tenantId = getTenantId();
    const encriptedTenantId = encrypt(tenantId);
    if (payload instanceof FormData) {
      if (encriptedTenantId && !payload.has("tenant_id")) {
        payload.append("tenant_id", encriptedTenantId);
      }

      return api.post("/user", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    }

    // Fallback jika payload masih berupa Object biasa (opsional)
    const formData = new FormData();
    Object.keys(payload).forEach((key) => {
      if (payload[key] !== null && payload[key] !== undefined) {
        formData.append(key, payload[key]);
      }
    });

    if (encriptedTenantId) formData.append("tenant_id", encriptedTenantId);

    return api.post("/user", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  updateUser: (id, payload) => {
    let finalData;
    const tenantId = getTenantId();
    const encriptedTenantId = encrypt(tenantId);
    const encryptedUserId = encrypt(id);
    if (payload instanceof FormData) {
      finalData = payload;

      // Pastikan _method PUT ada untuk Laravel/Backend spoofing
      if (!finalData.has("_method")) {
        finalData.append("_method", "PUT");
      }
    }
    // Jika payload masih berupa Object biasa (fallback)
    else {
      finalData = new FormData();
      finalData.append("_method", "PUT");

      Object.entries(payload).forEach(([key, value]) => {
        if (value === null || value === undefined) return;

        if (value instanceof File) {
          finalData.append(key, value);
        } else if (typeof value === "boolean") {
          finalData.append(key, value ? 1 : 0);
        } else {
          finalData.append(key, value);
        }
      });
    }

    // Tambahkan tenant_id jika belum ada
    // Pastikan fungsi ini tersedia
    if (encriptedTenantId && !finalData.has("tenant_id")) {
      finalData.append("tenant_id", encriptedTenantId);
    }

    return api.post(`/user/${encryptedUserId}`, finalData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  deleteUser: (id) => {
    const tenantId = getTenantId();
    const encryptedUserId = encrypt(id);
    const encryptedTenantId = encrypt(tenantId);

    return api.delete(`/user/${encryptedUserId}`, {
      params: {
        tenant_id: encryptedTenantId,
      },
    });
  },
  getUserById: (id) => {
    const tenantId = getTenantId();
    return api.get(`/user/${id}`, {
      params: { tenant_id: tenantId },
    });
  },
};

export default UsersService;
