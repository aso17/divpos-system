import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { icons } from "../utils/Icons";
import { GetWithExpiry } from "../utils/Storage";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Menu,
  X,
  Zap,
} from "lucide-react";

export default function Sidebar() {
  const { menus } = useAuth();
  const [open, setOpen] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const projectName = GetWithExpiry("app")?.appName || "Divpos";
  let iconPath = GetWithExpiry("app")?.icon || null;
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
      {/* MOBILE TOPBAR */}
      <div className="md:hidden flex items-center justify-between px-4 h-16 bg-white border-b sticky top-0 z-40">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <Menu size={22} />
        </button>

        <h1 className="font-extrabold text-lg tracking-tighter text-slate-900 flex items-center gap-2.5">
          {/* CONTAINER IKON LOGO - Sama dengan desktop style */}
          <div className="relative p-1 rounded-xl bg-white border border-slate-100 shadow-inner">
            <div className="relative z-10 p-1.5 rounded-lg bg-gradient-to-tr from-emerald-600 to-green-500 text-white shadow-sm shadow-emerald-500/20">
              {iconPath ? (
                <img
                  src={iconPath}
                  alt="App Icon"
                  className="w-5 h-5 rounded-md object-cover"
                />
              ) : (
                <Zap size={16} strokeWidth={2.5} />
              )}
            </div>
          </div>

          {/* NAMA PROYEK - Sama dengan desktop style */}
          <span className="bg-gradient-to-r from-emerald-700 to-green-500 bg-clip-text text-transparent">
            {projectName}
          </span>
        </h1>

        {/* Placeholder untuk menjaga posisi tengah */}
        <div className="w-8" />
      </div>

      {/* SIDEBAR */}
      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-50
          bg-white border-r border-slate-100
          flex flex-col transition-all duration-300 ease-in-out

          w-72
          ${isCollapsed ? "md:w-20" : "md:w-60"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}

          shadow-xl md:shadow-none
        `}
      >
        {/* MOBILE CLOSE */}
        <div className="md:hidden flex justify-end p-4 h-16 items-center">
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* LOGO */}
        {/* LOGO CONTAINER */}
        <div className="p-3 border-b border-slate-100">
          {!isCollapsed ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 group">
                {/* LOGO ICON CONTAINER - Dibuat lebih rapat dan premium */}
                <div className="relative p-1.5 rounded-xl bg-white border border-slate-100 shadow-inner group-hover:shadow-lg transition-shadow duration-300">
                  <div className="relative z-10 p-1.5 rounded-lg bg-gradient-to-tr from-emerald-600 to-green-500 text-white shadow-sm shadow-emerald-500/20">
                    {iconPath ? (
                      <img
                        src={iconPath}
                        alt="App Icon"
                        className="w-5 h-5 rounded-md object-cover"
                      />
                    ) : (
                      <Zap size={16} strokeWidth={2.5} />
                    )}
                  </div>
                </div>

                {/* PROJECT NAME & SUBTITLE */}
                <div className="flex flex-col">
                  {/* Judul dengan Gradient Teks */}
                  <h1 className="text-lg font-extrabold tracking-tighter bg-gradient-to-r from-emerald-700 to-green-500 bg-clip-text text-transparent">
                    {projectName}
                  </h1>
                  <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase -mt-0.5">
                    System v1.0
                  </p>
                </div>
              </div>

              {/* GARIS PEMBATAS (DIVIDER) */}
              <div className="w-full h-px bg-slate-100" />
            </div>
          ) : (
            // ... (kondisi collapsed tetap sama)
            <div className="flex justify-center">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-400 text-white">
                <Zap size={20} />
              </div>
            </div>
          )}
        </div>

        {/* COLLAPSE BUTTON */}
        <button
          onClick={toggleCollapse}
          className="hidden md:flex absolute -right-3 top-8 w-6 h-6 bg-white border shadow-sm rounded-full items-center justify-center text-slate-400 hover:text-emerald-600 transition"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* NAVIGATION */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                      `flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all
                      ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-700 hover:bg-slate-50"
                      }
                      ${isCollapsed ? "md:justify-center" : "gap-3"}`
                    }
                  >
                    <Icon size={20} />
                    {!isCollapsed && <span>{menu.name}</span>}
                  </NavLink>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        !isCollapsed && setOpen(isOpen ? null : menu.id)
                      }
                      className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all
                        ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "text-slate-700 hover:bg-slate-50"
                        }
                        ${
                          isCollapsed ? "md:justify-center" : "justify-between"
                        }`}
                    >
                      <div
                        className={`flex items-center ${
                          isCollapsed ? "" : "gap-3"
                        }`}
                      >
                        <Icon size={20} />
                        {!isCollapsed && <span>{menu.name}</span>}
                      </div>

                      {!isCollapsed && (
                        <ChevronIcon
                          size={16}
                          className={`transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </button>

                    {!isCollapsed && isOpen && (
                      <div className="ml-8 mt-1 space-y-1 border-l border-slate-100 pl-3">
                        {menu.children.map((sub) => (
                          <NavLink
                            key={sub.id}
                            to={sub.route}
                            className={({ isActive }) =>
                              `block text-sm py-2 px-4 rounded-lg transition
                              ${
                                isActive
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "text-slate-600 hover:bg-slate-50"
                              }`
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
      </aside>

      {/* BACKDROP */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
        />
      )}
    </>
  );
}
