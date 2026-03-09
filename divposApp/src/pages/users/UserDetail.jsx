import React from "react";
import { X } from "lucide-react";

export default function UserDetail({ open, user, onClose }) {
  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden 
      bg-white/95 backdrop-blur border border-emerald-100 
      shadow-[0_10px_40px_rgba(0,0,0,0.15)]
      animate-in fade-in zoom-in duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-emerald-50 bg-gradient-to-r from-emerald-50 to-white">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">
            User Detail
          </h3>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center pb-5 border-b border-dashed border-slate-200">
            <div
              className="w-16 h-16 rounded-full 
            bg-gradient-to-tr from-emerald-600 to-emerald-400
            flex items-center justify-center 
            text-white font-bold text-xl 
            border-4 border-white shadow-lg uppercase"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  className="w-full h-full rounded-full object-cover"
                  alt="avatar"
                />
              ) : (
                user.full_name?.charAt(0) || "?"
              )}
            </div>

            <h4 className="font-bold text-slate-800 uppercase text-sm mt-2 tracking-wide">
              {user.full_name}
            </h4>

            <span
              className="mt-1 text-[10px] px-3 py-1 
            bg-emerald-500 text-white 
            rounded-full uppercase font-semibold tracking-wide
            shadow-sm"
            >
              {user.role?.role_name || user.role?.name || "No Role"}
            </span>
          </div>

          {/* Detail */}
          <div className="grid grid-cols-2 gap-4 text-[11px]">
            <DetailItem label="Username" value={user.username} />
            <DetailItem label="Email" value={user.email} />
            <DetailItem label="Phone" value={user.phone} />
            <DetailItem label="Tenant" value={user.tenant?.name || "-"} />

            <DetailItem
              label="Status"
              value={user.is_active ? "Active" : "Inactive"}
              isStatus
              active={user.is_active}
            />

            <DetailItem
              label="Created At"
              value={
                user.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : "-"
              }
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[11px] font-semibold 
            bg-white border border-slate-200 
            rounded-lg text-slate-600
            hover:bg-slate-100 transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, isStatus, active }) {
  return (
    <div>
      <p className="text-slate-400 uppercase font-semibold mb-1 text-[10px] tracking-wide">
        {label}
      </p>

      {isStatus ? (
        <span
          className={`px-2.5 py-0.5 rounded-full text-white text-[10px] font-semibold ${
            active ? "bg-emerald-500 shadow-sm" : "bg-rose-500 shadow-sm"
          }`}
        >
          {value}
        </span>
      ) : (
        <p className="text-slate-700 font-medium truncate">{value || "-"}</p>
      )}
    </div>
  );
}
