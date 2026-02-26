import { useContext, useEffect } from "react";
import { ProjectContext } from "../../context/ProjectContext";

export default function AppHead({ title }) {
  const { project } = useContext(ProjectContext);

  useEffect(() => {
    // 🔹 Ambil project info dari context dulu, fallback ke localStorage, fallback terakhir "Application"
    const projectName =
      project?.name || localStorage.getItem("tenant_name") || "Application";
    const projectLogo =
      project?.logo_path || localStorage.getItem("tenant_logo_path");

    // 🔹 Set document.title, utamakan prop title
    document.title = title ? `${title} | ${projectName}` : projectName;

    // 🔹 Update favicon
    if (projectLogo) {
      let link = document.querySelector("link[rel='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = projectLogo;
    }
  }, [project, title]);

  return null;
}
