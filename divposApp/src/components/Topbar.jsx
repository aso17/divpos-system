import {
  Menu,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Bell,
  Search,
  CheckCircle2,
} from "lucide-react";
import { useState, useRef, useEffect, use } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { assetUrl } from "../utils/Url";
import { GetWithExpiry } from "../utils/SetWithExpiry";

export default function Topbar({ onToggleSidebar }) {
  const [open, setOpen] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [avatar, setAvatar] = useState(null);
  const [roleName, setRoleName] = useState(null);

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate("/login");
  };
  // console.log("User di Topbar:", user);
  useEffect(() => {
    const storedUser = GetWithExpiry("user");
    setRoleName(storedUser?.role_name || "Owner");

    if (storedUser?.avatar) {
      setAvatar(storedUser.avatar);
    } else {
      setAvatar(assetUrl("default-avatar.png"));
    }
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
    <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 transition-all shadow-sm shadow-slate-200/20">
      {/* LEFT SECTION */}
      <div className="flex items-center gap-4 md:gap-6 flex-1">
        <button
          onClick={onToggleSidebar}
          className="p-2.5 rounded-xl bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100 shadow-sm active:scale-95 group"
          title="Toggle Sidebar"
        >
          <Menu
            size={20}
            className="group-hover:rotate-90 transition-transform duration-300" // Rotate 90 derajat lebih clean untuk menu
          />
        </button>

        {/* Search Bar - Lebih Premium */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-2xl w-full max-w-sm focus-within:ring-4 focus-within:ring-emerald-500/5 focus-within:border-emerald-500/40 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-emerald-100/20 transition-all group">
          <Search
            size={18}
            className="text-slate-400 group-focus-within:text-emerald-500 transition-colors"
          />
          <input
            type="text"
            placeholder="Cari transaksi, produk, atau pelanggan..."
            className="bg-transparent border-none outline-none text-[13px] font-medium text-slate-600 w-full placeholder:text-slate-400"
          />
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 bg-white px-1.5 font-sans text-[10px] font-bold text-slate-400 shadow-sm">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Notifikasi - Emerald Accent */}
        <button className="p-2.5 rounded-xl text-slate-400 hover:bg-emerald-50/50 hover:text-emerald-600 transition-all relative group border border-transparent hover:border-emerald-100">
          <Bell size={20} />
          <span className="absolute top-2.5 right-3 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm animate-pulse"></span>
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1 md:mx-2" />

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => setOpen(!open)}
            className={`flex items-center gap-3 p-1 rounded-2xl cursor-pointer select-none transition-all border
              ${open ? "bg-emerald-50/50 border-emerald-100 shadow-sm" : "border-transparent hover:bg-slate-50 hover:border-slate-100"}`}
          >
            <div className="relative">
              <img
                src={avatar}
                className={`w-9 h-9 md:w-10 md:h-10 rounded-xl object-cover shadow-sm border-2 transition-all duration-300
                  ${open ? "border-emerald-500 scale-105" : "border-white"}`}
                alt="User Avatar"
              />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></div>
            </div>

            <div className="hidden sm:block text-left">
              <p className="text-[13px] font-black text-slate-800 leading-none">
                {user?.full_name || "Divpos Admin"}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
                  {roleName || "Owner"}
                </p>
                <CheckCircle2 size={10} className="text-emerald-500" />
              </div>
            </div>

            <ChevronDown
              size={14}
              className={`text-slate-400 transition-all duration-300 mr-1 ${open ? "rotate-180 text-emerald-600" : ""}`}
            />
          </div>

          {/* Dropdown Menu Box - Lebih Mewah */}
          <div
            className={`absolute right-0 top-[calc(100%+12px)] w-64 bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl z-50 overflow-hidden transform transition-all duration-300 origin-top-right
              ${open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-4 pointer-events-none"}`}
          >
            {/* User Info Header */}
            <div className="p-5 border-b border-slate-50 bg-gradient-to-br from-emerald-50/30 to-white">
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-lg bg-white shadow-sm">
                  <img
                    src={avatar}
                    className="w-10 h-10 rounded-md object-cover"
                    alt="p"
                  />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[12px] font-black text-slate-800 truncate">
                    {user?.full_name}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 truncate lowercase italic">
                    {user?.email || "admin@divposapp.com"}{" "}
                    {/* Ganti ke Divpos */}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Links */}
            <div className="p-2">
              <button className="flex items-center gap-3 w-full px-4 py-3 text-[13px] font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all group">
                <div className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-white group-hover:shadow-sm transition-all text-slate-400 group-hover:text-emerald-600">
                  <User size={16} />
                </div>
                Profil Akun
              </button>
              <button className="flex items-center gap-3 w-full px-4 py-3 text-[13px] font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all group">
                <div className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-white group-hover:shadow-sm transition-all text-slate-400 group-hover:text-emerald-600">
                  <Settings size={16} />
                </div>
                Pengaturan Sistem
              </button>
            </div>

            {/* Logout Section */}
            <div className="p-2 border-t border-slate-50 bg-slate-50/50">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-[13px] text-red-500 hover:bg-red-50 rounded-xl transition-all font-black uppercase tracking-widest"
              >
                <div className="p-1.5 rounded-lg bg-red-100/50 text-red-600">
                  <LogOut size={16} />
                </div>
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
