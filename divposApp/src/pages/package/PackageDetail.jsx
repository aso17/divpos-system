import React from "react";
import { X, Package, Clock, Layers, Tag } from "lucide-react";
import { formatRupiah } from "../../utils/formatter";

export default function PackageDetail({ open, pkg, onClose }) {
  if (!open || !pkg) return null;

  const formatDuration = (minutes) => {
    if (!minutes) return "-";

    if (minutes >= 1440) {
      const day = Math.floor(minutes / 1440);
      return `${day} Hari`;
    }

    if (minutes >= 60) {
      const hour = Math.floor(minutes / 60);
      return `${hour} Jam`;
    }

    return `${minutes} Menit`;
  };

  const hasDiscount =
    pkg.discount_type !== "none" && Number(pkg.discount_value) > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-3xl overflow-hidden
        bg-white border border-slate-200
        shadow-[0_20px_60px_rgba(0,0,0,0.2)]
        animate-in fade-in zoom-in duration-200"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl
              bg-gradient-to-tr from-emerald-600 to-emerald-400
              flex items-center justify-center text-white shadow"
            >
              <Package size={18} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                {pkg.name}
              </h3>

              <p className="text-[10px] text-slate-400 font-mono uppercase">
                {pkg.code}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6">
          {/* PRICE HERO */}
          {/* PRICE HERO */}
          <div className="text-center">
            <p className="text-[9px] md:text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
              Harga Layanan
            </p>

            {hasDiscount && (
              <p className="text-[9px] text-slate-400 line-through">
                Rp {formatRupiah(pkg.price)}
              </p>
            )}

            <div className="mt-0.5 text-xl md:text-2xl font-black text-slate-800">
              Rp {formatRupiah(pkg.final_price ?? pkg.price)}
            </div>

            <p className="text-[9px] text-slate-400 mt-0.5">
              per {pkg.unit?.name}
            </p>

            {hasDiscount && (
              <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-[2px] rounded-full text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-semibold">
                <Tag size={9} />
                {pkg.discount_type === "percentage"
                  ? `${pkg.discount_value}%`
                  : `Rp ${formatRupiah(pkg.discount_value)}`}
              </span>
            )}
          </div>

          {/* SERVICE METRICS */}
          <div className="grid grid-cols-2 gap-4">
            <Metric
              icon={<Clock size={18} className="text-emerald-600" />}
              label="Durasi"
              value={formatDuration(pkg.duration_menit)}
            />

            <Metric
              icon={<Layers size={18} className="text-emerald-600" />}
              label="Min Order"
              value={`${pkg.min_order} ${pkg.unit?.short_name || pkg.unit?.name}`}
            />
          </div>

          {/* META INFO */}
          <div className="space-y-3 border-t border-dashed border-slate-200 pt-4 text-[11px]">
            <Info label="Service" value={pkg.service?.name} />

            <Info label="Kategori" value={pkg.category?.name} />

            <Info
              label="Berbasis Berat"
              value={pkg.is_weight_based ? "Ya" : "Tidak"}
            />

            <Info label="Satuan" value={pkg.unit?.name} />

            <Info
              label="Status"
              value={pkg.is_active ? "Aktif" : "Nonaktif"}
              status
              active={pkg.is_active}
            />

            <Info
              label="Dibuat"
              value={
                pkg.created_at
                  ? new Date(pkg.created_at).toLocaleDateString("id-ID")
                  : "-"
              }
            />
          </div>

          {/* DESCRIPTION */}
          {pkg.description && (
            <div className="border-t border-dashed border-slate-200 pt-4">
              <p className="text-[10px] text-slate-400 uppercase font-semibold mb-2">
                Deskripsi
              </p>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                {pkg.description}
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[11px] font-semibold
            bg-white border border-slate-200 rounded-lg
            text-slate-600 hover:bg-slate-100 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div
      className="flex items-center gap-3 p-4 rounded-xl
      border border-slate-100 bg-slate-50"
    >
      {icon}

      <div>
        <p className="text-[10px] text-slate-400 uppercase font-semibold">
          {label}
        </p>

        <p className="text-sm font-bold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function Info({ label, value, status, active }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-400 uppercase font-semibold">{label}</span>

      {status ? (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-white ${
            active ? "bg-emerald-500" : "bg-rose-500"
          }`}
        >
          {value}
        </span>
      ) : (
        <span className="text-slate-700 font-medium">{value || "-"}</span>
      )}
    </div>
  );
}
