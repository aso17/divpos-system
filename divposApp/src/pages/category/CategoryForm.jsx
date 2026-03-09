import { useEffect, useState, useMemo } from "react";
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

  // Hook validation yang disesuaikan dengan skema DB Ms_categories
  const { values, errors, handleChange, validate, setValues, setErrors } =
    useFormValidation(
      {
        name: "",
        slug: "",
        priority: 0,
        is_active: true,
      },
      {
        name: [
          (v) => rules.required(v, "Nama kategori wajib diisi"),
          (v) => rules.minLength(v, 2, "Minimal 2 karakter"),
        ],
        priority: [(v) => rules.required(v, "Prioritas wajib diisi")],
      },
    );

  // Memoize slug creator agar performa tetap kencang
  const createSlug = useMemo(
    () => (text) => {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    },
    [],
  );

  const handleNameChange = (val) => {
    handleChange("name", val);
    // Slug otomatis berubah hanya saat Create, saat Edit biasanya slug tetap (SEO friendly)
    if (!initialData) {
      handleChange("slug", createSlug(val));
    }
  };

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setValues({
        name: initialData.name || "",
        slug: initialData.slug || "",
        priority: initialData.priority || 0,
        is_active: !!initialData.is_active,
      });
    } else {
      setValues({ name: "", slug: "", priority: 0, is_active: true });
    }
    setErrors({});
  }, [open, initialData, setValues, setErrors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Payload bersih tanpa duration_hours (sesuai Ms_categories terbaru)
      const payload = {
        ...values,
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

      if (serverErrors) setErrors(serverErrors);
      triggerToast(errorMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerToast = (message, type) => {
    window.dispatchEvent(
      new CustomEvent("global-toast", { detail: { message, type } }),
    );
  };

  if (!open) return null;

  const greenInputClass = (fieldName) => `
    ${inputClasses({ error: !!errors[fieldName] })} 
    py-2 px-3 text-[11px] font-medium
    focus:border-emerald-500 focus:ring-emerald-500/20 
    transition-all duration-200 rounded-lg
  `;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-emerald-100 animate-in zoom-in duration-200">
        {/* Header dengan Aksen Emerald */}
        <div className="bg-emerald-50/50 px-6 py-4 border-b border-emerald-100">
          <h2 className="text-[11px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
            <span className="bg-emerald-500 text-white p-1 rounded-md"></span>
            {initialData ? "Update Kategori" : "Kategori Master Baru"}
          </h2>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Nama Kategori */}
            <div className="space-y-1">
              <label className="text-slate-500 font-bold uppercase text-[9px] tracking-widest ml-1">
                Nama Kategori <span className="text-rose-500">*</span>
              </label>
              <input
                value={values.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={greenInputClass("name")}
                placeholder=""
              />
              {errors.name && (
                <p className="text-[10px] text-rose-500 font-medium mt-1">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Slug - Read Only */}
            <div className="space-y-1">
              <label className="text-slate-500 font-bold uppercase text-[9px] tracking-widest ml-1">
                Slug (Otomatis)
              </label>
              <input
                value={values.slug}
                readOnly
                className={`${greenInputClass("slug")} bg-slate-50 text-slate-400 font-mono italic`}
              />
            </div>

            {/* Priority & Status */}
            <div className="grid grid-cols-2 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-slate-500 font-bold uppercase text-[9px] tracking-widest ml-1">
                  Prioritas Urutan
                </label>
                <input
                  type="number"
                  value={values.priority}
                  onChange={(e) => handleChange("priority", e.target.value)}
                  className={greenInputClass("priority")}
                />
              </div>

              <div className="pb-2">
                <label className="flex items-center gap-2 cursor-pointer group bg-slate-50 p-2 rounded-lg border border-slate-100 hover:border-emerald-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={values.is_active}
                    onChange={(e) =>
                      handleChange("is_active", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-slate-600 font-bold uppercase text-[9px] group-hover:text-emerald-600">
                    Aktif
                  </span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="col-span-2 flex justify-end gap-2 pt-4 border-t mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-[10px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-100 rounded-lg"
              >
                Cancel
              </button>
              <SubmitButton
                isSubmitting={isSubmitting}
                label={initialData ? "Update" : "Create"}
                loadingLabel="Memproses..."
                fullWidth={false}
                className="text-[10px] font-bold uppercase py-1.5 px-6 rounded bg-emerald-600 text-white"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
