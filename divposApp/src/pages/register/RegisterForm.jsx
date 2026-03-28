import { useState } from "react";
import { useFormValidation } from "../../hooks/useFormValidation";
import { rules } from "../../utils/validators/rules";
import { inputClasses } from "../../utils/validators/inputClasses";

export default function RegisterForm({
  onSubmit = () => {},
  isSubmitting = false,
  businessTypes = [],
}) {
  const [step, setStep] = useState(1);

  const { values, errors, handleChange, validate, setErrors } =
    useFormValidation(
      {
        // Step 1 — Business Info
        name: "",
        business_type_id: "",
        address: "",
        city: "",
        // Step 2 — Owner / Account
        full_name: "", // → Ms_employees.full_name (NOT NULL)
        email: "",
        phone: "",
        password: "",
        confirm_password: "",
        // username TIDAK ada di form — auto-generate di backend dari email
      },
      {
        name: [(v) => rules.required(v, "Nama bisnis wajib diisi")],
        business_type_id: [(v) => rules.required(v, "Pilih jenis bisnis")],
        address: [(v) => rules.required(v, "Alamat wajib diisi")],
        city: [(v) => rules.required(v, "Kota wajib diisi")],
        full_name: [
          (v) => rules.required(v, "Nama lengkap wajib diisi"),
          (v) => rules.minLength(v, 3, "Min. 3 karakter"),
        ],
        email: [
          (v) => rules.required(v, "Email wajib diisi"),
          (v) => rules.email(v, "Format email salah"),
        ],
        phone: [
          (v) => rules.required(v, "No. HP wajib diisi"),
          (v) => rules.minLength(v, 10, "Min. 10 digit"),
        ],
        password: [
          (v) => rules.required(v, "Password wajib diisi"),
          (v) => rules.strongPassword(v, 8, "Min 8 Karakter, Huruf & Simbol"),
        ],
        confirm_password: [
          (v) => rules.required(v, "Konfirmasi password wajib diisi"),
          (v, allValues) => v === allValues.password || "Password tidak cocok",
        ],
      }
    );

  const handleNext = () => {
    const step1Fields = ["name", "business_type_id", "address", "city"];
    const isValid = validate(step1Fields);
    if (isValid) setStep(2);
  };

  // Re-validate confirm_password saat password berubah
  const handlePasswordChange = (val) => {
    handleChange("password", val);
    if (values.confirm_password) {
      handleChange("confirm_password", values.confirm_password);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 1) {
      handleNext();
    } else {
      if (validate()) {
        // Backend RegistrationRequest.prepareForValidation() handle:
        // - confirm_password → password_confirmation
        // - username         → auto-generate dari email
        onSubmit(values);
      }
    }
  };

  const prevStep = () => {
    setStep(1);
    setErrors({});
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 flex flex-col justify-between"
    >
      <div>
        {/* STEP INDICATOR — >= agar step selesai tetap hijau */}
        <div className="flex justify-center mb-6 space-x-2">
          <div
            className={`h-1.5 w-10 rounded-full transition-all ${
              step >= 1 ? "bg-emerald-500" : "bg-slate-200"
            }`}
          />
          <div
            className={`h-1.5 w-10 rounded-full transition-all ${
              step >= 2 ? "bg-emerald-500" : "bg-slate-200"
            }`}
          />
        </div>

        <p className="text-center text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-6 font-bold italic">
          {step === 1 ? "Step 1: Business Info" : "Step 2: Account Security"}
        </p>

        {/* STEP 1: INFORMASI BISNIS */}
        {step === 1 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-1">
              <label
                htmlFor="name"
                className="text-[9px] font-black text-slate-500 uppercase ml-1"
              >
                Nama Bisnis
              </label>
              <input
                id="name"
                type="text"
                value={values.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Nama Bisnis"
                className={
                  inputClasses({ error: !!errors.name }) +
                  " rounded-xl px-4 py-2.5 text-sm"
                }
              />
              {errors.name && (
                <p className="text-[8px] text-rose-500 ml-1">{errors.name}</p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="business_type_id"
                className="text-[9px] font-black text-slate-500 uppercase ml-1"
              >
                Jenis Bisnis
              </label>
              <select
                id="business_type_id"
                value={values.business_type_id}
                onChange={(e) =>
                  handleChange("business_type_id", e.target.value)
                }
                className={
                  inputClasses({ error: !!errors.business_type_id }) +
                  " rounded-xl px-4 py-2.5 text-sm appearance-none"
                }
              >
                <option value="">-- Pilih Tipe --</option>
                {businessTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {errors.business_type_id && (
                <p className="text-[8px] text-rose-500 ml-1">
                  {errors.business_type_id}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="city"
                className="text-[9px] font-black text-slate-500 uppercase ml-1"
              >
                Kota
              </label>
              <input
                id="city"
                type="text"
                value={values.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="Contoh: DKI Jakarta"
                className={
                  inputClasses({ error: !!errors.city }) +
                  " rounded-xl px-4 py-2.5 text-sm"
                }
              />
              {errors.city && (
                <p className="text-[8px] text-rose-500 ml-1">{errors.city}</p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="address"
                className="text-[9px] font-black text-slate-500 uppercase ml-1"
              >
                Alamat Utama
              </label>
              <textarea
                id="address"
                value={values.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Alamat lengkap -..."
                rows="2"
                className={
                  inputClasses({ error: !!errors.address }) +
                  " rounded-xl px-4 py-2 text-sm resize-none"
                }
              />
              {errors.address && (
                <p className="text-[8px] text-rose-500 ml-1">
                  {errors.address}
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: DATA OWNER & KEAMANAN AKUN */}
        {step === 2 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* full_name → Ms_employees.full_name (NOT NULL) */}
            <div className="space-y-1">
              <label
                htmlFor="full_name"
                className="text-[9px] font-black text-slate-500 uppercase ml-1"
              >
                Nama Lengkap Owner
              </label>
              <input
                id="full_name"
                type="text"
                value={values.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                placeholder="Nama sesuai identitas"
                className={
                  inputClasses({ error: !!errors.full_name }) +
                  " rounded-xl px-4 py-2.5 text-sm"
                }
              />
              {errors.full_name && (
                <p className="text-[8px] text-rose-500 ml-1">
                  {errors.full_name}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="email"
                className="text-[9px] font-black text-slate-500 uppercase ml-1"
              >
                Email Owner
              </label>
              <input
                id="email"
                type="email"
                value={values.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="email@bisnis.com"
                className={
                  inputClasses({ error: !!errors.email }) +
                  " rounded-xl px-4 py-2.5 text-sm"
                }
              />
              {errors.email && (
                <p className="text-[8px] text-rose-500 ml-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="phone"
                className="text-[9px] font-black text-slate-500 uppercase ml-1"
              >
                WhatsApp / No. HP
              </label>
              <input
                id="phone"
                type="tel"
                value={values.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="0812xxxx"
                className={
                  inputClasses({ error: !!errors.phone }) +
                  " rounded-xl px-4 py-2.5 text-sm"
                }
              />
              {errors.phone && (
                <p className="text-[8px] text-rose-500 ml-1">{errors.phone}</p>
              )}
            </div>

            {/* PASSWORD GRID */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="text-[9px] font-black text-slate-500 uppercase ml-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={values.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="Min. 8 Karakter"
                  className={
                    inputClasses({ error: !!errors.password }) +
                    " rounded-xl px-4 py-2.5 text-sm"
                  }
                />
                {errors.password && (
                  <p className="text-[8px] text-rose-500 ml-1">
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="confirm_password"
                  className="text-[9px] font-black text-slate-500 uppercase ml-1"
                >
                  Konfirmasi
                </label>
                <input
                  id="confirm_password"
                  type="password"
                  value={values.confirm_password}
                  onChange={(e) =>
                    handleChange("confirm_password", e.target.value)
                  }
                  placeholder="Ulangi Password"
                  className={
                    inputClasses({ error: !!errors.confirm_password }) +
                    " rounded-xl px-4 py-2.5 text-sm"
                  }
                />
                {errors.confirm_password && (
                  <p className="text-[8px] text-rose-500 ml-1">
                    {errors.confirm_password}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="flex space-x-3 pt-6 border-t border-slate-50">
        {step === 2 && (
          <button
            type="button"
            onClick={prevStep}
            className="flex-1 py-3 rounded-full text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all"
          >
            Back
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`flex-[2] py-3 rounded-full text-white text-[10px] font-black tracking-widest transition-all active:scale-95 disabled:opacity-50 uppercase shadow-lg ${
            step === 1
              ? "bg-emerald-500 shadow-emerald-100 hover:bg-emerald-600"
              : "bg-slate-800 shadow-slate-200 hover:bg-slate-900"
          }`}
        >
          {step === 1
            ? "Next Step"
            : isSubmitting
            ? "Processing..."
            : "Finish Registration"}
        </button>
      </div>
    </form>
  );
}
