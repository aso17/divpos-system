import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { icons } from "../utils/Icons";
import { GetWithExpiry } from "../utils/Storage";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import LayoutGrid from "lucide-react/dist/esm/icons/layout-grid";
import Menu from "lucide-react/dist/esm/icons/menu";
import X from "lucide-react/dist/esm/icons/x";
import Zap from "lucide-react/dist/esm/icons/zap";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Bell from "lucide-react/dist/esm/icons/bell";
import LogOut from "lucide-react/dist/esm/icons/log-out";
import User from "lucide-react/dist/esm/icons/user";
import Settings from "lucide-react/dist/esm/icons/settings";

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const { menus, logout, user } = useAuth();
  const [open, setOpen] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  const projectName = GetWithExpiry("app")?.appName || "Divpos";
  const iconPath = GetWithExpiry("app")?.icon || null;
  const ChevronIcon = icons.chevron || ChevronDown;

  const [avatar, setAvatar] = useState(null);
  const [roleName, setRoleName] = useState(null);
  const [fullName, setFullName] = useState(null);

  useEffect(() => {
    const storedUser = GetWithExpiry("user");
    setRoleName(storedUser?.role?.name || "");
    setFullName(storedUser?.full_name || "");
    setAvatar(storedUser?.avatar);
  }, [user]);

  const initials = fullName
    ? fullName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "U";

  useEffect(() => {
    const parent = menus.find((m) =>
      m.children?.some((c) => c.route === location.pathname)
    );
    if (parent) setOpen(parent.id);
    setIsMobileOpen(false);
    setUserMenuOpen(false);
    setNotifOpen(false);
  }, [location.pathname, menus]);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target))
        setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
  };

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const sidebarW = isCollapsed ? "lg:w-[72px]" : "lg:w-60";

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════
          TOPBAR — mobile & tablet (< lg)

          FIX 1: h-14 (56px) → h-[60px] — tap target lebih nyaman
          FIX 2: burger w-9 h-9 (36px) → w-10 h-10 (40px)
          FIX 3: Mobile — brand = teks saja, tanpa icon, absolute center
          FIX 4: Tablet (sm+) — burger kiri, brand teks langsung sebelahnya
                 (bukan absolute center), user chip kanan
      ════════════════════════════════════════════════════════════════ */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 h-[60px] bg-white
        border-b border-gray-100 shadow-sm flex items-center px-4 gap-3 z-40"
      >
        {/* Hamburger — FIX: 40×40px, semua breakpoint */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
            text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
          aria-label="Buka menu"
        >
          <Menu size={22} />
        </button>

        {/* ── Brand ──────────────────────────────────────────────────────
            Mobile (< sm): absolute center, teks saja — tanpa icon
            Tablet (sm–lg): inline kiri setelah burger, teks saja — tanpa icon
        ────────────────────────────────────────────────────────────── */}

        {/* Mobile: absolute center, teks saja */}
        <div className="sm:hidden absolute left-1/2 -translate-x-1/2 pointer-events-none">
          <span
            className="font-extrabold text-[15px] tracking-tight
            bg-gradient-to-r from-emerald-700 to-green-500 bg-clip-text text-transparent"
          >
            {projectName}
          </span>
        </div>

        {/* Tablet: inline kiri setelah burger — teks saja tanpa icon */}
        <span
          className="hidden sm:block font-extrabold text-[15px] tracking-tight
          bg-gradient-to-r from-emerald-700 to-green-500 bg-clip-text text-transparent
          flex-shrink-0"
        >
          {projectName}
        </span>

        {/* Right: notif + divider + user */}
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          {/* Notification */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                setUserMenuOpen(false);
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center relative transition-colors
                ${
                  notifOpen
                    ? "bg-emerald-50 text-emerald-600"
                    : "text-gray-400 hover:bg-gray-50 hover:text-emerald-600"
                }`}
              aria-label="Notifikasi"
            >
              <Bell size={18} />
              <span
                className="absolute top-2 right-2 w-2 h-2 bg-emerald-500
                rounded-full border-2 border-white animate-pulse"
              />
            </button>

            {/* Notif dropdown */}
            <div
              className={`absolute right-0 top-[calc(100%+8px)] w-72 bg-white
              border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden
              transform transition-all duration-200 origin-top-right
              ${
                notifOpen
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
              }`}
            >
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-800">Notifikasi</p>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  3 baru
                </span>
              </div>
              <div className="py-1">
                {[
                  {
                    title: "Transaksi baru masuk",
                    sub: "INV-0384 · Budi Santoso",
                    time: "2m lalu",
                    dot: "bg-emerald-500",
                  },
                  {
                    title: "Antrian pickup siap",
                    sub: "27 item menunggu pickup",
                    time: "15m lalu",
                    dot: "bg-amber-400",
                  },
                  {
                    title: "Pembayaran belum lunas",
                    sub: "9 invoice jatuh tempo",
                    time: "1j lalu",
                    dot: "bg-red-400",
                  },
                ].map((n, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 px-4 py-3
                    hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <span
                      className={`w-2 h-2 ${n.dot} rounded-full flex-shrink-0 mt-1.5`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 truncate">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{n.sub}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">
                      {n.time}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-50 px-4 py-2.5">
                <button className="text-xs font-semibold text-emerald-600 w-full text-center">
                  Lihat semua →
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-gray-200" />

          {/* User */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setNotifOpen(false);
              }}
              className={`flex items-center gap-2 rounded-xl border transition-all duration-150
                ${
                  userMenuOpen
                    ? "bg-emerald-50 border-emerald-200 px-2 py-1"
                    : "border-transparent hover:bg-gray-50 px-1 py-1"
                }`}
              aria-label="Menu profil"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={fullName || "Avatar"}
                    className={`w-8 h-8 rounded-xl object-cover border-2 transition-colors
                      ${
                        userMenuOpen ? "border-emerald-400" : "border-gray-100"
                      }`}
                  />
                ) : (
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center
                    text-xs font-black transition-colors
                    ${
                      userMenuOpen
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {initials}
                  </div>
                )}
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5
                  bg-emerald-500 border-2 border-white rounded-full"
                />
              </div>

              {/* Nama + role — hanya di tablet (sm+) */}
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-gray-800 leading-tight max-w-[110px] truncate">
                  {fullName || "Admin"}
                </p>
                <p
                  className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest
                  leading-none mt-0.5"
                >
                  {roleName || "Owner"}
                </p>
              </div>

              <ChevronDown
                size={12}
                strokeWidth={2.5}
                className={`hidden sm:block text-gray-400 flex-shrink-0
                  transition-transform duration-200
                  ${userMenuOpen ? "rotate-180 text-emerald-600" : ""}`}
              />
            </button>

            {/* User dropdown */}
            <div
              className={`absolute right-0 top-[calc(100%+8px)] w-52 bg-white
              border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden
              transform transition-all duration-200 origin-top-right
              ${
                userMenuOpen
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
              }`}
            >
              <div
                className="px-4 py-3 border-b border-gray-50 bg-gray-50/50
                flex items-center gap-2.5"
              >
                <div
                  className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center
                  justify-center text-xs font-black text-white flex-shrink-0"
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">
                    {fullName || "Admin"}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">
                    {user?.email || "-"}
                  </p>
                </div>
              </div>
              <div className="p-1.5">
                <button
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm
                  text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl
                  transition-colors font-medium"
                >
                  <User size={14} strokeWidth={2} /> Profil Akun
                </button>
                <button
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm
                  text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl
                  transition-colors font-medium"
                >
                  <Settings size={14} strokeWidth={2} /> Pengaturan
                </button>
              </div>
              <div className="p-1.5 border-t border-gray-50">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-500
                    hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors font-semibold"
                >
                  <LogOut size={14} strokeWidth={2} /> Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          SIDEBAR PANEL (logic TIDAK DIUBAH)
      ════════════════════════════════════════════════════════════════ */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 flex flex-col
        bg-white border-r border-gray-100
        transition-all duration-300 ease-in-out
        w-72
        lg:sticky lg:top-0 lg:h-screen lg:flex-shrink-0
        ${sidebarW}
        ${
          isMobileOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full lg:translate-x-0"
        }
      `}
      >
        {/* Logo */}
        <div
          className={`flex items-center border-b border-gray-100 transition-all duration-300
          ${
            isCollapsed
              ? "justify-center px-0 py-4 h-16"
              : "gap-3 px-4 py-4 h-16"
          }`}
        >
          <div className="p-1 rounded-xl bg-white border border-gray-100 shadow-inner flex-shrink-0">
            <div
              className="p-1.5 rounded-lg bg-gradient-to-tr from-emerald-600 to-green-500
              text-white shadow-sm shadow-emerald-500/20"
            >
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

          {!isCollapsed && (
            <div className="min-w-0">
              <h1
                className="text-base font-extrabold tracking-tight
                bg-gradient-to-r from-emerald-700 to-green-500 bg-clip-text text-transparent
                leading-none truncate"
              >
                {projectName}
              </h1>
              <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mt-0.5">
                System v1.0
              </p>
            </div>
          )}

          <button
            onClick={() => setIsMobileOpen(false)}
            className="ml-auto lg:hidden w-7 h-7 rounded-lg flex items-center justify-center
              text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Tutup menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapse}
          className="hidden lg:flex absolute -right-3.5 top-[22px] w-7 h-7 bg-white
            border border-gray-200 rounded-full items-center justify-center text-gray-400
            hover:text-emerald-600 hover:border-emerald-300 shadow-sm transition-all z-10"
          aria-label={isCollapsed ? "Perluas" : "Ciutkan"}
        >
          {isCollapsed ? (
            <ChevronRight size={13} strokeWidth={2.5} />
          ) : (
            <ChevronLeft size={13} strokeWidth={2.5} />
          )}
        </button>

        {/* Section label */}
        {!isCollapsed && (
          <div className="px-5 pt-5 pb-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.12em]">
              Menu Utama
            </span>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
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
                    title={isCollapsed ? menu.name : undefined}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-xl text-sm font-semibold
                      transition-all duration-150
                      ${
                        isCollapsed
                          ? "justify-center px-0 py-3 mx-0.5"
                          : "px-3 py-2.5"
                      }
                      ${
                        isActive
                          ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`
                    }
                  >
                    {({ isActive: navActive }) => (
                      <>
                        <Icon
                          size={18}
                          strokeWidth={navActive ? 2.5 : 2}
                          className="flex-shrink-0"
                        />
                        {!isCollapsed && (
                          <span className="truncate">{menu.name}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        !isCollapsed && setOpen(isOpen ? null : menu.id)
                      }
                      title={isCollapsed ? menu.name : undefined}
                      className={`w-full group flex items-center gap-3 rounded-xl text-sm
                        font-semibold transition-all duration-150
                        ${
                          isCollapsed
                            ? "justify-center px-0 py-3 mx-0.5"
                            : "px-3 py-2.5 justify-between"
                        }
                        ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                    >
                      <div
                        className={`flex items-center gap-3 min-w-0
                        ${isCollapsed ? "justify-center" : ""}`}
                      >
                        <Icon
                          size={18}
                          strokeWidth={isActive ? 2.5 : 2}
                          className={`flex-shrink-0 ${
                            isActive ? "text-emerald-600" : ""
                          }`}
                        />
                        {!isCollapsed && (
                          <span className="truncate">{menu.name}</span>
                        )}
                      </div>
                      {!isCollapsed && (
                        <ChevronIcon
                          size={14}
                          strokeWidth={2}
                          className={`flex-shrink-0 text-gray-400 transition-transform duration-200
                            ${isOpen ? "rotate-180 text-emerald-600" : ""}`}
                        />
                      )}
                    </button>

                    {!isCollapsed && isOpen && (
                      <div className="ml-4 mt-0.5 pl-3 border-l-2 border-emerald-100 space-y-0.5">
                        {menu.children.map((sub) => (
                          <NavLink
                            key={sub.id}
                            to={sub.route}
                            className={({ isActive }) =>
                              `flex items-center gap-2 text-sm py-2 px-3 rounded-xl
                              transition-all duration-150
                              ${
                                isActive
                                  ? "bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-200"
                                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800 font-medium"
                              }`
                            }
                          >
                            {({ isActive: subActive }) => (
                              <>
                                <span
                                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                                  ${subActive ? "bg-white" : "bg-gray-300"}`}
                                />
                                <span className="truncate">{sub.name}</span>
                              </>
                            )}
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

      {/* Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* FIX: spacer juga naik jadi h-[60px] — konsisten dengan topbar */}
      <div className="lg:hidden h-[60px] flex-shrink-0" />
    </>
  );
}
