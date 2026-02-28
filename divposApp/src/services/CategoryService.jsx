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

const CategoryService = {
  getCategories: (params = {}) => {
    const { tenantId } = getAuthInfo();
    return api.get("/category", {
      params: {
        tenant_id: encrypt(tenantId),
        ...params,
      },
    });
  },

  // Membuat kategori baru
  createCategory: (payload) => {
    const { tenantId, userLogin } = getAuthInfo();
    const finalPayload = {
      ...payload,
      tenant_id: encrypt(tenantId),
      created_by: encrypt(userLogin),
    };
    return api.post("/category", finalPayload);
  },

  // Update data kategori
  updateCategory: (id, payload) => {
    const idCategory = encrypt(id);
    const { tenantId, userLogin } = getAuthInfo();
    const finalPayload = {
      ...payload,
      tenant_id: encrypt(tenantId),
      updated_by: encrypt(userLogin),
      _method: "PUT",
    };
    return api.post(`/category/${idCategory}`, finalPayload);
  },

  // Menghapus kategori
  deleteCategory: (id) => {
    const { tenantId } = getAuthInfo();
    const encryptedId = encrypt(id);
    const encryptedTenantId = encrypt(tenantId);

    return api.delete(`/category/${encryptedId}`, {
      params: {
        tenant_id: encryptedTenantId,
      },
    });
  },
};

export default CategoryService;
