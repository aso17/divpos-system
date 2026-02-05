import { useEffect, useState } from "react";
import SubmitButton from "../../components/SubmitButton";
import { rules } from "../../utils/validators/rules";
import { inputClasses } from "../../utils/validators/inputClasses";
import { useFormValidation } from "../../hooks/useFormValidation";
import OutletService from "../../services/OutletService";

export default function OutletForm({
  open,
  onClose,
  initialData = null,
  onSuccess,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const { values, errors, handleChange, validate, setValues, setErrors } =
    useFormValidation(
      {
        name: "",
        code: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        is_active: true,
        is_main_branch: false,
      },
      {
        // 1. Nama Outlet: Wajib, minimal 3 karakter, aman dari tag HTML & SQL Injection
        name: [
          (v) => rules.required(v, "Nama Outlet wajib diisi"),
          (v) => rules.minLength(v, 3, "Nama minimal 3 karakter"),
          (v) => rules.noHtml(v),
          (v) => rules.safeString(v),
        ],

        // 2. Kode Outlet: Cukup pastikan ada nilainya (karena di-lock/disabled)
        code: [(v) => rules.required(v, "Kode wajib ada")],

        // 3. Telepon: Pakai format Indonesia (08... / 628...)
        phone: [
          (v) => rules.required(v, "Nomor telepon wajib diisi"),
          (v) =>
            rules.phoneID(v, "Format HP Indonesia tidak valid (08xxx/628xxx)"),
          (v) =>
            rules.noLetters(v, "Nomor telepon tidak boleh mengandung huruf"),
        ],

        // 4. Email: Opsional, tapi kalau diisi harus format email bener
        email: [(v) => (v ? rules.email(v, "Format email salah") : null)],

        // 5. Kota: Wajib diisi & aman dari karakter aneh
        city: [
          (v) => rules.required(v, "Kota wajib diisi"),
          (v) => rules.noHtml(v),
          (v) => rules.safeString(v),
        ],

        // 6. Alamat: Wajib diisi & minimal 10 karakter biar jelas
        address: [
          (v) => rules.required(v, "Alamat wajib diisi"),
          (v) => rules.minLength(v, 10, "Alamat minimal 10 karakter"),
          (v) => rules.noHtml(v),
        ],
      },
    );

  const generaAutoCode = async () => {
    try {
      setIsGeneratingCode(true);
      const res = await OutletService.generateCode();
      const newCode = res.data?.code;
      handleChange("code", newCode);
    } catch (err) {
      console.error("Error generating auto code:", err);
      triggerToast("Gagal generate kode otomatis", "error");
    } finally {
      setIsGeneratingCode(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      // Inisialisasi Mode Edit
      setValues({
        name: initialData.name || "",
        code: initialData.code || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        address: initialData.address || "",
        city: initialData.city || "",
        is_active: initialData.is_active == 1 || initialData.is_active === true,
        is_main_branch:
          initialData.is_main_branch == 1 ||
          initialData.is_main_branch === true,
      });
    } else {
      // Inisialisasi Mode Tambah
      setValues({
        name: "",
        code: "AUTO-GENERATING...",
        phone: "",
        email: "",
        address: "",
        city: "",
        is_active: true,
        is_main_branch: false,
      });
      generaAutoCode();
    }
    setErrors({});
  }, [open, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...values,
      // Pastikan format data sesuai dengan kebutuhan backend tinyInt
      is_active: values.is_active ? 1 : 0,
      is_main_branch: values.is_main_branch ? 1 : 0,
    };

    try {
      setIsSubmitting(true);
      let response;

      if (initialData?.id) {
        response = await OutletService.updateOutlet(initialData.id, payload);
      } else {
        response = await OutletService.createOutlet(payload);
      }

      triggerToast(
        response.data?.message || "Data berhasil disimpan",
        "success",
      );
      onSuccess?.(response.data?.data);
      onClose();
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Terjadi kesalahan pada server";
      triggerToast(errorMsg, "error");
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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-sm w-full max-w-lg shadow-2xl overflow-hidden border-t-4 border-blue-500 animate-in fade-in zoom-in duration-200">
        <div className="p-6 overflow-y-auto max-h-[90vh]">
          <h2 className="text-xs font-bold mb-6 text-slate-700 uppercase tracking-wider border-b pb-3 flex items-center gap-2">
            <span className="p-1 bg-blue-50 text-blue-600 rounded">🏢</span>
            {initialData ? "Edit Cabang / Outlet" : "Tambah Cabang Baru"}
          </h2>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 text-xxs"
          >
            <div className="grid grid-cols-2 gap-4">
              {/* Outlet Name */}
              <div className="col-span-1">
                <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
                  Nama Outlet <span className="text-red-500">*</span>
                </label>
                <input
                  value={values.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={inputClasses({ error: !!errors.name })}
                  placeholder="Contoh: Pusat Jakarta"
                />
                {errors.name && (
                  <p className="text-[10px] text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              {/* Outlet Code */}
              <div className="col-span-1">
                <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
                  Kode Outlet <span className="text-red-500">*</span>
                </label>
                <input
                  value={values.code}
                  disabled={true}
                  className={`${inputClasses({ error: !!errors.code })} bg-slate-50 font-mono text-blue-600 font-bold cursor-not-allowed`}
                  placeholder="OTL-XXXX"
                />
                {isGeneratingCode && (
                  <p className="text-[8px] text-blue-400 mt-1 animate-pulse italic">
                    Generating code...
                  </p>
                )}
                {errors.code && !isGeneratingCode && (
                  <p className="text-[10px] text-red-500 mt-1">{errors.code}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Phone */}
              <div>
                <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
                  Telepon <span className="text-red-500">*</span>
                </label>
                <input
                  value={values.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className={inputClasses({ error: !!errors.phone })}
                  placeholder="0812..."
                />
                {errors.phone && (
                  <p className="text-[10px] text-red-500 mt-1">
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
                  Email Cabang
                </label>
                <input
                  value={values.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={inputClasses({ error: !!errors.email })}
                  placeholder="outlet@mail.com"
                />
                {errors.email && (
                  <p className="text-[10px] text-red-500 mt-1">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
                Kota <span className="text-red-500">*</span>
              </label>
              <input
                value={values.city}
                onChange={(e) => handleChange("city", e.target.value)}
                className={inputClasses({ error: !!errors.city })}
                placeholder="Jakarta Selatan"
              />
              {errors.city && (
                <p className="text-[10px] text-red-500 mt-1">{errors.city}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
                Alamat Lengkap <span className="text-red-500">*</span>
              </label>
              <textarea
                value={values.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className={`${inputClasses({ error: !!errors.address })} min-h-[60px] py-2`}
                placeholder="Jl. Merdeka No. 1..."
              />
              {errors.address && (
                <p className="text-[10px] text-red-500 mt-1">
                  {errors.address}
                </p>
              )}
            </div>

            {/* Checkboxes Area */}
            <div className="flex gap-6 py-2 border-y border-slate-50">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={values.is_active}
                  onChange={(e) => handleChange("is_active", e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-slate-600 font-bold uppercase text-[9px] group-hover:text-blue-600 transition-colors">
                  Outlet Aktif
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={values.is_main_branch}
                  onChange={(e) =>
                    handleChange("is_main_branch", e.target.checked)
                  }
                  className="w-3.5 h-3.5 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
                <span className="text-slate-600 font-bold uppercase text-[9px] group-hover:text-orange-600 transition-colors">
                  Cabang Pusat
                </span>
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-300 rounded text-[10px] font-bold uppercase text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <SubmitButton
                isSubmitting={isSubmitting}
                label={initialData ? "Update Cabang" : "Create Cabang"}
                loadingLabel="Processing..."
                fullWidth={false}
                className="text-[10px] font-bold uppercase py-1.5 px-6 rounded bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
