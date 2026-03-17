// TransactionCustomerForm.jsx
// Logic: TIDAK DIUBAH — hanya styling

import Pencil from "lucide-react/dist/esm/icons/pencil";
import Store from "lucide-react/dist/esm/icons/store";
import Phone from "lucide-react/dist/esm/icons/phone";
import User from "lucide-react/dist/esm/icons/user";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";

export default function TransactionCustomerForm({
  values,
  errors,
  outlets,
  handleChange,
  handlePhoneChange,
  inputClasses,
}) {
  // Base input: overrides whatever inputClasses returns
  const base =
    "w-full h-11 rounded-xl border bg-white px-3.5 text-sm font-medium text-gray-800 " +
    "placeholder:text-gray-300 transition-all duration-150 outline-none " +
    "focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 " +
    "disabled:bg-emerald-50 disabled:text-emerald-800 disabled:font-semibold disabled:cursor-default";

  const borderNormal = "border-gray-200 hover:border-gray-300";
  const borderError = "border-red-400 focus:ring-red-100 focus:border-red-400";
  const borderActive = "border-emerald-400";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* ── Card Header ── */}
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm shadow-emerald-200 flex-shrink-0">
            <Pencil size={14} strokeWidth={2.5} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800 leading-tight">
              Informasi Transaksi
            </h2>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Data outlet &amp; pelanggan
            </p>
          </div>
        </div>

        {/* Existing-customer badge — muncul otomatis */}
        {!values.is_new && values.customer_name && (
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <CheckCircle size={12} className="text-emerald-600 flex-shrink-0" />
            <span className="text-[10px] font-bold text-emerald-700">
              Pelanggan lama
            </span>
          </div>
        )}
      </div>

      {/* ── Form Body ── */}
      <div className="p-5 space-y-4">
        {/* OUTLET SELECT */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            <Store size={11} className="text-emerald-500" />
            Outlet
          </label>

          <div className="relative">
            <select
              value={values.outlet_id}
              onChange={(e) => handleChange("outlet_id", e.target.value)}
              className={`${base} appearance-none pr-10 cursor-pointer ${
                errors.outlet_id ? borderError : borderActive
              }`}
            >
              <option value="">-- Pilih Outlet --</option>
              {outlets.map((out) => (
                <option key={out.id} value={out.id}>
                  {out.name}
                </option>
              ))}
            </select>

            {/* custom chevron */}
            <svg
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {errors.outlet_id && (
            <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
              <span>⚠</span> {errors.outlet_id}
            </p>
          )}
        </div>

        {/* CUSTOMER GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PHONE */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <Phone size={11} className="text-emerald-500" />
              No. WhatsApp
            </label>

            <div className="relative">
              {/* Prefix pill */}
              <div className="absolute left-0 top-0 bottom-0 flex items-center pl-3.5 pointer-events-none">
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100 leading-none">
                  +62
                </span>
              </div>

              <input
                type="text"
                className={`${base} pl-14 ${
                  errors.customer_phone ? borderError : borderNormal
                }`}
                value={values.customer_phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="08xxxxxxxxxx"
              />
            </div>

            {errors.customer_phone && (
              <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                <span>⚠</span> {errors.customer_phone}
              </p>
            )}
          </div>

          {/* NAME */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <User size={11} className="text-emerald-500" />
              Nama Pelanggan
            </label>

            <div className="relative">
              <input
                type="text"
                className={`${base} ${
                  errors.customer_name
                    ? borderError
                    : !values.is_new
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold"
                      : borderNormal
                }`}
                value={values.customer_name}
                onChange={(e) => handleChange("customer_name", e.target.value)}
                disabled={!values.is_new}
                placeholder="Nama Pelanggan"
              />

              {/* Lock icon when existing customer */}
              {!values.is_new && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <CheckCircle size={14} className="text-emerald-500" />
                </div>
              )}
            </div>

            {errors.customer_name && (
              <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                <span>⚠</span> {errors.customer_name}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
