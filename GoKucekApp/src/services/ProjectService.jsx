import api from "./api";

export const getProjectInfo = () => {
    return api.get("/project-info");
};
