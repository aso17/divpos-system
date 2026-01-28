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
        full_name: [(v) => rules.required(v, "Nama wajib diisi")],
        email: [
          (v) => rules.required(v, "Email wajib diisi"),
          (v) => rules.email(v, "Format email tidak valid"),
        ],
        username: [
          (v) => rules.required(v, "Username wajib diisi"),
          (v) => rules.minLength(v, 4, "Username minimal 4 karakter"),
        ],
        phone: [
          (v) => rules.required(v, "No HP wajib diisi"),
          (v) => rules.noLetters(v, "No HP tidak boleh mengandung huruf"),
        ],
        avatar: [
          (file) => {
            // Jika file tidak ada, langsung keluar dan kembalikan null (berarti VALID)
            if (!file) return null;

            // Jika ada file, baru jalankan aturan fileType
            return rules.fileType(
              file,
              ["image/jpeg", "image/png", "image/webp"],
              "Avatar harus JPG / PNG / WEBP",
            );
          },
          (file) => {
            if (!file) return null;

            // Jika ada file, baru jalankan aturan fileSize
            return rules.fileSize(
              file,
              2 * 1024 * 1024,
              "Ukuran avatar max 2MB",
            );
          },
        ],
        role_id: [(v) => rules.required(v, "Role wajib dipilih")],
        password: [
          (v) =>
            !initialData
              ? rules.strongPassword(v, 8, "Password harus kuat (Aa1@...)")
              : null,
        ],
      },
    );

  // Load roles
  useEffect(() => {
    RoleService.getRoles().then((res) => {
      setRoles(res.data || []);
    });
  }, []);

  // Cleanup Preview Memory (Mencegah Lag/Memory Leak)
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  // Reset form
  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setValues({
        full_name: initialData.full_name || "",
        email: initialData.email || "",
        username: initialData.username || "",
        phone: initialData.phone || "",
        password: "",
        role_id: initialData.role_id || "",
        is_active: initialData.is_active ?? true,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    // OPTIMASI: Gunakan FormData karena mengirim File
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

    // Method Spoofing jika backend butuh PUT via FormData
    if (initialData?.id) {
      formData.append("_method", "PUT");
    }

    try {
      setIsSubmitting(true);
      if (initialData?.id) {
        await UsersService.updateUser(initialData.id, formData);
        triggerToast("User berhasil diupdate", "success");
      } else {
        await UsersService.createUser(formData);
        triggerToast("User berhasil ditambahkan", "success");
      }
      onSuccess?.(); // Panggil onSuccess SEBELUM onClose agar data table refresh
      onClose();
    } catch (err) {
      console.error("Submit failed", err);
      const errorMsg = err.response?.data?.message || "Gagal menyimpan user";
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
  console.log(errors.avatar);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-lg">
        <h2 className="text-xxs font-bold mb-4 text-slate-700 uppercase tracking-wide">
          {initialData ? "Edit User" : "Add User"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-2 gap-4 text-xxs"
          encType="multipart/form-data"
        >
          {/* Avatar Upload */}
          <div className="col-span-2 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden border">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">
                  No Image
                </div>
              )}
            </div>

            <div>
              <label className="block mb-1 text-slate-600 font-medium">
                Foto / Avatar
              </label>
              <input
                type="file"
                name="avatar"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setValues((v) => ({ ...v, avatar: file }));
                  setAvatarFile(file);
                  setAvatarPreview(URL.createObjectURL(file));
                }}
                className="border rounded px-2 py-1 w-full"
              />

              {errors.avatar && (
                <p className="text-[10px] text-red-500 mt-1">{errors.avatar}</p>
              )}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block mb-1 text-slate-600 font-medium">
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

          {/* Email */}
          <div>
            <label className="block mb-1 text-slate-600 font-medium">
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

          {/* Username */}
          <div>
            <label className="block mb-1 text-slate-600 font-medium">
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

          {/* Phone */}
          <div>
            <label className="block mb-1 text-slate-600 font-medium">
              Phone
            </label>
            <input
              value={values.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className={inputClasses({ error: !!errors.phone })}
              placeholder="6281xxxxxxxx"
            />
            {errors.phone && (
              <p className="text-[10px] text-red-500 mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Password */}
          <div className="col-span-2">
            <label className="block mb-1 text-slate-600 font-medium">
              Password
            </label>
            <input
              type="password"
              value={values.password}
              onChange={(e) => handleChange("password", e.target.value)}
              className={inputClasses({ error: !!errors.password })}
              placeholder={initialData ? "Kosongkan jika tidak diubah" : ""}
            />
            {errors.password && (
              <p className="text-[10px] text-red-500 mt-1">{errors.password}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block mb-1 text-slate-600 font-medium">
              Role
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
              <p className="text-[10px] text-red-500 mt-1">{errors.role_id}</p>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              checked={values.is_active}
              onChange={(e) => handleChange("is_active", e.target.checked)}
            />
            <span className="text-slate-600">Active</span>
          </div>

          {/* Footer */}
          <div className="col-span-2 flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-300 rounded-md text-xs text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>

            <SubmitButton
              isSubmitting={isSubmitting}
              label={initialData ? "Update" : "Save"}
              loadingLabel="Saving..."
              fullWidth={false}
              className="text-xs py-1.5 rounded-md bg-gokucekBlue"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
