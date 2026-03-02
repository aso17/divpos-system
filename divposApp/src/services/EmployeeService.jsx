import api from "./api";
import { GetWithExpiry } from "../utils/Storage";
import { encrypt } from "../utils/Encryptions";

const getTenantId = () => {
  const user = GetWithExpiry("user");
  return user?.tenant_id || null;
};

const EmployeeService = {
  getEmployees: (params = {}) => {
    const tenantId = getTenantId();
    const encryptedTenantId = encrypt(tenantId);

    return api.get("/employees", {
      params: {
        tenant_id: encryptedTenantId,
        ...params,
      },
    });
  },

  createEmployee: (payload) => {
    const tenantId = getTenantId();
    const encryptedTenantId = encrypt(tenantId);

    // Konversi payload ke FormData untuk mendukung data kompleks dan file jika ada
    const formData = new FormData();
    Object.keys(payload).forEach((key) => {
      if (payload[key] !== null && payload[key] !== undefined) {
        // Konversi boolean ke 0/1 untuk database
        if (typeof payload[key] === "boolean") {
          formData.append(key, payload[key] ? 1 : 0);
        } else {
          formData.append(key, payload[key]);
        }
      }
    });

    if (encryptedTenantId) formData.append("tenant_id", encryptedTenantId);

    return api.post("/employees", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  updateEmployee: (id, payload) => {
    const tenantId = getTenantId();
    const encryptedTenantId = encrypt(tenantId);
    const encryptedEmployeeId = encrypt(id);

    const formData = new FormData();
    formData.append("_method", "PUT"); // Laravel PUT spoofing

    Object.entries(payload).forEach(([key, value]) => {
      if (value === null || value === undefined) return;

      if (value instanceof File) {
        formData.append(key, value);
      } else if (typeof value === "boolean") {
        formData.append(key, value ? 1 : 0);
      } else {
        formData.append(key, value);
      }
    });

    if (encryptedTenantId && !formData.has("tenant_id")) {
      formData.append("tenant_id", encryptedTenantId);
    }

    return api.post(`/employees/${encryptedEmployeeId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  deleteEmployee: (id) => {
    const tenantId = getTenantId();
    const encryptedEmployeeId = encrypt(id);
    const encryptedTenantId = encrypt(tenantId);

    return api.delete(`/employees/${encryptedEmployeeId}`, {
      params: {
        tenant_id: encryptedTenantId,
      },
    });
  },

  getEmployeeById: (id) => {
    const tenantId = getTenantId();
    const encryptedTenantId = encrypt(tenantId);
    const encryptedEmployeeId = encrypt(id);

    return api.get(`/employees/${encryptedEmployeeId}`, {
      params: {
        tenant_id: encryptedTenantId,
      },
    });
  },
};

export default EmployeeService;
