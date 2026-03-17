// DashboardLayout.jsx
// Perubahan: tablet (md) kini berperilaku seperti mobile — sidebar drawer
// Desktop = lg+ → sidebar persistent

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import AppHead from "../components/common/AppHead";
import { Outlet } from "react-router-dom";
import { useState } from "react";

export default function DashboardLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    // lg:flex — hanya desktop yang pakai flex row
    // di bawah lg (mobile + tablet) layout stack vertikal
    <div className="min-h-screen bg-gray-50 lg:flex">
      <AppHead title="Dashboard" />

      {/* Sidebar — drawer di mobile & tablet, persistent di desktop */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <Topbar
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto w-full">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}
