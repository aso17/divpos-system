import { useEffect, useState } from "react";
import SubmitButton from "../../components/SubmitButton";
import { rules } from "../../utils/validators/rules";
import { inputClasses } from "../../utils/validators/inputClasses";
import { useFormValidation } from "../../hooks/useFormValidation";

// Import Service
import PaymentMethodService from "../../services/PaymentMethodService";

export default function PaymentMethodForm({
  open,
  onClose,
  initialData = null,
  onSuccess,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Opsi Tipe Pembayaran
  const paymentTypes = [
    { id: "CASH", name: "TUNAI / CASH" },
    { id: "TRANSFER", name: "TRANSFER BANK" },
    { id: "E-WALLET", name: "E-WALLET (QRIS/OVO/DLL)" },
  ];

  const { values, errors, handleChange, validate, setValues, setErrors } =
    useFormValidation(
      {
        name: "",
        type: "CASH",
        account_number: "",
        account_name: "",
        description: "",
        is_active: true,
      },
      {
        name: [(v) => rules.required(v, "Nama metode wajib diisi")],
        type: [(v) => rules.required(v, "Tipe wajib dipilih")],
        // Validasi kondisional: Jika bukan CASH, maka account_number wajib
        account_number: [
          (v, allValues) =>
            allValues.type !== "CASH"
              ? rules.required(v, "Nomor rekening/HP wajib diisi")
              : null,
        ],
        account_number: [
          (v, allValues) =>
            allValues.type !== "CASH"
              ? rules.required(v, "Nomor rekening/HP wajib diisi")
              : null,
        ],
        account_name: [
          (v, allValues) =>
            allValues.type !== "CASH"
              ? rules.required(v, "Nama pemilik rekening wajib diisi")
              : null,
        ],
      },
    );

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setValues({
        name: initialData.name || "",
        type: initialData.type || "CASH",
        account_number: initialData.account_number || "",
        account_name: initialData.account_name || "",
        description: initialData.description || "",
        is_active:
          initialData.is_active === 1 || initialData.is_active === true,
      });
    } else {
      setValues({
        name: "",
        type: "CASH",
        account_number: "",
        account_name: "",
        description: "",
        is_active: true,
      });
    }
    setErrors({});
  }, [open, initialData, setValues, setErrors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const payload = { ...values, is_active: values.is_active ? 1 : 0 };

      // Jika CASH, kosongkan detail rekening sebelum kirim ke server
      if (values.type === "CASH") {
        payload.account_number = null;
        payload.account_name = null;
      }

      let response;
      if (initialData?.id) {
        response = await PaymentMethodService.updatePaymentMethod(
          initialData.id,
          payload,
        );
      } else {
        response = await PaymentMethodService.createPaymentMethod(payload);
      }

      triggerToast(response.data?.message || "Success", "success");
      onSuccess?.(response.data?.data);
      onClose();
    } catch (err) {
      triggerToast(
        err.response?.data?.message || "Terjadi kesalahan sistem",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerToast = (message, type) => {
    window.dispatchEvent(
      new CustomEvent("global-toast", {
        detail: { message, type },
      }),
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 text-xs font-medium">
      <div className="bg-white rounded-[1.5rem] w-full max-w-md p-6 shadow-2xl overflow-y-auto max-h-[95vh] border border-slate-100">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">
            {initialData ? "Edit Metode" : "Tambah Metode Baru"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          {/* Nama Metode */}
          <div className="col-span-2">
            <label className="block mb-1 text-slate-400 font-bold uppercase text-[9px]">
              Nama Metode Pembayaran
            </label>
            <input
              value={values.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={`${inputClasses({ error: !!errors.name })} py-1.5 focus:ring-emerald-500 focus:border-emerald-500 font-bold`}
              placeholder="Contoh: Transfer Mandiri / QRIS Shopee"
            />
            {errors.name && (
              <p className="text-[8px] text-rose-500 mt-0.5 uppercase font-bold">
                {errors.name}
              </p>
            )}
          </div>

          {/* Tipe Pembayaran */}
          <div className="col-span-2">
            <label className="block mb-1 text-slate-400 font-bold uppercase text-[9px]">
              Tipe
            </label>
            <div className="grid grid-cols-3 gap-2">
              {paymentTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleChange("type", t.id)}
                  className={`py-2 px-1 rounded-lg border text-[8px] font-black uppercase transition-all ${
                    values.type === t.id
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100"
                      : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Input Rekening - Hanya muncul jika bukan CASH */}
          {values.type !== "CASH" && (
            <>
              <div className="col-span-1">
                <label className="block mb-1 text-slate-400 font-bold uppercase text-[9px]">
                  Nomor Rekening / HP
                </label>
                <input
                  value={values.account_number}
                  onChange={(e) =>
                    handleChange("account_number", e.target.value)
                  }
                  className={`${inputClasses({ error: !!errors.account_number })} py-1.5 focus:ring-emerald-500 focus:border-emerald-500 font-mono`}
                  placeholder="0001234xxx"
                />

                {errors.account_number && (
                  <p className="text-[8px] text-rose-500 mt-0.5 uppercase font-bold">
                    {errors.account_number}
                  </p>
                )}
              </div>

              <div className="col-span-1">
                <label className="block mb-1 text-slate-400 font-bold uppercase text-[9px]">
                  Atas Nama (A.N)
                </label>
                <input
                  value={values.account_name}
                  onChange={(e) => handleChange("account_name", e.target.value)}
                  className={`${inputClasses({})} py-1.5 focus:ring-emerald-500 focus:border-emerald-500`}
                  placeholder="Nama Pemilik"
                />
                {errors.account_name && (
                  <p className="text-[8px] text-rose-500 mt-0.5 uppercase font-bold">
                    {errors.account_name}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Deskripsi */}
          <div className="col-span-2">
            <label className="block mb-1 text-slate-400 font-bold uppercase text-[9px]">
              Keterangan (Opsional)
            </label>
            <textarea
              value={values.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className={`${inputClasses({})} min-h-[50px] py-1.5 focus:ring-emerald-500 focus:border-emerald-500`}
              placeholder="Contoh: Masuk ke Kas Kecil / Rekening Owner"
            />
          </div>

          {/* Checkbox Aktif */}
          <div className="col-span-2 py-1 flex items-center">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={values.is_active}
                onChange={(e) => handleChange("is_active", e.target.checked)}
                className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer border-slate-300"
              />
              <span className="text-slate-500 font-bold uppercase text-[9px] group-hover:text-emerald-600 transition-colors">
                Metode Aktif & Bisa Digunakan
              </span>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="col-span-2 flex justify-end gap-2 pt-4 mt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[10px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
            >
              Cancel
            </button>
            <SubmitButton
              isSubmitting={isSubmitting}
              label={initialData ? "Update" : "Save"}
              loadingLabel="Processing..."
              fullWidth={false}
              className="text-[10px] font-bold uppercase py-1.5 px-6 rounded shadow-sm"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
