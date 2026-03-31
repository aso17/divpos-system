import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequirePermission({
  permission = "view",
  route = null,
  children,
  hideOnly = false, // 🚩 TAMBAHKAN INI: Jika true, hanya return null (sembunyikan) saat tidak ada izin
}) {
  const { permissionMap = {}, loading, logout, user } = useAuth();
  const location = useLocation();

  if (loading) return "";
  if (!user) return null;
  console.log(permissionMap);
  const currentPath = route || location.pathname;
  const totalPermissions = Object.keys(permissionMap).length;

  // 1. Kasus: Jika mapping permission kosong sama sekali
  if (totalPermissions === 0) {
    if (hideOnly) return null; // Jika level tombol, sembunyikan saja tanpa layar merah
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-6 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl font-bold">!</span>
        </div>
        <h1 className="text-xl font-bold text-slate-800">Akses Belum Diatur</h1>
        <p className="text-slate-600 mt-2 max-w-xs text-xs md:text-sm">
          Maaf akun Anda belum memiliki akses menu. Silakan hubungi
          Administrator untuk mapping menu.
        </p>
        <button
          onClick={logout}
          className="mt-6 px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold text-xs uppercase"
        >
          exit
        </button>
      </div>
    );
  }

  // 2. Logic pencarian rute (Support nebeng rute & sub-path)
  const matchedRoute = Object.keys(permissionMap).find(
    (r) => currentPath === r || currentPath.startsWith(r + "/")
  );

  const routePermissions = permissionMap[matchedRoute];
  const hasPermission =
    routePermissions && routePermissions[permission] === true;

  // 3. Penanganan jika TIDAK PUNYA IZIN
  if (!hasPermission) {
    // 🚩 JIKA hideOnly AKTIF: Langsung hilangkan elemen (untuk Tombol/Aksi)
    if (hideOnly) {
      return null;
    }

    console.warn(`Akses ditolak ke ${currentPath}. Butuh izin: ${permission}`);

    // Jika di dashboard tidak ada izin view, tampilkan pesan error
    if (currentPath === "/dashboard") {
      return (
        <div className="p-10 text-center flex flex-col items-center justify-center h-screen bg-white">
          <h2 className="text-lg font-black text-rose-500 uppercase italic">
            Izin Dashboard Tidak Ditemukan
          </h2>
          <button
            onClick={logout}
            className="mt-4 text-emerald-600 underline font-bold text-sm uppercase"
          >
            Logout & Reset Session
          </button>
        </div>
      );
    }

    // Jika di halaman lain (level Page), lempar ke dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Jika punya izin, tampilkan kontennya
  return children;
}
