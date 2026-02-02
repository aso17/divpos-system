import { useEffect, useState } from "react";
import SubmitButton from "../../components/SubmitButton";
import { rules } from "../../utils/validators/rules";
import { inputClasses } from "../../utils/validators/inputClasses";
import { assetUrl } from "../../utils/Url";
import { useFormValidation } from "../../hooks/useFormValidation";
import UsersService from "../../services/UsersService";
import RoleService from "../../services/RoleService";

export default function UserForm({
  open,
  onClose,
  initialData = null,
  onSuccess,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const { values, errors, handleChange, validate, setValues, setErrors } =
    useFormValidation(
      {
        full_name: "",
        email: "",
        username: "",
        phone: "",
        avatar: null,
        password: "",
        role_id: "",
        is_active: true,
      },
      {
        full_name: [
          (v) => rules.required(v, "Nama wajib diisi"),
          (v) => rules.noHtml(v, "Nama tidak boleh mengandung tag HTML"),
          (v) => rules.safeString(v, "Nama mengandung karakter ilegal"),
        ],
        email: [
          (v) => rules.required(v, "Email wajib diisi"),
          (v) => rules.email(v, "Format email tidak valid"),
          (v) => rules.noHtml(v, "Email tidak boleh mengandung tag HTML"),
        ],
        username: [
          (v) => rules.required(v, "Username wajib diisi"),
          (v) => rules.minLength(v, 4, "Username minimal 4 karakter"),
          (v) =>
            rules.username(
              v,
              "Username hanya boleh huruf, angka, titik, dan underscore",
            ),
          (v) => rules.noHtml(v, "Username tidak boleh mengandung tag HTML"),
        ],
        phone: [
          (v) => rules.required(v, "No HP wajib diisi"),
          (v) => rules.phoneID(v, "Format No HP tidak valid (Gunakan 08/628)"),
        ],
        avatar: [
          (file) => {
            if (!file) return null;
            return rules.fileType(
              file,
              ["image/jpeg", "image/png", "image/webp"],
              "Avatar harus JPG / PNG / WEBP",
            );
          },
          (file) => {
            if (!file) return null;
            return rules.fileSize(
              file,
              2 * 1024 * 1024,
              "Ukuran avatar max 2MB",
            );
          },
        ],
        role_id: [(v) => rules.required(v, "Role wajib dipilih")],
        password: [
          (v) => {
            // Wajib jika data baru, opsional jika sedang edit
            if (!initialData && !v) return "Password wajib diisi";
            // Jika user mengetikkan sesuatu (ingin ganti password), cek kekuatannya
            if (v) {
              return rules.strongPassword(
                v,
                8,
                "Password minimal 8 karakter, mengandung Huruf Besar, Kecil, Angka, dan Simbol",
              );
            }
            return null;
          },
        ],
      },
    );

  // Load roles saat modal dibuka
  useEffect(() => {
    if (open) {
      RoleService.GetRolesByTenant().then((res) => {
        setRoles(res.data?.data || []);
        // console.log("Loaded roles for UserForm:", res.data?.data || []);
      });
    }
  }, [open]);

  // Cleanup Preview Memory
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  // Inisialisasi data saat Edit atau Tambah
  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setValues({
        full_name: initialData.full_name || "",
        email: initialData.email || "",
        username: initialData.username || "",
        phone: initialData.phone || "",
        password: "",
        role_id: initialData.role.role_id || "",
        is_active: initialData.is_active == 1 || initialData.is_active === true,
      });
      setAvatarPreview(
        initialData.avatar ? assetUrl(initialData.avatar) : null,
      );
    } else {
      setValues({
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
  // console.log(initialData);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    const formData = new FormData();
    formData.append("full_name", values.full_name.trim());
    formData.append("email", values.email.trim());
    formData.append("username", values.username?.trim() || "");
    formData.append("phone", values.phone?.trim() || "");
    formData.append("role_id", values.role_id);
    formData.append("is_active", values.is_active ? 1 : 0);

    if (avatarFile instanceof File) {
      formData.append("avatar", avatarFile);
    }

    if (values.password) {
      formData.append("password", values.password);
    }

    if (initialData?.id) {
      formData.append("_method", "PUT");
    }

    try {
      setIsSubmitting(true);
      let response;

      if (initialData?.id) {
        response = await UsersService.updateUser(initialData.id, formData);
      } else {
        response = await UsersService.createUser(formData);
      }
      const successMsg = response.data?.message;
      triggerToast(successMsg, "success");
      const newUser = response.data?.datauser;
      if (newUser) {
        onSuccess?.(newUser);
      } else {
        onSuccess?.();
      }

      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message;
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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-lg overflow-y-auto max-h-[95vh]">
        <h2 className="text-xs font-bold mb-4 text-slate-700 uppercase tracking-wide border-b pb-2">
          {initialData ? "Edit User" : "Add User"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-2 gap-4 text-xxs"
        >
          {/* Avatar Upload */}
          <div className="col-span-2 flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-dashed">
            <div className="w-16 h-16 rounded-full bg-white overflow-hidden border-2 border-white shadow-sm shrink-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  No Image
                </div>
              )}
            </div>

            <div className="flex-1">
              <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
                Foto / Avatar
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setAvatarFile(file);
                  setAvatarPreview(URL.createObjectURL(file));
                  setErrors((prev) => ({ ...prev, avatar: null }));
                }}
                className="text-[10px] w-full file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xxs file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
              />
              {errors.avatar && (
                <p className="text-[10px] text-red-500 mt-1">{errors.avatar}</p>
              )}
            </div>
          </div>

          <div className="col-span-1">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
              Nama
            </label>
            <input
              value={values.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              className={inputClasses({ error: !!errors.full_name })}
            />
            {errors.full_name && (
              <p className="text-[10px] text-red-500 mt-1">
                {errors.full_name}
              </p>
            )}
          </div>

          <div className="col-span-1">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
              Email
            </label>
            <input
              type="email"
              value={values.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className={inputClasses({ error: !!errors.email })}
            />
            {errors.email && (
              <p className="text-[10px] text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          <div className="col-span-1">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
              Username
            </label>
            <input
              value={values.username}
              onChange={(e) => handleChange("username", e.target.value)}
              className={inputClasses({ error: !!errors.username })}
            />
            {errors.username && (
              <p className="text-[10px] text-red-500 mt-1">{errors.username}</p>
            )}
          </div>

          <div className="col-span-1">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
              Phone
            </label>
            <input
              value={values.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className={inputClasses({ error: !!errors.phone })}
              placeholder="628..."
            />
            {errors.phone && (
              <p className="text-[10px] text-red-500 mt-1">{errors.phone}</p>
            )}
          </div>

          <div className="col-span-2">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
              Password
            </label>
            <input
              type="password"
              value={values.password}
              onChange={(e) => handleChange("password", e.target.value)}
              className={inputClasses({ error: !!errors.password })}
              placeholder={
                initialData
                  ? "Kosongkan jika tidak diubah"
                  : "Minimal 8 karakter"
              }
            />
            {errors.password && (
              <p className="text-[10px] text-red-500 mt-1">{errors.password}</p>
            )}
          </div>

          <div className="col-span-1">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
              Role
            </label>
            <select
              value={values.role_id}
              onChange={(e) => handleChange("role_id", e.target.value)}
              className={inputClasses({ error: !!errors.role_id })}
            >
              <option value="">-- Pilih --</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.role_name}
                </option>
              ))}
            </select>
            {errors.role_id && (
              <p className="text-[10px] text-red-500 mt-1">{errors.role_id}</p>
            )}
          </div>

          <div className="col-span-1 flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={values.is_active}
                onChange={(e) => handleChange("is_active", e.target.checked)}
                className="w-3 h-3 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-600 font-bold uppercase text-[9px] group-hover:text-blue-600 transition-colors">
                User Active
              </span>
            </label>
          </div>

          <div className="col-span-2 flex justify-end gap-2 pt-4 border-t mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-slate-300 rounded text-[10px] font-bold uppercase text-slate-500 hover:bg-slate-50"
            >
              Cancel
            </button>
            <SubmitButton
              isSubmitting={isSubmitting}
              label={initialData ? "Update User" : "Save User"}
              loadingLabel="Saving..."
              fullWidth={false}
              className="text-[10px] font-bold uppercase py-1.5 px-6 rounded bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
