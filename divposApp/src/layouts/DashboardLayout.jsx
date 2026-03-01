import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
import AppHead from "../components/common/AppHead";
import { useState } from "react";

export default function DashboardLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      <AppHead title="Dashboard" />

      {/* SIDEBAR */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <Topbar
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />

        {/* FIX DI SINI */}
        <main className="flex-1 overflow-y-auto w-full">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}
