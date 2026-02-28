import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import Dashboard from "../pages/dashboard/Dashboard";
import UsersPage from "../pages/users/UsersList";
import RolePage from "../pages/Roles/RolesList";
import PackagePage from "../pages//package/PackageList";
import OutletPage from "../pages/outlets/OutletList";
import CategoryPage from "../pages/category/CategoryList";
import LayananPage from "../pages/masterservice/MasterServiceList";
import PaymentMethodPage from "../pages/paymentMethod/PaymentMethodList";
import TransactionPage from "../pages/transactions/Transactions";
import TrxHistoryPage from "../pages/transactions/TransactionHistory";
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
          <Route path="*" element={<Navigate to="/login" replace />} />
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

            <Route
              path="/transaction"
              element={
                <RequirePermission permission="view">
                  <TransactionPage />
                </RequirePermission>
              }
            />

            <Route
              path="/transaction-history"
              element={
                <RequirePermission permission="view">
                  <TrxHistoryPage />
                </RequirePermission>
              }
            />

            {/* Master Data */}
            <Route
              path="/outlets"
              element={
                <RequirePermission permission="view">
                  <OutletPage />
                </RequirePermission>
              }
            />

            {/* Master Data */}
            <Route
              path="/services"
              element={
                <RequirePermission permission="view">
                  <LayananPage />
                </RequirePermission>
              }
            />

            {/* Master Data */}
            <Route
              path="/payment-method"
              element={
                <RequirePermission permission="view">
                  <PaymentMethodPage />
                </RequirePermission>
              }
            />

            {/* User & Role Management */}
            <Route
              path="/users"
              element={
                <RequirePermission permission="view">
                  <UsersPage />
                </RequirePermission>
              }
            />
            <Route
              path="/roles"
              element={
                <RequirePermission permission="view">
                  <RolePage />
                </RequirePermission>
              }
            />
            <Route
              path="/packages"
              element={
                <RequirePermission permission="view">
                  <PackagePage />
                </RequirePermission>
              }
            />
            <Route
              path="/categories"
              element={
                <RequirePermission permission="view">
                  <CategoryPage />
                </RequirePermission>
              }
            />

            <Route
              path="/rolespermission/:roleId"
              element={
                <RequirePermission permission="update" useRoute="/rolelist">
                  <RolePermissionsPage />
                </RequirePermission>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
