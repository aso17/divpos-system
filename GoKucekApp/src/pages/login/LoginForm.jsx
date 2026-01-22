import { useState } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { rules } from "../../utils/validators/rules";
import { inputClasses } from "../../utils/validators/inputClasses";
import { useFormValidation } from "../../hooks/useFormValidation";
import SubmitButton from "../../components/SubmitButton";

export default function LoginForm({ project, isSubmitting, onSubmit }) {
  const [showPassword, setShowPassword] = useState(false);

  const { values, errors, handleChange, validate } = useFormValidation(
    { email: "", password: "" },
    {
      email: [
        (v) => rules.required(v, "Email is required"),
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 ml-1">
          <Mail size={16} className="text-gray-400" />
          Email
        </label>
        <input
          type="email"
          value={values.email}
          onChange={(e) => handleChange("email", e.target.value)}
          className={inputClasses({ error: !!errors.email })}
          placeholder="e.g. name@company.com"
        />
        {errors.email && (
          <p className="text-xs text-red-500 mt-1 ml-1">{errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 ml-1">
          <Lock size={16} className="text-gray-400" />
          Password
        </label>
        <div className="relative mt-1">
          <input
            type={showPassword ? "text" : "password"}
            value={values.password}
            onChange={(e) => handleChange("password", e.target.value)}
            className={inputClasses({
              error: !!errors.password,
              extra: "pr-12",
            })}
            placeholder="••••••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-500 mt-1 ml-1">{errors.password}</p>
        )}
      </div>

      {/* Submit */}
      <SubmitButton
        isSubmitting={isSubmitting}
        label="Login"
        loadingLabel="Logging in..."
        color={project?.primary_color || "#2563eb"}
      />
    </form>
  );
}
