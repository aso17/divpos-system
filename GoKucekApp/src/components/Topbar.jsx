import { Menu, LogOut, User, Settings, ChevronDown } from "lucide-react";
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
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      {/* LEFT */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* RIGHT */}
      <div className="relative" ref={dropdownRef}>
        {/* Trigger (simple, bukan button style) */}
        <div
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <img
            src={avatar}
            className="w-8 h-8 rounded-full object-cover"
            alt="avatar"
          />
          <span className="text-sm font-medium">
            {user?.full_name || "User"}
          </span>
          <ChevronDown
            size={14}
            className={`text-slate-500 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>

        {/* Dropdown Menu */}
        <div
          className={`absolute right-0 top-full mt-2 w-44 bg-white border rounded-lg shadow-lg z-50
            transform transition-all duration-200 ease-out
            ${
              open
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-1 pointer-events-none"
            }
          `}
        >
          <button className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100">
            <User size={16} /> Profil
          </button>
          <div className="h-px bg-gray-200 my-1" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </header>
  );
}
