import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { icons } from "../utils/Icons";
import { ChevronLeft, ChevronRight, LayoutGrid, Menu, X } from "lucide-react";

export default function Sidebar() {
  const { menus } = useAuth();
  const [open, setOpen] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const ChevronIcon = icons.chevron;

  useEffect(() => {
    const parent = menus.find((m) =>
      m.children?.some((c) => c.route === location.pathname),
    );
    if (parent) setOpen(parent.id);

    setIsMobileOpen(false);
  }, [location.pathname, menus]);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="md:hidden flex items-center justify-between px-4 h-14 bg-white border-b sticky top-0 z-30">
        <button onClick={() => setIsMobileOpen(true)}>
          <Menu size={22} />
        </button>
        <h1 className="font-bold text-sm tracking-tight text-slate-800">
          {localStorage.getItem("tenant_name") || "Divpos"}
        </h1>
        <div className="w-5" />
      </div>

      {/* BACKDROP */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside
        className={`
        fixed md:relative top-0 left-0 h-screen bg-white border-r border-slate-200
        flex flex-col transition-all duration-300 ease-in-out z-50
        ${isCollapsed ? "md:w-20" : "md:w-60"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        w-72 shadow-xl md:shadow-none
      `}
      >
        {/* MOBILE CLOSE */}
        <div className="md:hidden flex justify-end p-4">
          <button onClick={() => setIsMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* DESKTOP COLLAPSE BUTTON */}
        <button
          onClick={toggleCollapse}
          className="hidden md:flex absolute -right-3 top-10 w-6 h-6 bg-white border shadow-sm rounded-full items-center justify-center text-slate-400 hover:text-emerald-600 transition z-50"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* LOGO SECTION */}
        <div className="p-6 mb-2 border-b border-slate-50 transition-all duration-300 min-h-[100px] flex flex-col justify-center">
          {!isCollapsed ? (
            <div className="overflow-hidden animate-in fade-in slide-in-from-left-3">
              <h1 className="text-[14px] font-black italic text-slate-800 uppercase tracking-tighter leading-none">
                {localStorage.getItem("tenant_name") || "Divpos"}
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="h-[2px] w-4 bg-emerald-500 rounded-full"></div>
                <span className="text-[8px] text-emerald-600 font-extrabold uppercase tracking-[0.25em] leading-none">
                  Platform
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-400 text-white font-black text-lg shadow-lg shadow-emerald-100 mx-auto">
              {localStorage.getItem("tenant_name")?.charAt(0) || "D"}
            </div>
          )}
        </div>

        {/* NAVIGATION: Area ini akan scroll jika menu banyak */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menus.map((menu) => {
            const Icon = icons[menu.icon] || LayoutGrid;
            const hasChild = menu.children?.length > 0;
            const isActive =
              menu.route === location.pathname ||
              menu.children?.some((c) => c.route === location.pathname);
            const isOpen = open === menu.id;

            return (
              <div key={menu.id}>
                {!hasChild ? (
                  <NavLink
                    to={menu.route}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive ? "bg-emerald-50 text-emerald-600" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"}
                      ${isCollapsed ? "md:justify-center" : "gap-3"}`
                    }
                  >
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      <Icon size={18} />
                    </div>
                    {!isCollapsed && <span>{menu.name}</span>}
                  </NavLink>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        !isCollapsed && setOpen(isOpen ? null : menu.id)
                      }
                      className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive ? "bg-emerald-50 text-emerald-600" : "text-slate-700 hover:bg-slate-100"}
                      ${isCollapsed ? "md:justify-center" : "justify-between"}`}
                    >
                      <div
                        className={`flex items-center ${isCollapsed ? "" : "gap-3"}`}
                      >
                        <div className="w-5 h-5 flex items-center justify-center shrink-0">
                          <Icon size={18} />
                        </div>
                        {!isCollapsed && <span>{menu.name}</span>}
                      </div>
                      {!isCollapsed && (
                        <ChevronIcon
                          size={14}
                          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        />
                      )}
                    </button>

                    {!isCollapsed && isOpen && (
                      <div className="ml-8 mt-1 space-y-1 border-l border-slate-200 pl-3">
                        {menu.children.map((sub) => (
                          <NavLink
                            key={sub.id}
                            to={sub.route}
                            className={({ isActive }) =>
                              `block text-sm py-1.5 px-3 rounded-md transition-all duration-200 font-medium
                              ${isActive ? "bg-emerald-100 text-emerald-700" : "text-slate-800 hover:bg-emerald-50 hover:text-emerald-700"}`
                            }
                          >
                            {sub.name}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </nav>

        {/* FOOTER: Tetap di dasar, tidak ikut tergulung menu */}
        <div className="p-4 border-t border-slate-50 mt-auto">
          {!isCollapsed ? (
            <div className="bg-slate-900 rounded-xl p-3 text-white shadow-sm">
              <p className="text-[10px] font-bold opacity-60">Version 2.4.0</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest leading-none">
                  Sistem Online
                </p>
              </div>
            </div>
          ) : (
            /* Mode Collapsed: Tanda titik kecil/indikator saja */
            <div className="flex justify-center py-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
