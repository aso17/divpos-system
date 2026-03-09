import { useEffect, useState } from "react";
import SubmitButton from "../../components/SubmitButton";
import { rules } from "../../utils/validators/rules";
import { inputClasses } from "../../utils/validators/inputClasses";
import { useFormValidation } from "../../hooks/useFormValidation";
import EmployeeService from "../../services/EmployeeService";
import OutletService from "../../services/OutletService";

export default function EmployeeForm({
  open,
  onClose,
  initialData = null,
  onSuccess,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [outlets, setOutlets] = useState([]);

  const { values, errors, handleChange, validate, setValues, setErrors } =
    useFormValidation(
      {
        full_name: "",
        phone: "",
        job_title: "",
        outlet_id: "",
        is_active: true,
      },
      {
        full_name: [
          (v) => rules.required(v, "Nama lengkap wajib diisi"),
          (v) => rules.noHtml(v),
          (v) => rules.safeString(v),
        ],
        phone: [
          (v) => rules.required(v, "Nomor telepon wajib diisi"),
          (v) => rules.noLetters(v, "Nomor telepon hanya boleh angka"),
          (v) => rules.phoneID(v),
        ],
        job_title: [
          (v) => rules.required(v, "Jabatan wajib diisi"),
          (v) => rules.noHtml(v),
          (v) => rules.safeString(v),
        ],
        outlet_id: [(v) => rules.noHtml(v)],
      },
    );

  useEffect(() => {
    if (open) {
      OutletService.getOutlets().then((res) =>
        setOutlets(res.data?.data || []),
      );
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setValues({
        full_name: initialData.full_name || "",
        phone: initialData.phone || "",
        job_title: initialData.job_title || "",
        outlet_id: initialData.outlet?.id || "",
        is_active: initialData.is_active === true,
      });
    } else {
      setValues({
        full_name: "",
        phone: "",
        job_title: "",
        outlet_id: "",
        is_active: true,
      });
    }
    setErrors({});
  }, [open, initialData, setValues, setErrors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      let response;

      if (initialData?.id) {
        response = await EmployeeService.updateEmployee(initialData.id, values);
      } else {
        response = await EmployeeService.createEmployee(values);
      }

      triggerToast(response.data?.message, "success");
      onSuccess?.(response.data?.data);
      onClose();
    } catch (err) {
      triggerToast(err.response?.data?.message || "Terjadi kesalahan", "error");
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

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-slate-100 overflow-y-auto max-h-[95vh]">
        {/* HEADER */}
        <h2 className="text-xs font-bold mb-4 text-slate-700 uppercase tracking-wider border-b pb-2 flex items-center justify-between">
          {initialData ? "Edit Data Karyawan" : "Tambah Karyawan Baru"}
          <span className="text-[9px] text-slate-400 font-semibold tracking-wide">
            Employee Form
          </span>
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-2 gap-4 text-xxs"
        >
          {/* FULL NAME */}
          <div className="col-span-2">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px] tracking-wide">
              Nama Lengkap
            </label>
            <input
              value={values.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              className={`${inputClasses({
                error: !!errors.full_name,
              })} transition-all focus:ring-2 focus:ring-emerald-500/30`}
              placeholder="Contoh: Budi Santoso"
            />
            {errors.full_name && (
              <p className="text-red-500 text-[10px] mt-0.5">
                {errors.full_name}
              </p>
            )}
          </div>

          {/* PHONE */}
          <div className="col-span-1">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px] tracking-wide">
              WhatsApp / Phone
            </label>
            <input
              value={values.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className={`${inputClasses({
                error: !!errors.phone,
              })} transition-all focus:ring-2 focus:ring-emerald-500/30`}
              placeholder="0812..."
            />
            {errors.phone && (
              <p className="text-red-500 text-[10px] mt-0.5">{errors.phone}</p>
            )}
          </div>

          {/* JOB TITLE */}
          <div className="col-span-1">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px] tracking-wide">
              Jabatan
            </label>
            <input
              value={values.job_title}
              onChange={(e) => handleChange("job_title", e.target.value)}
              className={`${inputClasses({
                error: !!errors.job_title,
              })} transition-all focus:ring-2 focus:ring-emerald-500/30`}
              placeholder="Contoh: Kasir / Manager"
            />
            {errors.job_title && (
              <p className="text-red-500 text-[10px] mt-0.5">
                {errors.job_title}
              </p>
            )}
          </div>

          {/* OUTLET */}
          <div className="col-span-1">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px] tracking-wide">
              Penempatan Outlet
            </label>
            <select
              value={values.outlet_id}
              onChange={(e) => handleChange("outlet_id", e.target.value)}
              className={`${inputClasses()} transition-all focus:ring-2 focus:ring-emerald-500/30`}
            >
              <option value="">Pusat / Global</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* STATUS */}
          <div className="col-span-1 flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={values.is_active}
                onChange={(e) => handleChange("is_active", e.target.checked)}
                className="w-3 h-3 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-600 font-bold uppercase text-[9px] tracking-wide">
                Karyawan Aktif
              </span>
            </label>
          </div>

          {/* ACTION */}
          <div className="col-span-2 flex justify-end gap-2 pt-4 border-t mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[10px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-100 transition"
            >
              Cancel
            </button>

            <SubmitButton
              isSubmitting={isSubmitting}
              label={initialData ? "Update" : "Save"}
              loadingLabel="Memproses..."
              fullWidth={false}
              className="text-[10px] font-bold uppercase py-1.5 px-6 rounded bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-sm hover:shadow-md transition"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
