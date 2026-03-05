import api from "./api";
import { GetWithExpiry } from "../utils/Storage";
const getAuthInfo = () => {
  const user = GetWithExpiry("user");
  return {
    tenantId: user?.tenant.id || null,
    userLogin: user ? user.id : null,
  };
};

const EmployeeService = {
  getEmployees: (params = {}) => {
    const { tenantId } = getAuthInfo();

    return api.get("/employees", {
      params: {
        tenant_id: tenantId,
        ...params,
      },
    });
  },

  createEmployee: (payload) => {
    console.log("Creating employee with payload:", payload);
    const { tenantId, userLogin } = getAuthInfo();
    const formData = new FormData();
    Object.keys(payload).forEach((key) => {
      if (payload[key] !== null && payload[key] !== undefined) {
        if (typeof payload[key] === "boolean") {
          formData.append(key, payload[key] ? 1 : 0);
        } else {
          formData.append(key, payload[key]);
        }
      }
    });

    if (tenantId) formData.append("tenant_id", tenantId);
    if (userLogin) formData.append("created_by", userLogin);

    return api.post("/employees", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  updateEmployee: (id, payload) => {
    const { tenantId, userLogin } = getAuthInfo();

    const formData = new FormData();
    formData.append("_method", "PUT");

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

    if (tenantId && !formData.has("tenant_id")) {
      formData.append("tenant_id", tenantId);
    }
    if (userLogin && !formData.has("updated_by")) {
      formData.append("updated_by", userLogin);
    }

    return api.post(`/employees/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  deleteEmployee: (id) => {
    const { tenantId } = getAuthInfo();
    return api.delete(`/employees/${id}`, {
      params: {
        tenant_id: tenantId,
      },
    });
  },

  getEmployeeById: (id) => {
    const { tenantId } = getAuthInfo();
    return api.get(`/employees/${id}`, {
      params: {
        tenant_id: tenantId,
      },
    });
  },
};

export default EmployeeService;
