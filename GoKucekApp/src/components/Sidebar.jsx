import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { icons } from "../utils/Icons";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";

export default function Sidebar() {
  const { menus } = useAuth();
  const [open, setOpen] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const ChevronIcon = icons.chevron;

  useEffect(() => {
    const parent = menus.find((m) =>
      m.children?.some((c) => c.route === location.pathname),
    );
    if (parent) setOpen(parent.id);
  }, [location.pathname, menus]);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <aside
      className={`relative min-h-screen bg-white border-r border-slate-100 flex flex-col transition-all duration-500 ease-in-out z-40 
      ${isCollapsed ? "w-20" : "w-56"}`} // Dikurangi ke w-56 agar lebih ramping
    >
      {/* Tombol Toggle */}
      <button
        onClick={toggleCollapse}
        className="hidden md:flex absolute -right-3 top-10 w-6 h-6 bg-white border border-slate-100 shadow-sm rounded-full items-center justify-center text-slate-400 hover:text-emerald-600 z-50 transition-colors"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Brand Header - Padding dikecilkan */}
      <div
        className={`p-3 mb-2 transition-all duration-300 ${isCollapsed ? "px-4" : ""}`}
      >
        <div
          className={`flex items-center gap-2 p-2 rounded-2xl bg-slate-50/50 border border-slate-100 transition-all ${isCollapsed ? "justify-center" : ""}`}
        >
          <div className="bg-white rounded-xl p-1 flex-shrink-0 shadow-sm border border-slate-100">
            <img
              src={localStorage.getItem("tenant_logo_path")}
              alt="Logo"
              className="w-6 h-6 object-contain" // Ukuran logo dikecilkan sedikit
            />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden animate-in fade-in slide-in-from-left-2">
              <h1 className="text-[10px] font-black text-slate-800 truncate uppercase tracking-tight leading-none">
                {localStorage.getItem("tenant_name") || "GoKucek"}
              </h1>
              <span className="text-[7px] text-emerald-600 font-bold uppercase tracking-tighter">
                System
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation - Padding px-2 agar item menu lebih lebar di dalam */}
      <nav className="flex-1 px-2.5 space-y-0.5 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {!isCollapsed && (
          <p className="px-3 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 mt-2 opacity-60">
            Menu Utama
          </p>
        )}

        {menus.map((menu) => {
          const Icon = icons[menu.icon] || LayoutGrid;
          const hasChild = menu.children?.length > 0;
          const isActive =
            menu.route === location.pathname ||
            menu.children?.some((c) => c.route === location.pathname);
          const isOpen = open === menu.id;

          return (
            <div key={menu.id} className="relative">
              {!hasChild ? (
                <NavLink
                  to={menu.route}
                  className={({ isActive }) => `
                    group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-300 mb-0.5
                    ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-100/50"
                        : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                    }
                    ${isCollapsed ? "justify-center px-0 mx-auto w-10" : ""}
                  `}
                >
                  <Icon
                    size={18} // Ukuran icon konsisten 18px
                    className={
                      isActive
                        ? "text-white"
                        : "text-slate-400 group-hover:text-emerald-600"
                    }
                  />
                  {!isCollapsed && (
                    <span className="text-[11px] font-bold tracking-tight">
                      {menu.name}
                    </span>
                  )}
                </NavLink>
              ) : (
                <>
                  <button
                    onClick={() =>
                      !isCollapsed && setOpen(isOpen ? null : menu.id)
                    }
                    className={`w-full group flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-300 mb-0.5
                    ${isActive && !isOpen ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:bg-emerald-50"}
                    ${isCollapsed ? "justify-center px-0 mx-auto w-10" : ""}
                    `}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        size={18}
                        className={
                          isActive && !isOpen
                            ? "text-white"
                            : "text-slate-400 group-hover:text-emerald-600"
                        }
                      />
                      {!isCollapsed && (
                        <span className="text-[11px] font-bold tracking-tight">
                          {menu.name}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <ChevronIcon
                        size={10}
                        className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                      />
                    )}
                  </button>

                  {/* Sub-menu: Lebih Rapat (ml-4) */}
                  {!isCollapsed && (
                    <div
                      className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-80 mb-2" : "max-h-0"}`}
                    >
                      <div className="ml-4 border-l border-slate-100 space-y-0.5 my-1">
                        {menu.children.map((sub) => {
                          const isSubActive = location.pathname === sub.route;
                          return (
                            <NavLink
                              key={sub.id}
                              to={sub.route}
                              className={`block pl-4 py-1.5 text-[10px] transition-all relative font-bold
                              ${isSubActive ? "text-emerald-600 bg-emerald-50/50 rounded-r-lg" : "text-slate-400 hover:text-emerald-600 hover:pl-5"}`}
                            >
                              {isSubActive && (
                                <div className="absolute left-[-1px] top-1/2 -translate-y-1/2 w-[2px] h-3 bg-emerald-500 rounded-full" />
                              )}
                              {sub.name}
                            </NavLink>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer - Lebih Ringkas */}
      {!isCollapsed && (
        <div className="p-3 mt-auto">
          <div className="bg-slate-900 rounded-xl p-2.5 text-white relative overflow-hidden border border-slate-800">
            <p className="text-[9px] font-bold tracking-tight opacity-90">
              V. 2.4.0 (Ent)
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
              <p className="text-[7px] text-emerald-400 font-black uppercase tracking-widest text-[7px]">
                Sistem Online
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
