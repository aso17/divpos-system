import { Navigate, Outlet } from "react-router-dom";
import { GetWithExpiry } from "../utils/Storage";

export default function ProtectedRoute() {
  const token = GetWithExpiry("access_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
