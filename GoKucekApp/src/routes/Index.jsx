import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import Dashboard from "../pages/dashboard/Dashboard";
import UsersPage from "../pages/users/UsersList";
import RolePage from "../pages/Roles/RolesList";
import RolePermissionsPage from "../pages/RolePermission/RolePermissionList";
import LoginPage from "../pages/login/Login";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import RequirePermission from "../guards/RequirePermission";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= PUBLIC ================= */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* ================ PROTECTED ================ */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Default / Dashboard */}
            <Route
              path="/dashboard"
              element={
                <RequirePermission permission="view">
                  <Dashboard />
                </RequirePermission>
              }
            />

            {/* Users Management */}
            <Route
              path="/userlist"
              element={
                <RequirePermission permission="view">
                  <UsersPage />
                </RequirePermission>
              }
            />
            <Route
              path="/rolelist"
              element={
                <RequirePermission permission="view">
                  <RolePage />
                </RequirePermission>
              }
            />

            <Route
              path="/roles/permission/:roleId"
              element={
                <RequirePermission permission="update" useRoute="/rolelist">
                  <RolePermissionsPage />
                </RequirePermission>
              }
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
