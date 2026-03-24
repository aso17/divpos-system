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

  // --- INTEGRASI useFormValidation ---
  const { values, errors, handleChange, validate, setErrors } =
    useFormValidation(
      {
        // INITIAL VALUES
        name: "",
        business_type_id: "",
        address: "",
        email: "",
        phone: "",
        password: "",
      },
      {
        // VALIDATION SCHEMA (Sesuai kolom Ms_tenants)
        name: [(v) => rules.required(v, "Nama bisnis wajib diisi")],
        business_type_id: [(v) => rules.required(v, "Pilih jenis bisnis")],
        address: [(v) => rules.required(v, "Alamat wajib diisi")],
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
      }
    );

  const handleNext = () => {
    // Validasi field Step 1 saja
    const step1Fields = ["name", "business_type_id", "address"];
    const isValid = validate(step1Fields);

    if (isValid) {
      setStep(2);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 1) {
      handleNext();
    } else {
      // Validasi semua field sebelum submit final
      if (validate()) {
        onSubmit(values);
      }
    }
  };

  const prevStep = () => {
    setStep(1);
    setErrors({}); // Bersihkan error saat balik agar tidak mengganggu visual
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 min-h-[350px] flex flex-col justify-between"
    >
      <div>
        {/* STEP INDICATOR */}
        <div className="flex justify-center mb-6 space-x-2">
          <div
            className={`h-1.5 w-10 rounded-full transition-all ${
              step === 1 ? "bg-emerald-500" : "bg-slate-200"
            }`}
          ></div>
          <div
            className={`h-1.5 w-10 rounded-full transition-all ${
              step === 2 ? "bg-emerald-500" : "bg-slate-200"
            }`}
          ></div>
        </div>

        <p className="text-center text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-6 font-bold italic">
          {step === 1 ? "Step 1: Business Info" : "Step 2: Account Security"}
        </p>

        {/* STEP 1: INFORMASI BISNIS */}
        {step === 1 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-1">
                Nama Bisnis
              </label>
              <input
                type="text"
                value={values.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Contoh:Toko atau perusahaan"
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
              <label className="text-[9px] font-black text-slate-500 uppercase ml-1">
                Jenis Bisnis
              </label>
              <select
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
              <label className="text-[9px] font-black text-slate-500 uppercase ml-1">
                Alamat Utama
              </label>
              <textarea
                value={values.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Alamat lengkap outlet..."
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

        {/* STEP 2: KONTAK & PASSWORD */}
        {step === 2 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-1">
                Email Owner
              </label>
              <input
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
              <label className="text-[9px] font-black text-slate-500 uppercase ml-1">
                WhatsApp / No. HP
              </label>
              <input
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

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-1">
                Password Akses
              </label>
              <input
                type="password"
                value={values.password}
                onChange={(e) => handleChange("password", e.target.value)}
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
          </div>
        )}
      </div>

      {/* FOOTER ACTIONS */}
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
