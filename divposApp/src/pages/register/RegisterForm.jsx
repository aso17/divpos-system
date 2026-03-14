import { useState } from "react";

export default function RegisterForm({
  onSubmit = () => {},
  isSubmitting = false,
}) {
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (key, value) => {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* SOCIAL LOGIN */}
      <div className="flex justify-center gap-3">
        {["G", "F", "O", "in"].map((item, i) => (
          <button
            key={i}
            type="button"
            className="h-9 w-9 flex items-center justify-center border rounded-md text-xs text-slate-600 hover:bg-slate-100"
          >
            {item}
          </button>
        ))}
      </div>

      {/* DIVIDER */}
      <p className="text-center text-xs text-slate-400">
        or use your email for registration
      </p>

      {/* NAME */}
      <input
        type="text"
        placeholder="Name"
        autoComplete="name"
        value={values.name}
        onChange={(e) => handleChange("name", e.target.value)}
        className="w-full bg-slate-100 border border-transparent rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
      />

      {/* EMAIL */}
      <input
        type="email"
        placeholder="Email"
        autoComplete="email"
        value={values.email}
        onChange={(e) => handleChange("email", e.target.value)}
        className="w-full bg-slate-100 border border-transparent rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
      />

      {/* PASSWORD */}
      <input
        type="password"
        placeholder="Password"
        autoComplete="new-password"
        value={values.password}
        onChange={(e) => handleChange("password", e.target.value)}
        className="w-full bg-slate-100 border border-transparent rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
      />

      {/* BUTTON */}
      <div className="flex justify-center pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-2 rounded-md text-white text-sm font-semibold bg-slate-800 hover:bg-slate-700 transition disabled:opacity-60"
        >
          {isSubmitting ? "Processing..." : "SIGN UP"}
        </button>
      </div>
    </form>
  );
}
