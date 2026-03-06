import api from "./api";

const EmployeeService = {
  getEmployees: (params = {}) => {
    return api.get("/employees", {
      params: {
        ...params,
      },
    });
  },

  createEmployee: (payload) => {
    console.log("Creating employee with payload:", payload);
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

    return api.post("/employees", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  updateEmployee: (id, payload) => {
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

    return api.post(`/employees/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  deleteEmployee: (id) => {
    return api.delete(`/employees/${id}`, {
      params: {
        ...params,
      },
    });
  },

  getEmployeeById: (id) => {
    return api.get(`/employees/${id}`, {
      params: {
        ...params,
      },
    });
  },
};

export default EmployeeService;
