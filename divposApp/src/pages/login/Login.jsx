import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import SystemService from "../../services/SystemService";
import { useAuth } from "../../context/AuthContext";
import AppHead from "../../components/common/AppHead";
import LoadingDots from "../../components/common/LoadingDots";
import LoginForm from "./LoginForm";

export default function Login() {
  const [config, setConfig] = useState(null);
  const { login: loginFromContext } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    SystemService.getAppConfig()
      .then((response) => {
        setConfig(response.data);
      })
      .catch(() => {});
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
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50 px-4 sm:px-6">
      {/* Background decorative - hidden di mobile kecil */}
      <div className="hidden sm:block absolute -top-32 -right-32 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl" />
      <div className="hidden sm:block absolute -bottom-32 -left-32 w-72 h-72 bg-green-300/10 rounded-full blur-3xl" />

      {!config && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
          <LoadingDots overlay />
        </div>
      )}

      <AppHead
        title={`Login | ${config?.appName || "Divpos"}`}
        icon={config?.favicon_path}
      />

      {/* Container */}
      <div className="relative w-full max-w-xs sm:max-w-sm">
        {/* Card */}
        <div
          className="bg-white/90 backdrop-blur-md border border-white/40 
                        rounded-2xl shadow-lg p-5 sm:p-6 
                        transition-all duration-300"
        >
          {/* Logo */}
          <div className="flex justify-center mb-4">
            {config?.logo_path ? (
              <img
                src={config.logo_path}
                alt={config.appName}
                className="h-9 sm:h-10 w-auto object-contain"
              />
            ) : (
              <div
                className="h-9 w-9 sm:h-10 sm:w-10 
                              bg-gradient-to-tr from-emerald-600 to-green-400 
                              rounded-xl flex items-center justify-center 
                              text-white font-bold text-xs sm:text-sm shadow"
              >
                {config?.appName?.charAt(0) || "D"}
              </div>
            )}
          </div>

          {/* Heading */}
          <div className="text-center mb-5">
            <h1 className="text-lg sm:text-xl font-semibold text-slate-800">
              Selamat Datang
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Masuk ke{" "}
              <span className="font-semibold text-emerald-600">
                {config?.appName || "Divpos"}
              </span>
            </p>
          </div>

          <LoginForm
            project={config}
            isSubmitting={isSubmitting}
            onSubmit={handleLogin}
          />

          {/* Footer */}
          <div
            className="mt-5 pt-4 border-t border-slate-100 
                          flex justify-between items-center 
                          text-[11px] sm:text-xs"
          >
            <Link
              to="/forgot-password"
              className="text-slate-400 hover:text-emerald-600 transition-colors"
            >
              Lupa password?
            </Link>

            <Link
              to="/register"
              className="px-3 py-1 rounded-full font-medium 
                         transition-all hover:scale-105"
              style={{
                backgroundColor: `${config?.primary_color || "#10b981"}15`,
                color: config?.primary_color || "#10b981",
              }}
            >
              Buat Akun
            </Link>
          </div>
        </div>

        {/* Bottom text */}
        <p
          className="text-center text-slate-400 
                      text-[9px] sm:text-[10px] 
                      mt-6 tracking-[0.25em] 
                      uppercase opacity-60"
        >
          Powered by {config?.appName || "Divpos"}
        </p>
      </div>
    </div>
  );
}
