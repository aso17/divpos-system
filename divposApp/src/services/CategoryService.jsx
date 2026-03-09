import api from "./api";

const CategoryService = {
  getCategories: (params = {}) => {
    return api.get("/categories", {
      params: {
        ...params,
      },
    });
  },

  // Membuat kategori baru
  createCategory: (payload) => {
    const finalPayload = {
      ...payload,
    };
    return api.post("/categories", finalPayload);
  },

  // Update data kategori
  updateCategory: (id, payload) => {
    const finalPayload = {
      ...payload,
      _method: "PUT",
    };
    return api.post(`/categories/${id}`, finalPayload);
  },

  // Menghapus kategori
  deleteCategory: (id) => {
    return api.delete(`/categories/${id}`);
  },
};

export default CategoryService;
