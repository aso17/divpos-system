import {
  Menu,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Bell,
  Search,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
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

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate("/login");
  };

  useEffect(() => {
    const storedUser = GetWithExpiry("user");
    if (storedUser?.avatar) {
      setAvatar(assetUrl(`${storedUser.avatar}`));
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
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-40">
      {/* LEFT SECTION */}
      <div className="flex items-center gap-6 flex-1">
        <button
          onClick={onToggleSidebar}
          className="p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-primary-50 hover:text-primary-600 transition-all border border-slate-100 active:scale-95"
        >
          <Menu size={20} />
        </button>

        {/* Search Bar - Menambah kesan Dashboard Premium */}
        <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl w-full max-w-xs focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all group">
          <Search
            size={18}
            className="text-slate-400 group-focus-within:text-primary-500"
          />
          <input
            type="text"
            placeholder="Cari orderan..."
            className="bg-transparent border-none outline-none text-sm text-slate-600 w-full placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-4">
        {/* Notifikasi */}
        <button className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-primary-600 transition-all relative">
          <Bell size={20} />
          <span className="absolute top-2.5 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-8 w-px bg-slate-100 mx-2" />

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl cursor-pointer select-none hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
          >
            <div className="relative">
              <img
                src={avatar}
                className="w-10 h-10 rounded-xl object-cover shadow-sm border border-slate-200"
                alt="avatar"
              />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-primary-500 border-2 border-white rounded-full shadow-sm"></div>
            </div>

            <div className="hidden sm:block text-left">
              <p className="text-sm font-bold text-slate-800 leading-none">
                {user?.full_name || "Admin GoKucek"}
              </p>
              <p className="text-[10px] font-bold text-primary-600 uppercase tracking-tighter mt-1">
                {user?.role || "Staff Manager"}
              </p>
            </div>

            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform duration-300 ${
                open ? "rotate-180 text-primary-600" : ""
              }`}
            />
          </div>

          {/* Dropdown Menu Box */}
          <div
            className={`absolute right-0 top-[calc(100%+12px)] w-56 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden transform transition-all duration-300 origin-top-right
              ${
                open
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
              }
            `}
          >
            <div className="p-4 border-b border-slate-50 bg-slate-50/50">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Akun Anda
              </p>
              <p className="text-sm font-bold text-slate-800 truncate">
                {user?.email || "admin@gokucek.com"}
              </p>
            </div>

            <div className="p-2">
              <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-700 rounded-xl transition-colors group">
                <User
                  size={18}
                  className="text-slate-400 group-hover:text-primary-600"
                />{" "}
                Profil Saya
              </button>
              <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-700 rounded-xl transition-colors group">
                <Settings
                  size={18}
                  className="text-slate-400 group-hover:text-primary-600"
                />{" "}
                Pengaturan
              </button>
            </div>

            <div className="p-2 border-t border-slate-50">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors font-bold"
              >
                <LogOut size={18} /> Keluar Aplikasi
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
