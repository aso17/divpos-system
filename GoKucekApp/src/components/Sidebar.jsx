import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { icons } from "../utils/Icons";

export default function Sidebar() {
  const { menus } = useAuth();
  const [open, setOpen] = useState(null);
  const location = useLocation();

  // Ambil ikon chevron dari utils
  const ChevronIcon = icons.chevron;

  useEffect(() => {
    const parent = menus.find((m) =>
      m.children?.some((c) => c.route === location.pathname),
    );
    if (parent) setOpen(parent.id);
  }, [location.pathname, menus]);

  return (
    <aside className="w-56 min-h-screen bg-[#244E87] text-white rounded-tr-3xl shadow-xl flex flex-col">
      {/* Header */}
      <div className="px-6 py-8 flex items-center gap-3">
        <div className="bg-white rounded-lg p-1.5 flex-shrink-0">
          <img
            src={localStorage.getItem("project_logo_path")}
            alt="GoKucek"
            className="w-7 h-7 object-contain"
          />
        </div>
        <div className="leading-tight">
          <h1 className="text-sm font-bold">GoKucek</h1>
          <p className="text-[10px] text-white/60 font-medium">versi 1.0</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {menus.map((menu) => {
          const Icon = icons[menu.icon];
          const hasChild = menu.children?.length > 0;
          const isActive =
            menu.route === location.pathname ||
            menu.children?.some((c) => c.route === location.pathname);
          const isOpen = open === menu.id;

          return (
            <div key={menu.id} className="px-3 relative">
              {!hasChild ? (
                <NavLink
                  to={menu.route}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs transition-all relative
                    ${
                      isActive
                        ? "bg-white/15 text-white font-bold"
                        : "text-white/80 hover:bg-white/10"
                    }`
                  }
                >
                  {location.pathname === menu.route && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  )}

                  {Icon && <Icon size={18} className="text-white" />}
                  <span>{menu.name}</span>
                </NavLink>
              ) : (
                <>
                  <button
                    onClick={() => setOpen(isOpen ? null : menu.id)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs transition-all relative
                    ${
                      isActive
                        ? "bg-white/15 text-white font-bold"
                        : "text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                    )}

                    <div className="flex items-center gap-3">
                      {Icon && <Icon size={18} className="text-white" />}
                      <span>{menu.name}</span>
                    </div>

                    {/* Tambahkan Ikon Dropdown di sini */}
                    {ChevronIcon && (
                      <ChevronIcon
                        size={14}
                        className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                      />
                    )}
                  </button>

                  {isOpen && (
                    <div className="ml-8 mt-1 space-y-1 border-l border-white/10">
                      {menu.children.map((sub) => {
                        const isSubActive = location.pathname === sub.route;
                        return (
                          <NavLink
                            key={sub.id}
                            to={sub.route}
                            className={`block px-4 py-2 rounded-lg text-xs transition-all
                            ${
                              isSubActive
                                ? "text-cyan-400 font-bold"
                                : "text-white/60 hover:text-white"
                            }`}
                          >
                            {sub.name}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
