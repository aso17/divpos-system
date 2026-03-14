import Pencil from "lucide-react/dist/esm/icons/pencil";

export default function TransactionCustomerForm({
  values,
  errors,
  outlets,
  handleChange,
  handlePhoneChange,
  inputClasses,
}) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
      <h2 className="font-bold text-gray-700 text-[10px] mb-4 flex items-center gap-2 uppercase tracking-wide">
        <span className="w-6 h-6 bg-emerald-600 text-white rounded-lg flex items-center justify-center shadow">
          <Pencil size={12} strokeWidth={3} />
        </span>
        Informasi Transaksi
      </h2>

      <div className="space-y-3">
        {/* OUTLET */}
        <select
          value={values.outlet_id}
          onChange={(e) => handleChange("outlet_id", e.target.value)}
          className={
            inputClasses({ error: !!errors.outlet_id }) +
            " !text-[11px] !py-2 !px-3 font-bold bg-white h-10 rounded-lg !border-emerald-500 focus:!border-emerald-600 focus:!ring-emerald-100"
          }
        >
          <option value="">-- Pilih Outlet --</option>

          {outlets.map((out) => (
            <option key={out.id} value={out.id}>
              {out.name}
            </option>
          ))}
        </select>

        {errors.outlet_id && (
          <p className="text-[9px] text-red-500 font-bold italic">
            {errors.outlet_id}
          </p>
        )}

        {/* CUSTOMER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* PHONE */}
          <div>
            <input
              type="text"
              className={
                inputClasses({ error: !!errors.customer_phone }) +
                " !text-[11px] !py-2 !px-3 h-10 rounded-lg !border-emerald-500 focus:!border-emerald-600 focus:!ring-emerald-100"
              }
              value={values.customer_phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="No. WhatsApp (08...)"
            />

            {errors.customer_phone && (
              <p className="text-[8px] text-red-500 font-bold italic">
                {errors.customer_phone}
              </p>
            )}
          </div>

          {/* NAME */}
          <div>
            <input
              type="text"
              className={
                inputClasses({ error: !!errors.customer_name }) +
                " !text-[11px] !py-2 !px-3 h-10 rounded-lg !border-emerald-500 focus:!border-emerald-600 focus:!ring-emerald-100 " +
                (!values.is_new
                  ? "bg-emerald-50 font-black text-emerald-800"
                  : "bg-white")
              }
              value={values.customer_name}
              onChange={(e) => handleChange("customer_name", e.target.value)}
              disabled={!values.is_new}
              placeholder="Nama Pelanggan"
            />

            {errors.customer_name && (
              <p className="text-[8px] text-red-500 font-bold italic">
                {errors.customer_name}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
