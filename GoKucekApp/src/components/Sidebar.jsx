import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { icons } from "../utils/Icons";

export default function Sidebar() {
  const { menus } = useAuth();
  const [open, setOpen] = useState(null);
  const location = useLocation();

  const ChevronIcon = icons.chevron;

  useEffect(() => {
    const parent = menus.find((m) =>
      m.children?.some((c) => c.route === location.pathname),
    );
    if (parent) setOpen(parent.id);
  }, [location.pathname, menus]);

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-100 flex flex-col transition-all duration-300">
      {/* Brand Header Section */}
      <div className="p-5 mb-4">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="bg-slate-50 rounded-xl p-1.5 flex-shrink-0 border border-slate-100 shadow-inner">
            <img
              src={localStorage.getItem("tenant_logo_path")}
              alt="Logo"
              className="w-9 h-9 object-contain grayscale-[0.2] hover:grayscale-0 transition-all"
            />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-[13px] font-extrabold text-slate-800 truncate leading-tight uppercase tracking-tight">
              {localStorage.getItem("tenant_name") || "GoKucek"}
            </h1>
          </div>
        </div>
      </div>

      {/* Navigation Container */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-4 opacity-70">
          Menu Utama
        </p>

        {menus.map((menu) => {
          const Icon = icons[menu.icon];
          const hasChild = menu.children?.length > 0;
          const isActive =
            menu.route === location.pathname ||
            menu.children?.some((c) => c.route === location.pathname);
          const isOpen = open === menu.id;

          const baseItemClass = `group flex items-center justify-between px-4 py-3 rounded-xl text-[12px] transition-all duration-300 cursor-pointer mb-1.5 relative overflow-hidden`;
          const activeItemClass = `bg-primary-500 text-white shadow-lg shadow-primary-100 font-bold translate-x-1`;
          const inactiveItemClass = `text-slate-500 hover:bg-primary-50 hover:text-primary-700 hover:translate-x-1`;

          return (
            <div key={menu.id} className="relative px-1">
              {!hasChild ? (
                <NavLink
                  to={menu.route}
                  className={({ isActive }) =>
                    `${baseItemClass} ${isActive ? activeItemClass : inactiveItemClass}`
                  }
                >
                  <div className="flex items-center gap-3.5 relative z-10">
                    {Icon && (
                      <Icon
                        size={19}
                        className={
                          location.pathname === menu.route
                            ? "text-white"
                            : "text-slate-400 group-hover:text-primary-600 transition-colors"
                        }
                      />
                    )}
                    <span className="tracking-wide">{menu.name}</span>
                  </div>
                </NavLink>
              ) : (
                <>
                  <button
                    onClick={() => setOpen(isOpen ? null : menu.id)}
                    className={`w-full ${baseItemClass} ${
                      isActive && !isOpen
                        ? activeItemClass
                        : isOpen
                          ? "bg-slate-50 text-slate-800 font-bold border-l-4 border-primary-500 rounded-l-none"
                          : inactiveItemClass
                    }`}
                  >
                    <div className="flex items-center gap-3.5 relative z-10">
                      {Icon && (
                        <Icon
                          size={19}
                          className={
                            isActive && !isOpen
                              ? "text-white"
                              : "text-slate-400 group-hover:text-primary-600"
                          }
                        />
                      )}
                      <span className="tracking-wide">{menu.name}</span>
                    </div>
                    {ChevronIcon && (
                      <ChevronIcon
                        size={12}
                        className={`transition-transform duration-300 relative z-10 ${
                          isOpen
                            ? "rotate-180 text-primary-600"
                            : "text-slate-400"
                        } ${isActive && !isOpen ? "text-white" : ""}`}
                      />
                    )}
                  </button>

                  {/* Dropdown Sub-menu dengan transisi yang lebih smooth */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                      isOpen
                        ? "max-h-[500px] opacity-100 mb-4 mt-2"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="ml-7 border-l border-slate-200 space-y-1">
                      {menu.children.map((sub) => {
                        const isSubActive = location.pathname === sub.route;
                        return (
                          <NavLink
                            key={sub.id}
                            to={sub.route}
                            className={`block pl-6 py-2.5 text-[11px] transition-all relative
                            ${
                              isSubActive
                                ? "text-primary-600 font-bold"
                                : "text-slate-500 hover:text-primary-600 hover:pl-8"
                            }`}
                          >
                            {isSubActive && (
                              <div className="absolute left-[-1.5px] top-1/2 -translate-y-1/2 w-[3px] h-4 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            )}
                            {sub.name}
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Sidebar - Design yang lebih Clean */}
      <div className="p-4 mt-auto">
        <div className="bg-gradient-to-br from-primary-900 to-slate-900 rounded-2xl p-5 text-white relative overflow-hidden group shadow-xl">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-white/20 rounded-md flex items-center justify-center backdrop-blur-sm">
                <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
              </div>
              <p className="text-[10px] text-primary-100 font-bold uppercase tracking-widest opacity-80">
                Pro Plan
              </p>
            </div>
            <p className="text-[12px] font-bold mb-3 tracking-tight">
              Masa Aktif Hampir Habis
            </p>
            <div className="w-full bg-white/10 h-1 rounded-full mb-3">
              <div className="bg-primary-500 h-full w-[85%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            </div>
            <button className="w-full bg-primary-500 hover:bg-primary-400 text-white transition-all py-2 rounded-xl text-[10px] font-bold shadow-lg shadow-black/20">
              Perpanjang Sekarang
            </button>
          </div>
          {/* Efek dekorasi cahaya belakang */}
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary-500/10 rounded-full blur-3xl group-hover:bg-primary-500/20 transition-all duration-700"></div>
        </div>
      </div>
    </aside>
  );
}
