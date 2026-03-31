import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";

export function useHasAccess() {
  const { permissionMap = {} } = useAuth();
  const location = useLocation();

  /**
   * @param {String|Array} requiredPermission - "view", "create", atau ["update", "delete"]
   * @param {String} overrideRoute - Opsional. Jika ingin cek izin rute lain (misal: "/roles")
   */
  const checkAccess = (requiredPermission, overrideRoute = null) => {
    if (Object.keys(permissionMap).length === 0) return false;

    // 🚩 PERUBAHAN: Gunakan rute kustom jika ada, kalau tidak baru pake rute aktif
    const targetPath = overrideRoute || location.pathname;

    const matchedKey = Object.keys(permissionMap).find(
      (pathKey) =>
        targetPath === pathKey || targetPath.startsWith(pathKey + "/")
    );

    const routePermissions = permissionMap[matchedKey];
    if (!routePermissions) return false;

    if (Array.isArray(requiredPermission)) {
      return requiredPermission.some((p) => routePermissions[p] === true);
    }

    return routePermissions[requiredPermission] === true;
  };

  return checkAccess;
}
