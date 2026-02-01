import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequirePermission({
  permission = "view",
  useRoute = null,
  children,
}) {
  const { menus, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  const flatMenus = menus.flatMap((m) => [m, ...(m.children || [])]);
  const pathToMatch = useRoute || location.pathname;
  const current = flatMenus.find((m) => m.route === pathToMatch);
  const allowedMenus = flatMenus.filter((m) => m.permissions?.view);
  if (current && current.permissions?.view && !useRoute) {
    localStorage.setItem("last_allowed_route", current.route);
  }

  const lastAllowedRoute =
    localStorage.getItem("last_allowed_route") ||
    allowedMenus[0]?.route ||
    "/dashboard";

  // Cek apakah menu ditemukan dan apakah user punya izin (view/create/update/etc)
  if (!current || !current.permissions?.[permission]) {
    console.warn(`Akses ditolak ke: ${pathToMatch}. Butuh izin: ${permission}`);
    return <Navigate to={lastAllowedRoute} replace />;
  }

  return children;
}
