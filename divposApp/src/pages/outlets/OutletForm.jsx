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

  const { values, errors, handleChange, validate, setValues, setErrors } =
    useFormValidation(
      {
        name: "",
        phone: "",
        address: "",
        city: "",
        description: "", // Penyesuaian Table: Tambah description
        is_active: true,
        is_main_branch: false,
      },
      {
        name: [
          (v) => rules.required(v, "Nama Outlet wajib diisi"),
          (v) => rules.minLength(v, 3, "Nama minimal 3 karakter"),
          (v) => rules.noHtml(v),
          (v) => rules.safeString(v),
        ],
        phone: [
          (v) => rules.required(v, "Nomor telepon wajib diisi"),
          (v) => rules.phoneID(v, "Format HP tidak valid"),
          (v) => rules.noLetters(v),
        ],
        city: [
          (v) => rules.required(v, "Kota wajib diisi"),
          (v) => rules.noHtml(v),
        ],
        address: [
          (v) => rules.required(v, "Alamat wajib diisi"),
          (v) => rules.minLength(v, 10, "Alamat minimal 10 karakter"),
        ],
        // Description opsional sesuai model
      },
    );

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setValues({
        name: initialData.name || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
        city: initialData.city || "",
        description: initialData.description || "", // Penyesuaian Table
        is_active: initialData.is_active == 1 || initialData.is_active === true,
        is_main_branch:
          initialData.is_main_branch == 1 ||
          initialData.is_main_branch === true,
      });
    } else {
      setValues({
        name: "",
        phone: "",
        address: "",
        city: "",
        description: "",
        is_active: true,
        is_main_branch: false,
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
      <div className="bg-white rounded-sm w-full max-w-lg shadow-2xl overflow-hidden border-t-4 border-emerald-500 animate-in fade-in zoom-in duration-200">
        <div className="p-6 overflow-y-auto max-h-[90vh]">
          <h2 className="text-xs font-bold mb-6 text-slate-700 uppercase tracking-wider border-b pb-3 flex items-center gap-2">
            <span className="p-1 bg-emerald-50 text-emerald-600 rounded">
              🏢
            </span>
            {initialData ? "Edit Cabang / Outlet" : "Tambah Cabang Baru"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 text-xxs"
          >
            {/* Nama Outlet */}
            <div>
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

            {/* Row 2: Telepon & Kota */}
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            {/* Row 3: Description (Penyesuaian Table) */}
            <div>
              <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
                Deskripsi / Keterangan
              </label>
              <input
                value={values.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className={inputClasses({ error: false })}
                placeholder="Keterangan outlet..."
              />
            </div>

            {/* Row 4: Alamat */}
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

            {/* Row 5: Checkboxes */}
            <div className="flex gap-6 py-2 border-y border-slate-50">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={values.is_active}
                  onChange={(e) => handleChange("is_active", e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-600 font-bold uppercase text-[9px]">
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
                  className="w-3.5 h-3.5 rounded text-orange-600 focus:ring-orange-500"
                />
                <span className="text-slate-600 font-bold uppercase text-[9px]">
                  Cabang Pusat
                </span>
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-[10px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
              >
                Cancel
              </button>
              <SubmitButton
                isSubmitting={isSubmitting}
                label={initialData ? "Update Cabang" : "Create Cabang"}
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
