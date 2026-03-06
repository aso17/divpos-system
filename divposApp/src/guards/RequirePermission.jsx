import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequirePermission({
  permission = "view",
  route = null,
  children,
}) {
  // 1. Ambil state user juga untuk deteksi logout
  const { permissionMap = {}, loading, logout, user } = useAuth();
  const location = useLocation();

  // 2. Jika masih loading awal, tampilkan blank/spinner
  if (loading) {
    return "";
  }

  // 3. FIX: Jika user null (sedang/sudah logout), jangan render apapun.
  // Ini mencegah "kedipan" layar 'Akses Belum Diatur' saat logout.
  if (!user) {
    return null;
  }

  const currentPath = route || location.pathname;
  const totalPermissions = Object.keys(permissionMap).length;

  // 4. Kasus: User Login Berhasil tapi Role/Permission belum di-setting di DB
  if (totalPermissions === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-6 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl font-bold">!</span>
        </div>
        <h1 className="text-xl font-bold text-slate-800">Akses Belum Diatur</h1>
        <p className="text-slate-600 mt-2 max-w-xs">
          Maaf akun Anda belum memiliki akses menu. Silakan hubungi
          Administrator untuk mapping menu.
        </p>
        <button
          onClick={logout}
          className="mt-6 px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
        >
          exit
        </button>
      </div>
    );
  }

  // 5. Cari rute yang cocok di dalam permissionMap
  const matchedRoute = Object.keys(permissionMap).find((r) =>
    currentPath.startsWith(r),
  );

  const routePermissions = permissionMap[matchedRoute];
  const hasPermission =
    routePermissions && routePermissions[permission] === true;

  // 6. Penanganan jika tidak punya izin (Access Denied)
  if (!hasPermission) {
    console.warn(`Akses ditolak ke ${currentPath}. Butuh izin: ${permission}`);

    // Jika di dashboard saja tidak boleh, tampilkan error khusus
    if (currentPath === "/dashboard") {
      return (
        <div className="p-10 text-center">
          <h2 className="text-lg font-semibold text-red-500">
            Izin Dashboard Tidak Ditemukan
          </h2>
          <button onClick={logout} className="mt-4 text-emerald-600 underline">
            Logout
          </button>
        </div>
      );
    }

    // Jika akses halaman lain (laundry/salon/dll) dilarang, lempar balik ke dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
