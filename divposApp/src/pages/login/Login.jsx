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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-slate-100 rounded-full mb-4"></div>
          <div className="h-3 w-24 bg-slate-50 rounded"></div>
        </div>
      </div>
    );
  }

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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-green-50 px-4">
      {/* BACKGROUND DECOR */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-green-300/20 rounded-full blur-3xl" />

      <AppHead title={`Login | ${project?.name || "Divpos"}`} />

      <div className="relative w-full max-w-sm">
        {/* CARD */}
        <div className="backdrop-blur-xl bg-white/80 border border-white/40 rounded-3xl shadow-2xl shadow-emerald-900/10 p-7 md:p-8 transition-all duration-500">
          {/* LOGO */}
          <div className="flex justify-center mb-6">
            {project?.logo_path ? (
              <img
                src={project.logo_path}
                alt={project.name}
                className="h-14 w-auto object-contain transition-all duration-500 hover:scale-105"
              />
            ) : (
              <div className="h-14 w-14 bg-gradient-to-tr from-emerald-600 to-green-400 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-200">
                {project?.name?.charAt(0) || "D"}
              </div>
            )}
          </div>

          {/* HEADING */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
              Selamat Datang
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Masuk ke sistem{" "}
              <span className="font-semibold text-emerald-600">
                {project?.name || "Divpos"}
              </span>
            </p>
          </div>

          {/* FORM */}
          <LoginForm
            project={project}
            isSubmitting={isSubmitting}
            onSubmit={handleLogin}
          />

          {/* FOOTER LINKS */}
          <div className="mt-7 pt-6 border-t border-slate-100 flex justify-between items-center text-xs">
            <Link
              to="/forgot-password"
              className="text-slate-400 hover:text-emerald-600 transition-colors duration-200"
            >
              Lupa password?
            </Link>

            <Link
              to="/register"
              className="px-4 py-1.5 rounded-full font-semibold transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: `${project?.primary_color || "#10b981"}20`,
                color: project?.primary_color || "#10b981",
              }}
            >
              Buat Akun
            </Link>
          </div>
        </div>

        {/* BOTTOM TEXT */}
        <p className="text-center text-slate-400 text-[10px] mt-8 tracking-[0.3em] uppercase opacity-70">
          Powered by Divpos System
        </p>
      </div>
    </div>
  );
}
