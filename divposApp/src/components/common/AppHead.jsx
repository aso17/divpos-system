import { useEffect } from "react";
import { GetWithExpiry } from "../../utils/Storage";
export default function AppHead({ title, icon }) {
  useEffect(() => {
    const projectName = GetWithExpiry("app")?.appName || "Divpos";
    let iconPath = GetWithExpiry("app")?.icon || null;
    const projectLogo = icon || iconPath || null;

    document.title = title ? `${title} | ${projectName}` : projectName;

    // 🔹 Update favicon
    if (projectLogo) {
      updateFavicon(projectLogo);
    }
  }, [title, icon]);

  const updateFavicon = (url) => {
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    link.href = `${url}?v=${new Date().getTime()}`;
  };

  return null;
}
