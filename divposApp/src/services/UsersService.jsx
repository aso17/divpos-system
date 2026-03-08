import api from "./api";

const UsersService = {
  getUsers: (params = {}) => {
    return api.get("/users", {
      params: {
        ...params,
      },
    });
  },

  createUser: (payload) => {
    // console.log(payload);
    if (payload instanceof FormData) {
      return api.post("/users", payload, {
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

    return api.post("/users", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  updateUser: (id, payload) => {
    let finalData;

    if (payload instanceof FormData) {
      finalData = payload;

      if (!finalData.has("_method")) {
        finalData.append("_method", "PUT");
      }
    } else {
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

    return api.post(`/users/${encryptedUserId}`, finalData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  deleteUser: (id) => {
    return api.delete(`/user/${id}`);
  },
};

export default UsersService;
