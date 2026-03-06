import { useEffect, useState } from "react";
import SubmitButton from "../../components/SubmitButton";
import { rules } from "../../utils/validators/rules";
import { inputClasses } from "../../utils/validators/inputClasses";
import { useFormValidation } from "../../hooks/useFormValidation";
import EmployeeService from "../../services/EmployeeService";
import RoleService from "../../services/RoleService";
import OutletService from "../../services/OutletService";

export default function EmployeeForm({
  open,
  onClose,
  initialData = null,
  onSuccess,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState([]);
  const [outlets, setOutlets] = useState([]);

  const { values, errors, handleChange, validate, setValues, setErrors } =
    useFormValidation(
      {
        full_name: "",
        phone: "",
        job_title: "",
        outlet_id: "",
        has_login: false,
        email: "",
        password: "",
        role_id: "",
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
        email: [
          (v, data) =>
            data.has_login && !v ? "Email wajib diisi untuk akses login" : null,
          (v) => rules.email(v),
        ],
        password: [
          (v, data) => {
            if (data.has_login && !initialData && !v)
              return "Password wajib diisi";
            if (v && v.length < 6) return "Minimal 6 karakter";
            return null;
          },
          (v) => (v ? rules.safeString(v) : null),
        ],
        role_id: [
          (v, data) =>
            data.has_login && !v
              ? "Role wajib dipilih untuk akses login"
              : null,
        ],
        outlet_id: [(v) => rules.noHtml(v)],
      },
    );

  useEffect(() => {
    if (open) {
      RoleService.GetRolesByTenant().then((res) =>
        setRoles(res.data?.data || []),
      );
      OutletService.getOutlets().then((res) =>
        setOutlets(res.data?.data || []),
      );
    }
  }, [open]);

  // 2. Sinkronisasi Data Awal (Edit mode)
  // console.log("Initial Data for EmployeeForm:", initialData);
  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setValues({
        full_name: initialData.full_name || "",
        phone: initialData.phone || "",
        job_title: initialData.job_title || "",
        outlet_id: initialData.outlet?.id || "",
        has_login: !!initialData.has_login,
        email: initialData.email || "",
        password: "",
        role_id: initialData.role.id || "",
        is_active: initialData.is_active === true,
      });
    } else {
      setValues({
        full_name: "",
        phone: "",
        job_title: "",
        outlet_id: "",
        has_login: false,
        email: "",
        password: "",
        role_id: "",
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
      // console.log("API Response:", response);
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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-lg overflow-y-auto max-h-[95vh]">
        <h2 className="text-xs font-bold mb-4 text-slate-700 uppercase tracking-wide border-b pb-2">
          {initialData ? "Edit Karyawan" : "Tambah Karyawan"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-2 gap-4 text-xxs"
        >
          <div className="col-span-2">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
              Nama Lengkap
            </label>
            <input
              value={values.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              className={inputClasses({ error: !!errors.full_name })}
            />
            {errors.full_name && (
              <p className="text-red-500 text-[10px]">{errors.full_name}</p>
            )}
          </div>

          <div className="col-span-1">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
              Phone
            </label>
            <input
              value={values.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className={inputClasses()}
            />
            {errors.phone && (
              <p className="text-red-500 text-[10px]">{errors.phone}</p>
            )}
          </div>

          <div className="col-span-1">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
              Jabatan
            </label>
            <input
              value={values.job_title}
              onChange={(e) => handleChange("job_title", e.target.value)}
              className={inputClasses()}
            />

            {errors.job_title && (
              <p className="text-red-500 text-[10px]">{errors.job_title}</p>
            )}
          </div>

          <div className="col-span-1">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
              Cabang / Outlet
            </label>
            <select
              value={values.outlet_id}
              onChange={(e) => handleChange("outlet_id", e.target.value)}
              className={inputClasses()}
            >
              <option value="">Pusat / Global</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-1 flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={values.is_active}
                onChange={(e) => handleChange("is_active", e.target.checked)}
                className="w-3 h-3 rounded"
              />
              <span className="text-slate-600 font-bold uppercase text-[9px]">
                Aktif
              </span>
            </label>
          </div>

          {/* OPSI LOGIN */}
          <div className="col-span-2 border-t pt-4 mt-2">
            <label className="flex items-center gap-2 cursor-pointer group p-3 bg-slate-50 rounded-lg border">
              <input
                type="checkbox"
                checked={values.has_login}
                onChange={(e) => handleChange("has_login", e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600"
              />
              <span className="text-emerald-700 font-bold uppercase text-[10px]">
                Berikan Akses Login Sistem?
              </span>
            </label>
          </div>

          {values.has_login && (
            <>
              <div className="col-span-1">
                <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
                  Email Login
                </label>
                <input
                  type="email"
                  value={values.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={inputClasses({ error: !!errors.email })}
                />
                {errors.email && (
                  <p className="text-red-500 text-[10px]">{errors.email}</p>
                )}
              </div>

              <div className="col-span-1">
                <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
                  Password
                </label>
                <input
                  type="password"
                  value={values.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className={inputClasses({ error: !!errors.password })}
                  placeholder={initialData ? "Kosongkan jika tidak ubah" : ""}
                />
                {errors.password && (
                  <p className="text-red-500 text-[10px]">{errors.password}</p>
                )}
              </div>

              <div className="col-span-2">
                <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
                  Role Akses
                </label>
                <select
                  value={values.role_id}
                  onChange={(e) => handleChange("role_id", e.target.value)}
                  className={inputClasses({ error: !!errors.role_id })}
                >
                  <option value="">-- Pilih Role --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.role_name}
                    </option>
                  ))}
                </select>
                {errors.role_id && (
                  <p className="text-red-500 text-[10px]">{errors.role_id}</p>
                )}
              </div>
            </>
          )}

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
              label={initialData ? "Update" : "Save"}
              loadingLabel="Memproses..."
              fullWidth={false}
              className="text-[10px] font-bold uppercase py-1.5 px-6 rounded bg-emerald-600 text-white"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
