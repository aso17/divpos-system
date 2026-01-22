import { createContext, useEffect, useState, useRef } from "react";
import api from "../services/api";

export const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const isFetched = useRef(false);

  useEffect(() => {
    // 1. Cek token: Jika sudah login, project-info tidak perlu di-fetch
    const token = localStorage.getItem("access_token");
    if (token) {
      setLoading(false);
      return;
    }

    // 2. Cegah double fetch
    if (isFetched.current) return;

    const fetchProjectInfo = async () => {
      try {
        isFetched.current = true;
        const res = await api.get("/project-info");
        setProject(res.data);
      } catch (err) {
        console.error("Failed to fetch project info", err);
        // Reset ref jika ingin mencoba fetch ulang saat navigasi kembali
        isFetched.current = false;
      } finally {
        setLoading(false);
      }
    };

    fetchProjectInfo();
  }, []);

  return (
    <ProjectContext.Provider value={{ project, loading }}>
      {children}
    </ProjectContext.Provider>
  );
}
