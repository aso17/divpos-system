import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequirePermission({ permission = "view", children }) {
  const { menus, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  const flatMenus = menus.flatMap((m) => [m, ...(m.children || [])]);

  const current = flatMenus.find((m) => m.route === location.pathname);
  const allowedMenus = flatMenus.filter((m) => m.permissions?.view);

  // ✅ SIMPAN route terakhir yg valid & boleh diakses
  if (current && current.permissions?.view) {
    localStorage.setItem("last_allowed_route", current.route);
  }

  const lastAllowedRoute =
    localStorage.getItem("last_allowed_route") || allowedMenus[0]?.route || "/";

  if (!current || !current.permissions?.[permission]) {
    return <Navigate to={lastAllowedRoute} replace />;
  }

  return children;
}
