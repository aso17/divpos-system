import { useEffect, useState } from "react";
import SubmitButton from "../../components/SubmitButton";
import { rules } from "../../utils/validators/rules";
import { inputClasses } from "../../utils/validators/inputClasses";
import { useFormValidation } from "../../hooks/useFormValidation";
import CategoryService from "../../services/CategoryService";

export default function CategoryForm({
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
        slug: "",
        duration_hours: 0,
        priority: 0,
        is_active: true,
      },
      {
        name: [
          (v) => rules.required(v, "Wajib diisi"),
          (v) => rules.minLength(v, 3, "Min. 3 karakter"),
        ],
        slug: [(v) => rules.required(v, "Slug wajib ada")],
        duration_hours: [(v) => rules.required(v, "Wajib diisi")],
        priority: [(v) => rules.required(v, "Wajib diisi")],
      },
    );

  const createSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const handleNameChange = (val) => {
    handleChange("name", val);
    if (!initialData) handleChange("slug", createSlug(val));
  };

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setValues({
        name: initialData.name || "",
        slug: initialData.slug || "",
        duration_hours: initialData.duration_hours || 0,
        priority: initialData.priority || 0,
        is_active: initialData.is_active == 1 || initialData.is_active === true,
      });
    } else {
      setValues({
        name: "",
        slug: "",
        duration_hours: 0,
        priority: 0,
        is_active: true,
      });
    }
    setErrors({});
  }, [open, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        ...values,
        is_active: values.is_active ? 1 : 0,
        duration_hours: parseInt(values.duration_hours) || 0,
        priority: parseInt(values.priority) || 0,
      };

      const res = initialData?.id
        ? await CategoryService.updateCategory(initialData.id, payload)
        : await CategoryService.createCategory(payload);

      const { message, data } = res.data;

      triggerToast(message || "Data berhasil disimpan", "success");

      onSuccess?.(data);
      onClose();
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Terjadi kesalahan server";
      const serverErrors = err.response?.data?.errors;

      if (serverErrors) {
        setErrors(serverErrors);
      }

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

  // Custom class untuk input agar border hijaunya konsisten
  const greenInputClass = (fieldName) => `
    ${inputClasses({ error: !!errors[fieldName] })} 
    py-1 px-2 text-[10px] 
    focus:border-emerald-500 focus:ring-emerald-500/20 
    transition-all duration-200
  `;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl overflow-hidden border-t-4 border-emerald-500 animate-in fade-in zoom-in duration-200">
        <div className="p-5">
          <h2 className="text-[10px] font-black mb-4 text-slate-700 uppercase tracking-widest border-b border-emerald-50 pb-2 flex items-center gap-2">
            <span className="text-emerald-600">⏱️</span>
            {initialData ? "Edit Kategori" : "Kategori Baru"}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block mb-1 text-slate-500 font-bold uppercase text-[8px] tracking-wider">
                Nama Kategori <span className="text-red-500">*</span>
              </label>
              <input
                value={values.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={greenInputClass("name")}
                placeholder="Contoh: Cuci Cepat"
              />
              {errors.name && (
                <p className="text-[10px] text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block mb-1 text-slate-500 font-bold uppercase text-[8px] tracking-wider">
                Slug URL
              </label>
              <input
                value={values.slug}
                readOnly
                className={`${greenInputClass("slug")} bg-slate-50/50 text-slate-400 font-mono border-emerald-100`}
              />
              {errors.slug && (
                <p className="text-[10px] text-red-500 mt-1">{errors.slug}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-slate-500 font-bold uppercase text-[8px] tracking-wider">
                  Durasi (Jam)
                </label>
                <input
                  type="number"
                  value={values.duration_hours}
                  onChange={(e) =>
                    handleChange("duration_hours", e.target.value)
                  }
                  className={greenInputClass("duration_hours")}
                />

                {errors.duration_hours && (
                  <p className="text-[10px] text-red-500 mt-1">
                    {errors.duration_hours}
                  </p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-slate-500 font-bold uppercase text-[8px] tracking-wider">
                  Prioritas
                </label>
                <input
                  type="number"
                  value={values.priority}
                  onChange={(e) => handleChange("priority", e.target.value)}
                  className={greenInputClass("priority")}
                />

                {errors.priority && (
                  <p className="text-[10px] text-red-500 mt-1">
                    {errors.priority}
                  </p>
                )}
              </div>
            </div>

            <div className="py-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={values.is_active}
                  onChange={(e) => handleChange("is_active", e.target.checked)}
                  className="w-3 h-3 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer transition-colors"
                />
                <span className="text-slate-500 font-bold uppercase text-[8px] group-hover:text-emerald-600">
                  Kategori Aktif
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-50 mt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-[10px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
              >
                Batal
              </button>
              <SubmitButton
                isSubmitting={isSubmitting}
                label={initialData ? "Update" : "Create"}
                loadingLabel="Processing..."
                fullWidth={false}
                className="text-[10px] font-bold uppercase py-1.5 px-6 rounded shadow-sm shadow-blue-200"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
