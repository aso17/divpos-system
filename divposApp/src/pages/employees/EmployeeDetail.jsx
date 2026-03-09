import {
  X,
  UserCheck,
  ShieldAlert,
  Store,
  Phone,
  Briefcase,
} from "lucide-react";

export default function EmployeeDetail({ open, onClose, data }) {
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 p-4 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest">
              Detail Karyawan
            </h2>
            <p className="text-[10px] text-emerald-200">
              ID: {data.employee_code}
            </p>
          </div>

          <button
            onClick={onClose}
            className="hover:rotate-90 transition-transform text-emerald-100 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Status Badge */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              Status Bekerja
            </span>

            <span
              className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                data.is_active
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : "bg-rose-100 text-rose-600 border border-rose-200"
              }`}
            >
              {data.is_active ? "Aktif" : "Non-Aktif"}
            </span>
          </div>

          {/* Info Utama */}
          <div className="grid gap-4">
            <DetailItem
              icon={<UserCheck size={14} />}
              label="Nama Lengkap"
              value={data.full_name}
            />

            <DetailItem
              icon={<Phone size={14} />}
              label="No. WhatsApp"
              value={data.phone}
            />

            <DetailItem
              icon={<Briefcase size={14} />}
              label="Jabatan"
              value={data.job_title}
            />

            <DetailItem
              icon={<Store size={14} />}
              label="Outlet"
              value={data.outlet?.name || "Pusat / Global"}
            />
          </div>

          {/* Status Akses Login */}
          <div
            className={`mt-6 p-4 rounded-lg border ${
              data.user_id
                ? "bg-emerald-50 border-emerald-100"
                : "bg-amber-50 border-amber-100"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert
                size={14}
                className={data.user ? "text-emerald-600" : "text-amber-600"}
              />

              <span className="text-[10px] font-bold uppercase tracking-tight text-slate-600">
                Status Akses Sistem
              </span>
            </div>

            {data.user_id ? (
              <div className="space-y-1">
                <p className="text-[11px] text-slate-700">
                  Email:{" "}
                  <span className="font-bold text-emerald-700">
                    {data.email}
                  </span>
                </p>

                <p className="text-[11px] text-slate-700">
                  Role:{" "}
                  <span className="font-bold text-emerald-700">
                    {data.role?.name}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-amber-700 italic">
                Karyawan ini belum memiliki akun akses login sistem.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
        {icon}
      </div>

      <div>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
          {label}
        </p>

        <p className="text-xs font-semibold text-slate-700">{value || "-"}</p>
      </div>
    </div>
  );
}
