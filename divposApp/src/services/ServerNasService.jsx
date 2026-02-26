import api from "./api";

const ServerNasService = {
  // =========================
  // 🔹 Dummy Data (DO NOT DELETE)
  // =========================
  getAll: async () => {
    // Simulasi delay API
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      data: [
        {
          id: 1,
          name: "NAS Jakarta 01",
          ip_address: "10.10.0.1",
          secret: "radius123",
          type: "mikrotik",
          status: "active",
        },
        {
          id: 2,
          name: "NAS Jakarta 02",
          ip_address: "10.10.0.2",
          secret: "radius123",
          type: "mikrotik",
          status: "inactive",
        },
        {
          id: 3,
          name: "NAS Bandung 01",
          ip_address: "10.20.0.1",
          secret: "secret321",
          type: "cisco",
          status: "active",
        },
        {
          id: 4,
          name: "NAS Bandung 02",
          ip_address: "10.20.0.2",
          secret: "secret321",
          type: "cisco",
          status: "active",
        },
        {
          id: 5,
          name: "NAS Surabaya 01",
          ip_address: "10.30.0.1",
          secret: "nas321",
          type: "mikrotik",
          status: "inactive",
        },
        {
          id: 6,
          name: "NAS Surabaya 02",
          ip_address: "10.30.0.2",
          secret: "nas321",
          type: "mikrotik",
          status: "active",
        },
        {
          id: 7,
          name: "NAS Medan 01",
          ip_address: "10.40.0.1",
          secret: "radiusmedan",
          type: "cisco",
          status: "active",
        },
        {
          id: 8,
          name: "NAS Medan 02",
          ip_address: "10.40.0.2",
          secret: "radiusmedan",
          type: "cisco",
          status: "inactive",
        },
        {
          id: 9,
          name: "NAS Bali 01",
          ip_address: "10.50.0.1",
          secret: "bali321",
          type: "mikrotik",
          status: "active",
        },
        {
          id: 10,
          name: "NAS Bali 02",
          ip_address: "10.50.0.2",
          secret: "bali321",
          type: "mikrotik",
          status: "active",
        },
        {
          id: 11,
          name: "NAS Makassar 01",
          ip_address: "10.60.0.1",
          secret: "makassar",
          type: "cisco",
          status: "inactive",
        },
        {
          id: 12,
          name: "NAS Makassar 02",
          ip_address: "10.60.0.2",
          secret: "makassar",
          type: "cisco",
          status: "active",
        },
        {
          id: 13,
          name: "NAS Semarang 01",
          ip_address: "10.70.0.1",
          secret: "semarang",
          type: "mikrotik",
          status: "active",
        },
        {
          id: 14,
          name: "NAS Semarang 02",
          ip_address: "10.70.0.2",
          secret: "semarang",
          type: "mikrotik",
          status: "inactive",
        },
        {
          id: 15,
          name: "NAS Palembang 01",
          ip_address: "10.80.0.1",
          secret: "palembang",
          type: "cisco",
          status: "active",
        },
        {
          id: 16,
          name: "NAS Palembang 02",
          ip_address: "10.80.0.2",
          secret: "palembang",
          type: "cisco",
          status: "active",
        },
        {
          id: 17,
          name: "NAS Batam 01",
          ip_address: "10.90.0.1",
          secret: "batam",
          type: "mikrotik",
          status: "inactive",
        },
        {
          id: 18,
          name: "NAS Batam 02",
          ip_address: "10.90.0.2",
          secret: "batam",
          type: "mikrotik",
          status: "active",
        },
        {
          id: 19,
          name: "NAS Pontianak 01",
          ip_address: "10.100.0.1",
          secret: "ponti",
          type: "cisco",
          status: "active",
        },
        {
          id: 20,
          name: "NAS Pontianak 02",
          ip_address: "10.100.0.2",
          secret: "ponti",
          type: "cisco",
          status: "inactive",
        },
      ],
    };
  },

  // =========================
  // 🔹  API Services
  // =========================
  getRouters: (params) => {
    return api.get("/routers", { params });
  },

  createRouter: (payload) => {
    console.log("Payload to createRouter:", payload);
    return api.post("/routers", payload);
  },

  updateRouter: (id, payload) => {
    return api.put(`/routers/${id}`, payload);
  },

  deleteRouter: (id) => {
    return api.delete(`/routers/${id}`);
  },

  getRouterById: (id) => {
    return api.get(`/routers/${id}`);
  },
};

export default ServerNasService;
