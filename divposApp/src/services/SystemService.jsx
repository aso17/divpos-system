import api from "./api";
import { encrypt } from "../utils/Encryptions";

const SystemService = {
  getAppConfig: () => {
    const neededKeys = [
      "appName",
      "logo_path",
      "footer_text",
      "primary_color",
      "favicon_path",
    ];
    const encryptedKeys = neededKeys.map((key) => encrypt(key));
    return api.get("/app-config", {
      params: {
        keys: encryptedKeys,
      },
    });
  },
};

export default SystemService;
