import axios from "axios";
import { apiUrl } from "../utils/Url";
const apiPublic = axios.create({
  baseURL: apiUrl(),
  timeout: 10000,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export default apiPublic;
