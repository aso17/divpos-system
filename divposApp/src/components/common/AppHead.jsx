import { useEffect } from "react";

export default function AppHead({ title, icon }) {
  useEffect(() => {
    // 🔹 Ambil info dari localStorage, fallback ke "Application"
    const projectName = localStorage.getItem("tenant_name") || "Application";

    // 🔹 🔥 LOGIKA ICON: Dari prop, jika kosong ambil dari localStorage key 'path_icon'
    const projectLogo = icon || localStorage.getItem("path_icon");

    // 🔹 Set document.title
    document.title = title ? `${title} | ${projectName}` : projectName;

    // 🔹 Update favicon
    if (projectLogo) {
      updateFavicon(projectLogo);
    }
  }, [title, icon]);

  // Fungsi helper untuk update DOM favicon
  const updateFavicon = (url) => {
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    // Tambahkan timestamp untuk menghindari cache jika icon berubah dinamis
    link.href = `${url}?v=${new Date().getTime()}`;
  };

  return null;
}
