import { useEffect, useState } from "react";
import SubmitButton from "../../components/SubmitButton";
import { rules } from "../../utils/validators/rules";
import { inputClasses } from "../../utils/validators/inputClasses";
import { useFormValidation } from "../../hooks/useFormValidation";
import MasterService from "../../services/MasterService";

export default function MasterServiceForm({
  open,
  onClose,
  initialData = null,
  onSuccess,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { values, errors, handleChange, validate, setValues, setErrors } =
    useFormValidation(
      {
        name: "",
        description: "",
        is_active: true,
      },
      {
        // Validasi Nama Layanan: Wajib, Min 3 Karakter, No HTML
        name: [
          (v) => rules.required(v, "Nama layanan wajib diisi"),
          (v) => rules.minLength(v, 3, "Minimal 3 karakter"),
          (v) => rules.noHtml(v),
          (v) => rules.safeString(v),
        ],
        // Validasi Deskripsi: Opsional, tapi jika diisi jangan ada script berbahaya
        description: [(v) => (v ? rules.noHtml(v) : null)],
      },
    );

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      // Inisialisasi Mode Edit
      setValues({
        name: initialData.name || "",
        description: initialData.description || "",
        is_active: initialData.is_active == 1 || initialData.is_active === true,
      });
    } else {
      // Inisialisasi Mode Tambah
      setValues({
        name: "",
        description: "",
        is_active: true,
      });
    }
    setErrors({});
  }, [open, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...values,
      is_active: values.is_active ? 1 : 0,
    };

    try {
      setIsSubmitting(true);
      let response;

      if (initialData?.id) {
        response = await MasterService.updateMasterService(
          initialData.id,
          payload,
        );
      } else {
        response = await MasterService.createMasterService(payload);
      }

      triggerToast(
        response.data?.message || "Data layanan berhasil disimpan",
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
      <div className="bg-white rounded-sm w-full max-w-md shadow-2xl overflow-hidden border-t-4 border-indigo-600 animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <h2 className="text-xs font-bold mb-6 text-slate-700 uppercase tracking-wider border-b pb-3 flex items-center gap-2">
            <span className="p-1 bg-indigo-50 text-indigo-600 rounded">🛠️</span>
            {initialData ? "Edit Layanan Jasa" : "Tambah Layanan Baru"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 text-xxs"
          >
            {/* Service Name */}
            <div>
              <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
                Nama Layanan <span className="text-red-500">*</span>
              </label>
              <input
                value={values.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className={inputClasses({ error: !!errors.name })}
                placeholder="Contoh: Cuci Kering, Setrika Saja"
                autoFocus
              />
              {errors.name && (
                <p className="text-[10px] text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
                Deskripsi / Penjelasan Singkat
              </label>
              <textarea
                value={values.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className={`${inputClasses({ error: !!errors.description })} min-h-[80px] py-2`}
                placeholder="Jelaskan apa saja yang didapat dalam layanan ini..."
              />
              {errors.description && (
                <p className="text-[10px] text-red-500 mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Status Switch */}
            <div className="py-2">
              <label className="flex items-center gap-2 cursor-pointer group w-fit">
                <input
                  type="checkbox"
                  checked={values.is_active}
                  onChange={(e) => handleChange("is_active", e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all"
                />
                <div className="flex flex-col">
                  <span className="text-slate-600 font-bold uppercase text-[9px] group-hover:text-indigo-600 transition-colors">
                    Status Layanan Aktif
                  </span>
                  <span className="text-[8px] text-slate-400">
                    Layanan yang tidak aktif tidak akan muncul di menu Kasir.
                  </span>
                </div>
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-50">
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
                label={initialData ? "Update Layanan" : "Create Layanan"}
                loadingLabel="Processing..."
                fullWidth={false}
                className="text-[10px] font-bold uppercase py-1.5 px-6 rounded bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
