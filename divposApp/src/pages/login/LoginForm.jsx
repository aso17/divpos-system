import { useState } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { rules } from "../../utils/validators/rules";
import { useFormValidation } from "../../hooks/useFormValidation";
import SubmitButton from "../../components/SubmitButton";

export default function LoginForm({ project, isSubmitting, onSubmit }) {
  const [showPassword, setShowPassword] = useState(false);

  const { values, errors, handleChange, validate } = useFormValidation(
    { email: "", password: "" },
    {
      email: [
        (v) => rules.required(v, "Email address is required"),
        (v) => rules.email(v, "Please enter a valid email address"),
      ],
      password: [(v) => rules.required(v, "Password is required")],
    },
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(values);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* EMAIL */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-slate-500 tracking-wide">
          Email
        </label>

        <div className="relative group">
          <Mail
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 
                       text-slate-400 group-focus-within:text-emerald-600 
                       transition-colors"
          />

          <input
            type="email"
            value={values.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="nama@email.com"
            className={`
              w-full pl-9 pr-3 py-2.5
              rounded-xl text-xs sm:text-sm
              bg-slate-50 border border-slate-200
              focus:outline-none focus:ring-2 focus:ring-emerald-500/20 
              focus:border-emerald-500
              transition-all duration-200
              ${errors.email ? "border-red-400 focus:ring-red-400/20" : ""}
            `}
          />
        </div>

        {errors.email && (
          <p className="text-[10px] text-red-500 font-medium">{errors.email}</p>
        )}
      </div>

      {/* PASSWORD */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-slate-500 tracking-wide">
          Password
        </label>

        <div className="relative group">
          <Lock
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 
                       text-slate-400 group-focus-within:text-emerald-600 
                       transition-colors"
          />

          <input
            type={showPassword ? "text" : "password"}
            value={values.password}
            onChange={(e) => handleChange("password", e.target.value)}
            placeholder="••••••••"
            className={`
              w-full pl-9 pr-10 py-2.5
              rounded-xl text-xs sm:text-sm
              bg-slate-50 border border-slate-200
              focus:outline-none focus:ring-2 focus:ring-emerald-500/20 
              focus:border-emerald-500
              transition-all duration-200
              ${errors.password ? "border-red-400 focus:ring-red-400/20" : ""}
            `}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 
                       text-slate-400 hover:text-emerald-600 
                       transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {errors.password && (
          <p className="text-[10px] text-red-500 font-medium">
            {errors.password}
          </p>
        )}
      </div>

      {/* SUBMIT BUTTON */}
      <div className="pt-1">
        <SubmitButton
          isSubmitting={isSubmitting}
          label="Masuk"
          loadingLabel=""
          className="w-full py-2.5 rounded-xl 
                     text-xs sm:text-sm font-semibold 
                     shadow-md active:scale-[0.98] 
                     transition-all duration-200"
        />
      </div>
    </form>
  );
}
