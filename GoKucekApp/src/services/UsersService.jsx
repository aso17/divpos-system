import api from "./api";
import { GetWithExpiry } from "../utils/SetWithExpiry";
import { encrypt } from "../utils/Encryptions";
const getTenantId = () => {
  const user = GetWithExpiry("user");
  return user?.tenant_id || null;
};

const UsersService = {
  getUsers: (params = {}) => {
    const tenantId = getTenantId();
    return api.get("/user", {
      params: {
        tenant_id: encrypt(tenantId),
        ...params, // page, per_page, keyword, dll
      },
    });
  },

  createUser: (payload) => {
    const tenantId = getTenantId();

    if (payload instanceof FormData) {
      if (tenantId && !payload.has("tenant_id")) {
        payload.append("tenant_id", tenantId);
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

    if (tenantId) formData.append("tenant_id", tenantId);

    return api.post("/user", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  updateUser: (id, payload) => {
    let finalData;
    console.log("Payload sebelum diupdate:", payload);

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
    const tenantId = getTenantId(); // Pastikan fungsi ini tersedia
    if (tenantId && !finalData.has("tenant_id")) {
      finalData.append("tenant_id", tenantId);
    }

    return api.put(`/user/${id}`, finalData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // updateUser: (id, payload) => {
  //   const formData = new FormData();

  //   formData.append("_method", "PUT");

  //   Object.entries(payload).forEach(([key, value]) => {
  //     if (value !== null && value !== undefined) {
  //       if (value instanceof File) {
  //         formData.append(key, value);
  //       } else if (typeof value === "object") {
  //         formData.append(key, JSON.stringify(value));
  //       } else {
  //         formData.append(key, value);
  //       }
  //     }
  //   });

  //   return api.post(`/user/${id}`, formData);
  // },

  deleteUser: (id) => {
    const tenantId = getTenantId();
    return api.delete(`/user/${id}`, {
      params: { tenant_id: tenantId },
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
