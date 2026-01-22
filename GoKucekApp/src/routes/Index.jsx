import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import Dashboard from "../pages/dashboard/Dashboard";
import LoginPage from "../pages/login/Login";
// import ServerNasList from "../pages/servernas/ServerNasList";
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
              path="/"
              element={
                <RequirePermission permission="view">
                  <Dashboard />
                </RequirePermission>
              }
            />

            {/* <Route
              path="/servernas"
              element={
                <RequirePermission permission="view">
                 
                </RequirePermission>
              }
            /> */}

            {/*
              Contoh route lain:
              <Route
                path="/users"
                element={
                  <RequirePermission permission="view">
                    <UsersPage />
                  </RequirePermission>
                }
              />
            */}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
