import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SystemService from "../../services/SystemService";
import { useAuth } from "../../context/AuthContext";
import AppHead from "../../components/common/AppHead";
import LoadingDots from "../../components/common/LoadingDots";
import RegisterForm from "../register/RegisterForm";
import { RegistrationService } from "../../services/RegistrationService";
import LoginForm from "./LoginForm";

export default function Login() {
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [isRegister, setIsRegister] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- PERBAIKAN 1 DI SINI: Tambahkan State businessTypes ---
  const [businessTypes, setBusinessTypes] = useState([]);

  const { login: loginFromContext } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // --- PERBAIKAN 2 DI SINI: Ambil Config DAN Business Types ---
    const fetchData = async () => {
      setLoadingConfig(true);
      try {
        const [configRes, bizRes] = await Promise.all([
          SystemService.getAppConfig().catch(() => ({ data: {} })),
          RegistrationService.getBisnisType().catch(() => ({ data: [] })),
        ]);

        setConfig(configRes.data);

        // Sesuaikan dengan struktur response BE Mas (apakah res.data atau res.data.data)
        setBusinessTypes(bizRes.data.data || bizRes.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchData();
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
        new CustomEvent("global-toast", { detail: { message, type: "error" } })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (payload) => {
    setIsSubmitting(true);
    try {
      const response = await RegistrationService.register(payload);
      if (response.data.success) {
        window.dispatchEvent(
          new CustomEvent("global-toast", {
            detail: {
              message: "Registrasi Berhasil! Silakan Login.",
              type: "success",
            },
          })
        );
        setIsRegister(false);
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Gagal mendaftarkan bisnis";
      window.dispatchEvent(
        new CustomEvent("global-toast", {
          detail: { message: message, type: "error" },
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const primaryColor = config?.primary_color || "#10b981";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-6">
      {loadingConfig && <LoadingDots overlay />}
      <AppHead title="Auth" icon={config?.favicon_path} />

      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden md:h-[600px] flex flex-col md:flex-row">
        {/* PANEL OVERLAY (GREEN) */}
        <div
          className={`
            md:absolute md:top-0 md:left-0 md:h-full md:w-1/2
            text-white flex items-center justify-center
            text-center p-8 md:p-10 transition-all duration-700 z-20
            ${
              isRegister
                ? "md:translate-x-full md:rounded-l-[100px]"
                : "md:translate-x-0 md:rounded-r-[100px]"
            }
          `}
          style={{ backgroundColor: primaryColor }}
        >
          <div className="max-w-xs flex flex-col items-center">
            {/* Logo Logic */}
            <div className="mb-6 flex justify-center">
              {config?.logo_path ? (
                <img
                  src={config.logo_path}
                  className="h-16 object-contain rounded-xl shadow-lg"
                  alt="logo"
                />
              ) : (
                <div className="h-16 w-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl backdrop-blur-sm bg-white/20 shadow-lg">
                  {config?.appName?.charAt(0) || "D"}
                </div>
              )}
            </div>

            <h2 className="text-2xl font-black uppercase mb-3">
              {isRegister ? "Welcome Back!" : "Hello, Friend!"}
            </h2>
            <p className="text-xs opacity-90 mb-8 uppercase tracking-widest font-medium">
              {isRegister
                ? "Login to continue managing your business"
                : "Start your business journey with us today"}
            </p>
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="border-2 border-white px-10 py-2 rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-white hover:text-slate-800 transition-all"
            >
              {isRegister ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </div>

        {/* FORM SIDE */}
        <div
          className={`w-full md:w-1/2 flex items-center justify-center p-6 md:p-10 transition-all duration-700 ${
            isRegister ? "md:order-1" : "md:ml-auto md:order-2"
          }`}
        >
          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-black text-slate-800 text-center mb-8 uppercase tracking-tighter">
              {isRegister ? "Create Account" : "Sign In"}
            </h2>

            {isRegister ? (
              <RegisterForm
                isSubmitting={isSubmitting}
                onSubmit={handleRegister}
                businessTypes={businessTypes} // SEKARANG SUDAH DEFINED
              />
            ) : (
              <LoginForm
                project={config}
                isSubmitting={isSubmitting}
                onSubmit={handleLogin}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
