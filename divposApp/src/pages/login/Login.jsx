import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ProjectContext } from "../../context/ProjectContext";
import { useAuth } from "../../context/AuthContext";
import AppHead from "../../components/common/AppHead";
import LoginForm from "./LoginForm";

export default function Login() {
  const { project, loading } = useContext(ProjectContext);
  const { login: loginFromContext } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (values) => {
    setIsSubmitting(true);
    try {
      await loginFromContext(values);

      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      const message =
        error.response?.data?.message || error.message || "Login gagal";
      window.dispatchEvent(
        new CustomEvent("global-toast", {
          detail: { message: message, type: "error" },
        }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-emerald-50 px-4">
      <AppHead title={`Login`} />

      {/* Komponen <Toast /> lokal sudah dihapus dari sini */}

      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-7">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img
              src={project?.logo_path}
              alt={project?.name}
              className="h-14 md:h-16 w-auto object-contain"
            />
          </div>

          {/* Heading */}
          <div className="text-center mb-5">
            <h1 className="text-xl font-bold text-slate-800">
              Selamat Datang 👋
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Masuk ke sistem{" "}
              <span className="font-semibold">{project?.name}</span>
            </p>
          </div>

          {/* Form */}
          <LoginForm
            project={project}
            isSubmitting={isSubmitting}
            onSubmit={handleLogin}
          />

          {/* Links */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between text-xs">
            <Link
              to="/forgot-password"
              className="text-slate-400 hover:text-slate-600 transition"
            >
              Lupa password?
            </Link>

            <Link
              to="/register"
              className="font-semibold hover:opacity-80 transition"
              style={{ color: project?.primary_color }}
            >
              Buat Akun
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
