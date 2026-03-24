import api from "./api";

export const RegistrationService = {
  // Ambil list untuk dropdown (Laundry, Salon, dll)
  getBisnisType: () => {
    return api.get("/busines-type");
  },

  // Kirim payload Tenant & Owner ke BE
  register: (payload) => {
    console.log(payload);
    return api.post("/register", payload);
  },
};
