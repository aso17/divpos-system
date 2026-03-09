import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import SystemService from "../../services/SystemService";
import { useAuth } from "../../context/AuthContext";
import AppHead from "../../components/common/AppHead";
import LoadingDots from "../../components/common/LoadingDots";
import LoginForm from "./LoginForm";

export default function Login() {
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const { login: loginFromContext } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    SystemService.getAppConfig()
      .then((response) => {
        setConfig(response.data);
      })
      .catch((error) => {
        console.error("Config load failed:", error);
        setConfig({});
      })
      .finally(() => {
        setLoadingConfig(false);
      });
  }, []);

  const handleLogin = async (values) => {
    setIsSubmitting(true);
    try {
      await loginFromContext(values);
      navigate("/dashboard");
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Login gagal";

      window.dispatchEvent(
        new CustomEvent("global-toast", {
          detail: { message, type: "error" },
        }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-4 sm:px-6 overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute -top-40 -right-40 w-[420px] h-[420px] bg-emerald-400/20 rounded-full blur-[120px]" />
      <div className="absolute -bottom-40 -left-40 w-[420px] h-[420px] bg-green-300/20 rounded-full blur-[120px]" />

      {/* Loading Overlay */}
      {loadingConfig && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <LoadingDots overlay />
        </div>
      )}

      <AppHead title="Login" icon={config?.favicon_path} />

      {/* Container */}
      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div
          className="
          bg-white/70 backdrop-blur-xl
          border border-white/40
          rounded-3xl
          shadow-[0_25px_60px_rgba(0,0,0,0.12)]
          p-6 sm:p-7
          transition-all duration-300
          hover:shadow-[0_30px_70px_rgba(0,0,0,0.15)]
        "
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            {config?.logo_path ? (
              <img
                src={config.logo_path}
                alt={config?.appName}
                className="h-10 sm:h-11 w-auto object-contain drop-shadow-sm"
              />
            ) : (
              <div
                className="
                h-11 w-11
                bg-gradient-to-tr from-emerald-600 via-emerald-500 to-green-400
                rounded-2xl
                flex items-center justify-center
                text-white font-bold text-sm
                shadow-md
              "
              >
                {config?.appName?.charAt(0) || "D"}
              </div>
            )}
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">
              Welcome Back
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Masuk ke{" "}
              <span className="font-semibold text-emerald-600">
                {config?.appName || "Divpos"}
              </span>
            </p>
          </div>

          {/* Form */}
          <LoginForm
            project={config}
            isSubmitting={isSubmitting}
            onSubmit={handleLogin}
          />

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex justify-between items-center text-xs">
            <Link
              to="/forgot-password"
              className="text-slate-400 hover:text-emerald-600 transition-colors"
            >
              Lupa password?
            </Link>

            <Link
              to="/register"
              className="px-3 py-1 rounded-full font-medium transition-all hover:scale-105"
              style={{
                backgroundColor: `${config?.primary_color || "#10b981"}15`,
                color: config?.primary_color || "#10b981",
              }}
            >
              Buat Akun
            </Link>
          </div>
        </div>

        {/* Bottom Branding */}
        <p className="text-center text-slate-400 text-[10px] mt-8 tracking-[0.35em] uppercase opacity-60">
          Powered by {config?.appName || "Divpos"}
        </p>
      </div>
    </div>
  );
}
