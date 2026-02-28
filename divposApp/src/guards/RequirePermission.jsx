import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequirePermission({
  permission = "view",
  route = null,
  children,
}) {
  const { permissionMap = {}, loading } = useAuth();
  const location = useLocation();
  // 🔥 TUNGGU DATA DIMUAT 🔥
  if (loading) {
    return <div></div>;
  }
  const currentPath = route || location.pathname;
  // Debug: Pastikan map terisi saat pengecekan

  // Cari route yang cocok (support dynamic route)
  const matchedRoute = Object.keys(permissionMap).find((r) =>
    currentPath.startsWith(r),
  );

  // ⚡️ PERBAIKAN LOGIKA DI SINI ⚡️
  // Cek apakah rute ada di map, dan apakah izin (view/create/dll) bernilai true
  const routePermissions = permissionMap[matchedRoute];
  const hasPermission =
    routePermissions && routePermissions[permission] === true;

  if (!hasPermission) {
    console.warn(`Akses ditolak ke ${currentPath}. Butuh izin: ${permission}`);
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
