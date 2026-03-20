import { useEffect, useState } from "react";
import SubmitButton from "../../components/SubmitButton";
import { rules } from "../../utils/validators/rules";
import { inputClasses } from "../../utils/validators/inputClasses";
import { useFormValidation } from "../../hooks/useFormValidation";
import CustomerService from "../../services/CustomerService";

const triggerToast = (message, type) =>
  window.dispatchEvent(
    new CustomEvent("global-toast", { detail: { message, type } })
  );

export default function CustomerForm({
  open,
  onClose,
  initialData = null,
  onSuccess,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Validasi — pola UserForm ──────────────────────────────────────────────
  const { values, errors, handleChange, validate, setValues, setErrors } =
    useFormValidation(
      {
        name: "",
        phone: "",
        email: "",
        address: "",
        gender: "",
        is_active: true,
      },
      {
        name: [
          (v) => rules.required(v, "Nama pelanggan wajib diisi"),
          (v) => rules.minLength(v, 2, "Minimal 2 karakter"),
          (v) => rules.maxLength(v, 100, "Maksimal 100 karakter"),
          // Hanya huruf, spasi, apostrof, titik, strip
          (v) =>
            /^[a-zA-Z\s'.\-]+$/.test(v)
              ? null
              : "Nama hanya boleh mengandung huruf dan karakter nama standar",
          // Cegah URL
          (v) =>
            /(http|https|www|\.com|\.net|\.id)/i.test(v)
              ? "Nama tidak boleh mengandung link atau URL"
              : null,
          // Cegah karakter berulang spam
          (v) =>
            /(.)\1{4,}/.test(v)
              ? "Nama tidak valid (pengulangan karakter berlebih)"
              : null,
        ],

        phone: [
          (v) => rules.required(v, "Nomor telepon wajib diisi"),
          (v) => (/^\d+$/.test(v) ? null : "Nomor telepon harus berupa angka"),
          (v) => (v.length >= 10 ? null : "Nomor telepon minimal 10 digit"),
          (v) => (v.length <= 15 ? null : "Nomor telepon maksimal 15 digit"),
        ],

        email: [
          // Opsional — hanya validasi jika diisi
          (v) =>
            !v || rules.email(v, "Format email tidak valid") === null
              ? null
              : rules.email(v, "Format email tidak valid"),
          (v) => (!v || v.length <= 100 ? null : "Email maksimal 100 karakter"),
        ],

        address: [
          (v) =>
            !v || v.length <= 500 ? null : "Alamat maksimal 500 karakter",
          // Tolak script / HTML / URL
          (v) =>
            !v || !/<[^>]*>/.test(v)
              ? null
              : "Alamat mengandung karakter yang tidak diizinkan",
          (v) =>
            !v || !/(http|https|www)/i.test(v)
              ? null
              : "Alamat tidak boleh mengandung link",
        ],

        gender: [], // opsional, enum — tidak perlu rule khusus
      }
    );

  // ── Reset saat modal buka — pola useEffect UserForm ───────────────────────
  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setValues({
        name: initialData.name || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        address: initialData.address || "",
        gender: initialData.gender || "",
        is_active: initialData.is_active ?? true,
      });
    } else {
      setValues({
        name: "",
        phone: "",
        email: "",
        address: "",
        gender: "",
        is_active: true,
      });
    }

    setErrors({});
    setIsSubmitting(false);
  }, [open, initialData, setValues, setErrors]);

  // ── Submit — pola UserForm ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !validate()) return;

    // Bersihkan field kosong opsional sebelum kirim
    const payload = {
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email.trim() || undefined,
      address: values.address.trim() || undefined,
      gender: values.gender || undefined,
      is_active: values.is_active ? 1 : 0,
    };

    try {
      setIsSubmitting(true);

      const response = initialData?.id
        ? await CustomerService.updateCustomer(initialData.id, payload)
        : await CustomerService.createCustomer(payload);

      const newData = response.data?.data;
      triggerToast(response.data?.message || "Berhasil disimpan.", "success");
      onSuccess?.(newData);
      onClose();
    } catch (err) {
      triggerToast(
        err.response?.data?.message || "Terjadi kesalahan.",
        "error"
      );
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
        {/* ── Header — pola UserForm ── */}
        <div
          className="px-5 py-3 bg-gradient-to-r from-slate-50 to-white
          border-b flex justify-between items-center"
        >
          <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
            {initialData ? "Edit Data Pelanggan" : "Tambah Pelanggan Baru"}
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

        {/* ── Form — grid 2 kolom seperti UserForm ── */}
        <form
          onSubmit={handleSubmit}
          className="p-5 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-x-3 gap-y-4"
        >
          {/* ── Nama — full width ── */}
          <div className="col-span-2">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
              Nama Pelanggan <span className="text-red-500">*</span>
            </label>
            <input
              value={values.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className={
                inputClasses({ error: !!errors.name }) +
                " rounded-lg p-2 text-[10px]"
              }
            />
            {errors.name && (
              <p className="text-[8px] text-rose-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* ── Phone ── */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
              Nomor Telepon <span className="text-red-500">*</span>
            </label>
            <input
              value={values.phone}
              onChange={(e) =>
                handleChange("phone", e.target.value.replace(/\D/g, ""))
              }
              placeholder="08xxxxxxxxxx"
              inputMode="numeric"
              maxLength={15}
              className={
                inputClasses({ error: !!errors.phone }) +
                " rounded-lg p-2 text-[10px]"
              }
            />
            {errors.phone && (
              <p className="text-[8px] text-rose-500 mt-1">{errors.phone}</p>
            )}
          </div>

          {/* ── Gender ── */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
              Gender
            </label>
            <select
              value={values.gender}
              onChange={(e) => handleChange("gender", e.target.value)}
              className={
                inputClasses({ error: !!errors.gender }) +
                " rounded-lg p-2 text-[10px]"
              }
            >
              <option value="">-- Pilih --</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>

          {/* ── Email ── */}
          <div className="col-span-2">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
              Email
              <span className="text-slate-400 font-normal ml-1 normal-case">
                (opsional)
              </span>
            </label>
            <input
              value={values.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="pelanggan@email.com"
              type="email"
              className={
                inputClasses({ error: !!errors.email }) +
                " rounded-lg p-2 text-[10px]"
              }
            />
            {errors.email && (
              <p className="text-[8px] text-rose-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* ── Alamat ── */}
          <div className="col-span-2">
            <label className="block mb-1 text-slate-600 font-bold uppercase text-[9px]">
              Alamat
              <span className="text-slate-400 font-normal ml-1 normal-case">
                (opsional)
              </span>
            </label>
            <textarea
              value={values.address}
              onChange={(e) => handleChange("address", e.target.value)}
              rows={3}
              placeholder="Jl. Contoh No. 123, Kota..."
              className={
                inputClasses({ error: !!errors.address }) +
                " rounded-lg p-2 text-[10px] min-h-[70px] resize-none leading-relaxed"
              }
            />
            {errors.address && (
              <p className="text-[8px] text-rose-500 mt-1">{errors.address}</p>
            )}
          </div>

          {/* ── Status aktif ── */}
          <div className="col-span-2 flex items-center pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={values.is_active}
                onChange={(e) => handleChange("is_active", e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600
                  focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-slate-600 font-bold uppercase text-[9px]">
                Pelanggan Aktif
              </span>
            </label>
          </div>

          {/* ── Footer — pola UserForm ── */}
          <div className="col-span-2 flex justify-end gap-2 pt-4 border-t mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[10px] font-black uppercase
                bg-rose-50 text-rose-600 border border-rose-100
                hover:bg-rose-500 hover:text-white rounded-lg transition-all"
            >
              Batal
            </button>
            <SubmitButton
              isSubmitting={isSubmitting}
              label={initialData ? "Simpan Perubahan" : "Tambah Pelanggan"}
              loadingLabel="Menyimpan..."
              fullWidth={false}
              className="text-[10px] font-bold uppercase py-1.5 px-6 rounded
                bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-200"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
