import { useEffect, useRef, useState } from "react";
import Select from "react-select";
import SubmitButton from "../../components/SubmitButton";
import { rules } from "../../utils/validators/rules";
import { inputClasses } from "../../utils/validators/inputClasses";
import { useFormValidation } from "../../hooks/useFormValidation";
import UsersService from "../../services/UsersService";
import RoleService from "../../services/RoleService";
import EmployeeService from "../../services/EmployeeService";
import { GetWithExpiry } from "../../utils/Storage";
import { useAuth } from "../../context/AuthContext";

const triggerToast = (message, type) =>
  window.dispatchEvent(
    new CustomEvent("global-toast", { detail: { message, type } })
  );

export default function UserForm({
  open,
  onClose,
  initialData = null,
  onSuccess,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // FIX: simpan object URL terakhir di ref agar bisa di-revoke
  const objectUrlRef = useRef(null);

  const { user: authUserContext, updateUser } = useAuth();
  const authUser = authUserContext || GetWithExpiry("user");
  const isOwner = authUser?.is_owner === true;

  // FIX: satu sumber kebenaran — bandingkan ID, bukan email
  const isEditingSelf = !!(initialData && authUser?.id === initialData?.id);
  const isFieldDisabled = !isOwner || isEditingSelf;

  const { values, errors, handleChange, validate, setValues, setErrors } =
    useFormValidation(
      {
        employee_id: "",
        full_name: "",
        email: "",
        username: "",
        phone: "",
        password: "",
        role_id: "",
        is_active: true,
      },
      {
        employee_id: [
          (v) => (!initialData ? rules.required(v, "Pilih karyawan") : null),
        ],
        email: [
          (v) => rules.required(v, "Email login wajib diisi"),
          (v) => rules.email(v, "Format email salah"),
        ],
        username: [
          (v) => rules.required(v, "Username wajib diisi"),
          (v) => rules.minLength(v, 4, "Min. 4 karakter"),
        ],
        role_id: [
          (v) => (!isFieldDisabled ? rules.required(v, "Pilih role") : null),
        ],
        password: [
          (v) => {
            if (initialData && !v) return null;
            if (!initialData && !v) return "Password wajib diisi";
            if (v) return rules.strongPassword(v, 8, "Min 8 Karakter & Simbol");
            return null;
          },
        ],
      }
    );

  // ── Fetch roles + employees saat modal buka ───────────────────────────────
  useEffect(() => {
    if (!open) return;

    // FIX: tambah .catch() agar user tahu jika fetch gagal
    RoleService.GetRolesByTenant()
      .then((res) => setRoles(res.data?.data || []))
      .catch(() => triggerToast("Gagal memuat daftar role.", "error"));

    if (!initialData) {
      EmployeeService.getAvailableEmployees()
        .then((res) => {
          const options = (res.data?.data || []).map((emp) => ({
            value: emp.id,
            label: emp.full_name,
            raw: emp,
          }));
          setEmployees(options);
        })
        .catch(() => triggerToast("Gagal memuat daftar karyawan.", "error"));
    }
  }, [open, initialData]);

  // ── Reset state saat modal buka/tutup ─────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setValues({
        employee_id: initialData.employee?.id || "",
        full_name: initialData.full_name || "",
        email: initialData.email || "",
        username: initialData.username || "",
        phone: initialData.phone || "",
        password: "",
        role_id: (initialData.role?.id || "").toString(),
        is_active: initialData.is_active == 1,
      });
      setAvatarPreview(initialData.avatar || null);
    } else {
      setValues({
        employee_id: "",
        full_name: "",
        email: "",
        username: "",
        phone: "",
        password: "",
        role_id: "",
        is_active: true,
      });
      setAvatarPreview(null);
    }

    setAvatarFile(null);
    setErrors({});
  }, [open, initialData, setValues, setErrors]);

  // FIX: revoke object URL saat komponen unmount untuk cegah memory leak
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  // ── Employee select ───────────────────────────────────────────────────────
  const handleEmployeeSelect = (selectedOption) => {
    if (!selectedOption) return;
    const { raw } = selectedOption;
    setValues((prev) => ({
      ...prev,
      employee_id: raw.id,
      full_name: raw.full_name || "",
      email: raw.email || "",
      phone: raw.phone || "",
      username: raw.full_name.toLowerCase().replace(/\s+/g, "."),
    }));
    setErrors({});
  };

  // ── Avatar file picker ────────────────────────────────────────────────────
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // FIX: revoke URL lama sebelum buat yang baru
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const newUrl = URL.createObjectURL(file);
    objectUrlRef.current = newUrl;
    setAvatarFile(file);
    setAvatarPreview(newUrl);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !validate()) return;

    const formData = new FormData();
    Object.keys(values).forEach((key) => {
      if (values[key] !== null && values[key] !== "") {
        formData.append(
          key,
          key === "is_active" ? (values[key] ? 1 : 0) : values[key]
        );
      }
    });
    if (avatarFile) formData.append("avatar", avatarFile);
    if (initialData?.id) formData.append("_method", "PUT");

    try {
      setIsSubmitting(true);

      const response = initialData?.id
        ? await UsersService.updateUser(initialData.id, formData)
        : await UsersService.createUser(formData);

      const newUserData = response.data?.data;

      // FIX: gunakan ID untuk deteksi edit diri sendiri — bukan email comparison
      // isEditingSelf sudah dihitung dengan ID di atas komponen, tinggal pakai.
      if (isEditingSelf && newUserData && updateUser) {
        updateUser(newUserData);
      }

      triggerToast(response.data?.message, "success");
      onSuccess?.(newUserData);
      onClose();
    } catch (err) {
      triggerToast(err.response?.data?.message || "Error", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 backdrop-blur-sm bg-slate-900/40
      flex items-center justify-center p-4"
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden
        border border-slate-100 flex flex-col max-h-[95vh]"
      >
        {/* Header */}
        <div
          className="px-5 py-3 bg-gradient-to-r from-slate-50 to-white
          border-b flex justify-between items-center"
        >
          <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
            {initialData ? "Edit User Access" : "New User Account"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-rose-500 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-x-3 gap-y-4"
        >
          {/* Avatar + select karyawan */}
          <div
            className="col-span-2 flex items-center gap-4 bg-slate-50/80 p-3
            rounded-xl border border-slate-100 mb-1"
          >
            <div className="relative">
              <div
                className="w-14 h-14 rounded-full bg-white border-2 border-white
                shadow-sm overflow-hidden ring-1 ring-slate-100"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    className="w-full h-full object-cover"
                    alt="Preview"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center
                    bg-slate-100 text-slate-300 text-[8px]"
                  >
                    No Photo
                  </div>
                )}
              </div>
              <label
                className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1
                rounded-full cursor-pointer shadow-md border border-white"
              >
                <svg
                  className="w-2.5 h-2.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {/* FIX: pakai handler terpisah yang revoke URL lama */}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>

            <div className="flex-grow">
              <label className="block mb-1 text-slate-500 font-bold uppercase text-[8px]">
                Data karyawan
              </label>
              {!initialData ? (
                <Select
                  options={employees}
                  onChange={handleEmployeeSelect}
                  placeholder="Select or search Employee..."
                  className="text-[10px]"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderRadius: "8px",
                      minHeight: "32px",
                      borderColor: state.isFocused ? "#10b981" : "#10b98180",
                      boxShadow: state.isFocused ? "0 0 0 1px #10b981" : "none",
                      "&:hover": { borderColor: "#10b981" },
                    }),
                    placeholder: (base) => ({ ...base, color: "#94a3b8" }),
                  }}
                />
              ) : (
                <div
                  className="text-[10px] font-bold bg-emerald-50/30 p-2
                  rounded-lg border border-emerald-500/50"
                >
                  {values.full_name}
                </div>
              )}
              {errors.employee_id && (
                <p className="text-[8px] text-rose-500 mt-1">
                  {errors.employee_id}
                </p>
              )}
            </div>
          </div>

          {/* Full Name — read only */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
              Full Name
            </label>
            <input
              value={values.full_name}
              readOnly
              placeholder="Auto-filled"
              className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg
                text-slate-500 cursor-not-allowed text-[10px] outline-none"
            />
          </div>

          {/* Phone — read only */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
              Phone
            </label>
            <input
              value={values.phone}
              readOnly
              placeholder="Auto-filled"
              className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg
                text-slate-500 cursor-not-allowed text-[10px] outline-none"
            />
          </div>

          {/* Username */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
              Username
            </label>
            <input
              value={values.username}
              onChange={(e) => handleChange("username", e.target.value)}
              placeholder="username"
              className={
                inputClasses({ error: !!errors.username }) +
                " rounded-lg p-2 text-[10px]"
              }
            />
            {errors.username && (
              <p className="text-[8px] text-rose-500 mt-1">{errors.username}</p>
            )}
          </div>

          {/* Email */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
              Email Login
            </label>
            <input
              value={values.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="name@mail.com"
              className={
                inputClasses({ error: !!errors.email }) +
                " rounded-lg p-2 text-[10px]"
              }
            />
            {errors.email && (
              <p className="text-[8px] text-rose-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="col-span-2">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
              Password Access
            </label>
            <input
              type="password"
              value={values.password}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder={
                initialData ? "Keep empty to stay same" : "Set password"
              }
              className={
                inputClasses({ error: !!errors.password }) +
                " rounded-lg p-2 text-[10px]"
              }
            />
            {errors.password && (
              <p className="text-[8px] text-rose-500 mt-1">{errors.password}</p>
            )}
          </div>

          {/* Role */}
          <div className="col-span-1">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
              Assign Role
            </label>
            <select
              value={values.role_id}
              disabled={isFieldDisabled}
              onChange={(e) => handleChange("role_id", e.target.value)}
              className={
                inputClasses({ error: !!errors.role_id }) +
                ` rounded-lg p-2 text-[10px] border-emerald-500/50
                ${
                  isFieldDisabled
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : ""
                }`
              }
            >
              <option value="">-- Role --</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.role_name}
                </option>
              ))}
            </select>
            {isFieldDisabled && (
              <p className="text-[7px] text-slate-400 mt-1 italic tracking-tight">
                {isEditingSelf
                  ? "*Hak akses akun sendiri tidak dapat diubah"
                  : "*Wewenang Owner diperlukan untuk mengubah role"}
              </p>
            )}
            {errors.role_id && (
              <p className="text-[8px] text-rose-500 mt-1">{errors.role_id}</p>
            )}
          </div>

          {/* Is Active */}
          <div className="col-span-1 flex items-end pb-2">
            <label
              className={`flex items-center gap-2
              ${
                isFieldDisabled
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer"
              }`}
            >
              <input
                type="checkbox"
                disabled={isFieldDisabled}
                checked={values.is_active}
                onChange={(e) => handleChange("is_active", e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600"
              />
              <span className="text-slate-600 font-bold uppercase text-[9px]">
                User Active
              </span>
            </label>
          </div>

          {/* Footer */}
          <div className="col-span-2 flex justify-end gap-2 pt-4 border-t mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[10px] font-black uppercase bg-rose-50 text-rose-600
                border border-rose-100 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
            >
              Cancel
            </button>
            <SubmitButton
              isSubmitting={isSubmitting}
              label={initialData ? "Update User" : "Create User"}
              loadingLabel="Processing..."
              fullWidth={false}
              className="text-[10px] font-bold uppercase py-1.5 px-6 rounded
                bg-blue-600 shadow-sm shadow-blue-200"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
