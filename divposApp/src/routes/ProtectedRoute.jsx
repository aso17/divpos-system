import { Navigate, Outlet } from "react-router-dom";
import { GetWithExpiry } from "../utils/Storage";

export default function ProtectedRoute() {
  const token = GetWithExpiry("access_token");

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}
