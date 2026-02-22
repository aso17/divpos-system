import { useEffect, useState } from "react";
import SubmitButton from "../../components/SubmitButton";
import { rules } from "../../utils/validators/rules";
import { inputClasses } from "../../utils/validators/inputClasses";
import { useFormValidation } from "../../hooks/useFormValidation";
import RoleService from "../../services/RoleService";

export default function RoleForm({
  open,
  onClose,
  initialData = null,
  onSuccess,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { values, errors, handleChange, validate, setValues, setErrors } =
    useFormValidation(
      {
        role_name: "",
        code: "",
        description: "",
        is_active: true,
      },
      {
        role_name: [
          (v) => rules.required(v, "Nama Role wajib diisi"),
          (v) => rules.minLength(v, 3, "Minimal 3 karakter"),
          (v) => rules.safeString(v, "Nama mengandung karakter ilegal"),
        ],
        code: [
          (v) => rules.required(v, "Kode Role wajib diisi"),
          (v) => rules.safeString(v, "Kode mengandung karakter ilegal"),
        ],
      },
    );

  // Inisialisasi data saat Edit atau Tambah
  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setValues({
        role_name: initialData.role_name || "",
        code: initialData.code || "",
        description: initialData.description || "",
        is_active: initialData.is_active == 1 || initialData.is_active === true,
      });
    } else {
      setValues({
        role_name: "",
        code: "",
        description: "",
        is_active: true,
      });
    }
    setErrors({});
  }, [open, initialData, setValues, setErrors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      role_name: values.role_name,
      code: values.code,
      description: values.description,
      is_active: values.is_active ? 1 : 0,
    };

    try {
      setIsSubmitting(true);
      let response;

      if (initialData?.id) {
        response = await RoleService.updateRole(initialData.id, payload);
      } else {
        response = await RoleService.createRole(payload);
      }

      // Ambil data dari response (biasanya response.data.data)
      const newRoleData = response.data?.data;

      triggerToast(response.data?.message || "Success", "success");

      // Kirim data ke parent via onSuccess
      onSuccess?.(newRoleData);

      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Something went wrong";
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
      {/* Border Atas menjadi Emerald 500 & Rounded disesuaikan agar konsisten */}
      <div className="bg-white rounded-sm w-full max-w-md shadow-2xl overflow-hidden border-t-4 border-emerald-500 animate-in fade-in zoom-in duration-200">
        <div className="p-6 overflow-y-auto max-h-[95vh]">
          <h2 className="text-xs font-bold mb-4 text-slate-700 uppercase tracking-wider border-b pb-3 flex items-center gap-2">
            <span className="p-1 bg-emerald-50 text-emerald-600 rounded">
              🔐
            </span>
            {initialData ? "Edit Role / Jabatan" : "Tambah Role Baru"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 text-xxs"
          >
            {/* Role Name */}
            <div>
              <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                value={values.role_name}
                onChange={(e) => handleChange("role_name", e.target.value)}
                className={`${inputClasses({ error: !!errors.role_name })} focus:border-emerald-500 focus:ring-emerald-500/20`}
                placeholder="e.g. Administrator"
              />
              {errors.role_name && (
                <p className="text-[10px] text-red-500 mt-1">
                  {errors.role_name}
                </p>
              )}
            </div>

            {/* Role Code */}
            <div>
              <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
                Role Code <span className="text-red-500">*</span>
              </label>
              <input
                value={values.code}
                onChange={(e) => handleChange("code", e.target.value)}
                disabled={!!initialData}
                className={`${inputClasses({ error: !!errors.code })} font-mono ${initialData ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "text-emerald-600 font-bold focus:border-emerald-500 focus:ring-emerald-500/20"}`}
                placeholder="e.g. ADM / MKT"
              />
              {errors.code && (
                <p className="text-[10px] text-red-500 mt-1">{errors.code}</p>
              )}
              {initialData && (
                <p className="text-[9px] text-slate-400 mt-1 italic">
                  * Kode tidak dapat diubah setelah dibuat
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
                Description
              </label>
              <textarea
                value={values.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className={`${inputClasses({ error: !!errors.description })} min-h-[80px] py-2 focus:border-emerald-500 focus:ring-emerald-500/20`}
                placeholder="Brief explanation of this role..."
              />
            </div>

            <div className="flex items-center pb-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={values.is_active}
                  onChange={(e) => handleChange("is_active", e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-slate-600 font-bold uppercase text-[9px] group-hover:text-emerald-600 transition-colors">
                  Role is Active
                </span>
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-[10px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
              >
                Cancel
              </button>
              <SubmitButton
                isSubmitting={isSubmitting}
                label={initialData ? "Update Role" : "Create Role"}
                loadingLabel="Processing..."
                fullWidth={false}
                className="text-[10px] font-bold uppercase py-1.5 px-6 rounded bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-200"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
