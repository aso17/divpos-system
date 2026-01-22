import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { icons } from "../utils/Icons";

export default function Sidebar() {
  const { menus } = useAuth();
  const [open, setOpen] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const parent = menus.find((m) =>
      m.children?.some((c) => c.route === location.pathname),
    );
    if (parent) setOpen(parent.id);
  }, [location.pathname, menus]);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col font-sans">
      {/* Brand Header */}
      <div className="flex flex-col items-center py-6 border-b border-slate-100">
        <div className="p-3 rounded-xl bg-slate-50 mb-2">
          <img
            src={localStorage.getItem("project_logo_path")}
            alt="Project Logo"
            className="w-10 h-10 object-contain"
          />
        </div>
        <span className="text-[11px] tracking-wider uppercase text-slate-500 font-bold">
          RadiusOne v1.0
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
        {menus.map((menu) => {
          const Icon = icons[menu.icon];
          const Chevron = icons.chevron;
          const hasChild = menu.children?.length > 0;
          const isChildActive = hasChild
            ? menu.children.some((c) => c.route === location.pathname)
            : false;
          const isActive = menu.route === location.pathname || isChildActive;
          const isOpen = open === menu.id;

          return (
            <div key={menu.id} className="relative">
              {!hasChild ? (
                <NavLink
                  to={menu.route}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs transition-all duration-200
                    ${
                      isActive
                        ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-200"
                        : "text-slate-700 hover:bg-slate-100 font-semibold"
                    }`
                  }
                >
                  {Icon && (
                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={isActive ? "text-white" : "text-slate-500"}
                    />
                  )}
                  <span>{menu.name}</span>
                </NavLink>
              ) : (
                <div className="space-y-1">
                  <button
                    onClick={() => setOpen(isOpen ? null : menu.id)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs transition-all duration-200
                    ${
                      isActive
                        ? "bg-slate-100 text-blue-700 font-bold"
                        : "text-slate-700 hover:bg-slate-50 font-semibold"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {Icon && (
                        <Icon
                          size={18}
                          strokeWidth={isActive ? 2.5 : 2}
                          className={
                            isActive ? "text-blue-600" : "text-slate-500"
                          }
                        />
                      )}
                      <span>{menu.name}</span>
                    </div>
                    {Chevron && (
                      <Chevron
                        size={14}
                        strokeWidth={2.5}
                        className={`transition-transform duration-300 ${
                          isOpen ? "rotate-180 text-blue-600" : "text-slate-400"
                        }`}
                      />
                    )}
                  </button>

                  {/* Submenu */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="ml-6 mt-1 border-l-2 border-slate-100 space-y-1">
                      {menu.children.map((sub) => {
                        const isSubActive = location.pathname === sub.route;
                        return (
                          <NavLink
                            key={sub.id}
                            to={sub.route}
                            className={`flex items-center gap-3 pl-5 py-2 rounded-md text-xs transition-all
                              ${
                                isSubActive
                                  ? "text-blue-600 font-bold bg-blue-50"
                                  : "text-slate-500 hover:text-slate-900 font-semibold"
                              }`}
                          >
                            <span
                              className={
                                isSubActive
                                  ? "translate-x-1 transition-transform"
                                  : ""
                              }
                            >
                              {sub.name}
                            </span>
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
