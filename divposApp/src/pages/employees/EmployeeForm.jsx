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
  const [hasLogin, setHasLogin] = useState(false);

  const { values, errors, handleChange, validate, setValues, setErrors } =
    useFormValidation(
      {
        full_name: "",
        // employee_code dihapus dari initial state karena di-generate BE
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
        full_name: [(v) => rules.required(v, "Nama wajib diisi")],
        // employee_code: [], // Validasi NIK dihapus
        email: [
          (v, data) => (data.has_login && !v ? "Email wajib diisi" : null),
          (v) => (v && !rules.email(v) ? "Format email tidak valid" : null),
        ],
        password: [
          (v, data) => {
            if (data.has_login && !initialData && !v)
              return "Password wajib diisi";
            if (v && v.length < 6) return "Minimal 6 karakter";
            return null;
          },
        ],
        role_id: [
          (v, data) => (data.has_login && !v ? "Role wajib dipilih" : null),
        ],
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

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      const hasLoginAccess = !!initialData.user_id;
      setValues({
        full_name: initialData.full_name || "",
        // employee_code tidak di-set di sini
        phone: initialData.phone || "",
        job_title: initialData.job_title || "",
        outlet_id: initialData.outlet_id || "",
        has_login: hasLoginAccess,
        email: initialData.user?.email || "",
        password: "",
        role_id: initialData.user?.role_id || "",
        is_active: initialData.is_active == 1 || initialData.is_active === true,
      });
      setHasLogin(hasLoginAccess);
    } else {
      setValues({
        full_name: "",
        // employee_code: "", // Dihapus
        phone: "",
        job_title: "",
        outlet_id: "",
        has_login: false,
        email: "",
        password: "",
        role_id: "",
        is_active: true,
      });
      setHasLogin(false);
    }
    setErrors({});
  }, [open, initialData, setValues, setErrors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    const payload = {
      ...values,
      has_login: hasLogin,
    };

    try {
      setIsSubmitting(true);
      let response;

      if (initialData?.id) {
        response = await EmployeeService.updateEmployee(
          initialData.id,
          payload,
        );
      } else {
        response = await EmployeeService.createEmployee(payload);
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
      new CustomEvent("global-toast", {
        detail: { message, type },
      }),
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
          {/* DATA PROFIL KARYAWAN */}
          <div className="col-span-2 text-sm font-bold text-slate-700">
            Data Diri
          </div>

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

          {/* INPUT NIK DIHAPUS DARI SINI */}

          <div className="col-span-1">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
              Phone
            </label>
            <input
              value={values.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className={inputClasses()}
            />
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

          {/* OPSI LOGIN - PENTING */}
          <div className="col-span-2 border-t pt-4 mt-2">
            <label className="flex items-center gap-2 cursor-pointer group p-3 bg-slate-50 rounded-lg border">
              <input
                type="checkbox"
                checked={hasLogin}
                onChange={(e) => {
                  setHasLogin(e.target.checked);
                  handleChange("has_login", e.target.checked);
                }}
                className="w-4 h-4 rounded text-emerald-600"
              />
              <span className="text-emerald-700 font-bold uppercase text-[10px]">
                Berikan Akses Login Sistem?
              </span>
            </label>
          </div>

          {/* FIELD LOGIN - Tampil jika hasLogin true */}
          {hasLogin && (
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
              className="px-4 py-2 text-[10px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
            >
              Cancel
            </button>
            <SubmitButton
              isSubmitting={isSubmitting}
              label={initialData ? "Update" : "Save"}
              loadingLabel="Memproses..."
              fullWidth={false}
              className="text-[10px] font-bold uppercase py-1.5 px-6 rounded bg-emerald-600 hover:bg-emerald-700 text-white"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
