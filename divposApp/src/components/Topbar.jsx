import {
  LogOut,
  User,
  Settings,
  ChevronDown,
  Bell,
  Search,
  CheckCircle2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { assetUrl } from "../utils/Url";
import { GetWithExpiry } from "../utils/Storage";

export default function Topbar() {
  const [open, setOpen] = useState(false);
  const { logout, user } = useAuth();
  const dropdownRef = useRef(null);
  const [avatar, setAvatar] = useState(null);
  const [roleName, setRoleName] = useState(null);
  const [fullName, setFullName] = useState(null);

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
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 shadow-sm">
      {/* LEFT SECTION */}
      <div className="flex items-center gap-4 flex-1">
        {/* Search - Desktop Only */}
        <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl w-full max-w-sm focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all group">
          <Search
            size={16}
            className="text-slate-400 group-focus-within:text-emerald-500 transition-colors"
          />
          <input
            type="text"
            placeholder="Cari transaksi, produk, pelanggan..."
            className="bg-transparent border-none outline-none text-sm text-slate-600 w-full placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-3">
        {/* Notification */}
        <button className="p-2 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 border-2 border-white rounded-full animate-pulse"></span>
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-slate-200" />

        {/* Profile */}
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => setOpen(!open)}
            className={`flex items-center gap-2 p-1 rounded-xl cursor-pointer transition border
              ${
                open
                  ? "bg-emerald-50 border-emerald-100"
                  : "border-transparent hover:bg-slate-50"
              }`}
          >
            <div className="relative">
              <img
                src={avatar}
                className={`w-9 h-9 rounded-lg object-cover border-2 transition
                  ${open ? "border-emerald-500" : "border-white"}`}
                alt="User Avatar"
              />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>

            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-800 leading-none">
                {fullName || "Divpos Admin"}
              </p>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">
                {roleName || "Owner"}
              </p>
            </div>

            <ChevronDown
              size={14}
              className={`text-slate-400 transition ${
                open ? "rotate-180 text-emerald-600" : ""
              }`}
            />
          </div>

          {/* Dropdown */}
          <div
            className={`absolute right-0 top-[calc(100%+10px)] w-60 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden transform transition-all origin-top-right
              ${
                open
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 -translate-y-3 pointer-events-none"
              }`}
          >
            <div className="p-4 border-b border-slate-50">
              <p className="text-sm font-semibold text-slate-800">
                {user?.full_name}
              </p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>

            <div className="p-2">
              <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition">
                <User size={16} />
                Profil Akun
              </button>

              <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition">
                <Settings size={16} />
                Pengaturan
              </button>
            </div>

            <div className="p-2 border-t border-slate-50">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition font-semibold"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
