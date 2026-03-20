import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Star,
  Calendar,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// ── Helper ─────────────────────────────────────────────────────────────────────
function DetailRow({ icon: Icon, label, value, valueClass = "" }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <div
        className="w-6 h-6 flex-shrink-0 flex items-center justify-center
        bg-slate-50 rounded-lg mt-0.5"
      >
        <Icon size={12} className="text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
          {label}
        </p>
        <p
          className={`text-[11px] font-semibold text-slate-700 leading-tight break-words
          ${valueClass}`}
        >
          {value || (
            <span className="text-slate-300 italic font-normal">—</span>
          )}
        </p>
      </div>
    </div>
  );
}

export default function CustomerDetail({ open, onClose, customer }) {
  if (!open || !customer) return null;

  const genderLabel =
    customer.gender === "L"
      ? "Laki-laki"
      : customer.gender === "P"
      ? "Perempuan"
      : "—";

  return (
    <div
      className="fixed inset-0 z-50 backdrop-blur-sm bg-slate-900/40
      flex items-center justify-center p-4"
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden
        border border-slate-100 flex flex-col max-h-[95vh]"
      >
        {/* ── Header ── */}
        <div
          className="px-5 py-3 bg-gradient-to-r from-slate-50 to-white
          border-b flex justify-between items-center"
        >
          <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
            Detail Pelanggan
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-rose-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar space-y-4">
          {/* ── Avatar + nama + status ── */}
          <div
            className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl
            border border-dashed border-slate-200"
          >
            {/* Initials avatar */}
            <div
              className="w-14 h-14 rounded-full bg-emerald-100 flex items-center
              justify-center font-black text-emerald-700 text-lg flex-shrink-0
              border-2 border-white shadow-sm ring-1 ring-emerald-200"
            >
              {customer.name?.substring(0, 2).toUpperCase() || "??"}
            </div>

            <div className="flex-1 min-w-0">
              <h3
                className="text-sm font-black text-slate-800 uppercase
                leading-tight truncate"
              >
                {customer.name}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">{genderLabel}</p>

              {/* Status badge */}
              <div className="flex items-center gap-1.5 mt-2">
                {customer.is_active ? (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                    text-[8px] font-black uppercase bg-emerald-50 text-emerald-600
                    border border-emerald-100"
                  >
                    <CheckCircle2 size={9} /> Aktif
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                    text-[8px] font-black uppercase bg-rose-50 text-rose-600
                    border border-rose-100"
                  >
                    <XCircle size={9} /> Nonaktif
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Poin loyalty ── */}
          <div
            className="flex items-center justify-between bg-amber-50
            border border-amber-100 rounded-2xl px-4 py-3"
          >
            <div>
              <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-1">
                Poin Loyalitas
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-amber-600 leading-none tabular-nums">
                  {Number(customer.point || 0).toLocaleString("id-ID")}
                </span>
                <span className="text-[9px] text-amber-400 font-semibold">
                  poin
                </span>
              </div>
            </div>
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Star size={20} className="text-amber-400 fill-amber-400" />
            </div>
          </div>

          {/* ── Detail rows ── */}
          <div className="bg-white border border-slate-100 rounded-2xl px-4 py-1">
            <DetailRow
              icon={Phone}
              label="Nomor Telepon"
              value={customer.phone}
              valueClass="font-mono"
            />
            <DetailRow icon={Mail} label="Email" value={customer.email} />
            <DetailRow icon={MapPin} label="Alamat" value={customer.address} />
            <DetailRow
              icon={Calendar}
              label="Terdaftar Sejak"
              value={customer.created_at}
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-[10px] font-black uppercase
              text-slate-500 hover:text-slate-700 transition-colors
              tracking-widest border border-slate-200 rounded-xl hover:bg-white"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
