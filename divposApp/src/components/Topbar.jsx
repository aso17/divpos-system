// Topbar.jsx
// Perubahan: Topbar hanya muncul di desktop (lg+)
// Di mobile & tablet digantikan oleh topbar dalam Sidebar.jsx
// Logic: TIDAK DIUBAH

import {
  LogOut,
  User,
  Settings,
  ChevronDown,
  Bell,
  Search,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { GetWithExpiry } from "../utils/Storage";

export default function Topbar({ isSidebarCollapsed }) {
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { logout, user } = useAuth();
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const [avatar, setAvatar] = useState(null);
  const [roleName, setRoleName] = useState(null);
  const [fullName, setFullName] = useState(null);

  // ── Logic TIDAK DIUBAH ────────────────────────────────────────────────────
  const handleLogout = async () => {
    await logout();
    setOpen(false);
  };

  useEffect(() => {
    const storedUser = GetWithExpiry("user");
    setRoleName(storedUser?.role?.name || "");
    setFullName(storedUser?.full_name || "");
    setAvatar(storedUser?.avatar);
  }, [user]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target))
        setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = fullName
    ? fullName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "U";

  // ── Topbar hanya tampil di desktop (lg+) ──────────────────────────────────
  // Di mobile & tablet, hamburger + brand ada di Sidebar.jsx
  return (
    <header
      className="hidden lg:flex h-14 bg-white border-b border-gray-100 shadow-sm
      items-center justify-between px-4 md:px-6 sticky top-0 z-30 flex-shrink-0"
    >
      {/* ── Search ── */}
      <div className="flex items-center flex-1 min-w-0 pr-4">
        <div
          className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2
          w-full max-w-sm focus-within:bg-white focus-within:border-emerald-400
          focus-within:ring-2 focus-within:ring-emerald-100 transition-all duration-150 group"
        >
          <Search
            size={14}
            className="text-gray-400 group-focus-within:text-emerald-500 flex-shrink-0 transition-colors"
          />
          <input
            type="text"
            placeholder="Cari transaksi, produk, pelanggan..."
            className="bg-transparent border-none outline-none text-sm text-gray-600 w-full
              placeholder:text-gray-300 font-medium"
          />
        </div>
      </div>

      {/* ── Right actions ── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Notification */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors
              ${notifOpen ? "bg-emerald-50 text-emerald-600" : "text-gray-400 hover:bg-gray-50 hover:text-emerald-600"}`}
            aria-label="Notifikasi"
          >
            <Bell size={17} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
          </button>

          {/* Notification dropdown */}
          <div
            className={`absolute right-0 top-[calc(100%+8px)] w-72 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden
            transform transition-all duration-200 origin-top-right
            ${notifOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}
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
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
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
                  <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">
                    {n.time}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-50 px-4 py-2.5">
              <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors w-full text-center">
                Lihat semua notifikasi →
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className={`flex items-center gap-2.5 px-2 py-1.5 rounded-xl border transition-all duration-150
              ${
                open
                  ? "bg-emerald-50 border-emerald-200"
                  : "border-transparent hover:bg-gray-50 hover:border-gray-200"
              }`}
            aria-expanded={open}
            aria-label="Menu profil"
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {avatar ? (
                <img
                  src={avatar}
                  alt={fullName || "Avatar"}
                  className={`w-8 h-8 rounded-xl object-cover border-2 transition-colors
                    ${open ? "border-emerald-400" : "border-gray-100"}`}
                />
              ) : (
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-colors
                  ${open ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"}`}
                >
                  {initials}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            <div className="hidden sm:block text-left min-w-0">
              <p className="text-xs font-bold text-gray-800 truncate leading-tight max-w-[120px]">
                {fullName || "Divpos Admin"}
              </p>
              <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest leading-none mt-0.5">
                {roleName || "Owner"}
              </p>
            </div>

            <ChevronDown
              size={13}
              strokeWidth={2.5}
              className={`text-gray-400 flex-shrink-0 transition-transform duration-200
                ${open ? "rotate-180 text-emerald-600" : ""}`}
            />
          </button>

          {/* Profile dropdown */}
          <div
            className={`absolute right-0 top-[calc(100%+8px)] w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden
            transform transition-all duration-200 origin-top-right
            ${open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}
          >
            <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-xs font-black text-white flex-shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">
                    {fullName || user?.full_name || "Admin"}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">
                    {user?.email || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-1.5">
              <button
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-600
                hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-colors font-medium"
              >
                <User size={15} strokeWidth={2} className="flex-shrink-0" />
                Profil Akun
              </button>
              <button
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-600
                hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-colors font-medium"
              >
                <Settings size={15} strokeWidth={2} className="flex-shrink-0" />
                Pengaturan
              </button>
            </div>

            <div className="p-1.5 border-t border-gray-50">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-500
                  hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors font-semibold"
              >
                <LogOut size={15} strokeWidth={2} className="flex-shrink-0" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
