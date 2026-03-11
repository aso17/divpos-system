import api from "./api";

const UnitService = {
  getUnits: () => {
    return api.get("/units");
  },
};

export default UnitService;
