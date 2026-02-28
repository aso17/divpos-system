import { Navigate, Outlet } from "react-router-dom";
import { GetWithExpiry } from "../utils/Storage";

export default function PublicRoute() {
  const token = GetWithExpiry("access_token");

  // 🔥 PERBAIKAN: Jika ada token, arahkan ke dashboard, bukan login 🔥
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  // Jika tidak ada token, izinkan akses ke halaman public (login)
  return <Outlet />;
}
