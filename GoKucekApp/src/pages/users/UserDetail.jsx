import React from "react";
import { X } from "lucide-react";
import { assetUrl } from "../../utils/Url";
export default function UserDetail({ open, user, onClose }) {
  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            User Detail
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-rose-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="flex flex-col items-center pb-4 border-b border-dashed">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl mb-2 border-2 border-white shadow-sm uppercase">
              {user.avatar ? (
                <img
                  src={assetUrl(user.avatar)}
                  className="w-full h-full rounded-full object-cover"
                  alt="avatar"
                />
              ) : (
                user.full_name?.charAt(0) || "?"
              )}
            </div>
            <h4 className="font-bold text-slate-800 uppercase text-sm">
              {user.full_name}
            </h4>
            <span className="text-xxs px-2 py-0.5 bg-blue-600 text-white rounded-full uppercase font-semibold">
              {user.role?.role_name || user.role?.name || "No Role"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xxs">
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
        <div className="px-4 py-3 bg-slate-50 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 text-slate-600 rounded text-xxs font-bold hover:bg-slate-100 transition-all uppercase"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// Sub-komponen tetap di dalam file yang sama (internal) agar praktis
function DetailItem({ label, value, isStatus, active }) {
  return (
    <div>
      <p className="text-slate-400 uppercase font-semibold mb-1">{label}</p>
      {isStatus ? (
        <span
          className={`px-2 py-0.5 rounded text-white ${
            active ? "bg-emerald-500" : "bg-rose-500"
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
