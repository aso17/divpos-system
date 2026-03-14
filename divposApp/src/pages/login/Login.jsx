import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SystemService from "../../services/SystemService";
import { useAuth } from "../../context/AuthContext";
import AppHead from "../../components/common/AppHead";
import LoadingDots from "../../components/common/LoadingDots";
import RegisterForm from "../register/RegisterForm";
import LoginForm from "./LoginForm";

export default function Login() {
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [isRegister, setIsRegister] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login: loginFromContext } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    SystemService.getAppConfig()
      .then((res) => setConfig(res.data))
      .catch(() => setConfig({}))
      .finally(() => setLoadingConfig(false));
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

  const handleRegister = async (values) => {
    setIsSubmitting(true);
    try {
      console.log(values);
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Register gagal";

      window.dispatchEvent(
        new CustomEvent("global-toast", {
          detail: { message, type: "error" },
        }),
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

      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden md:h-[500px] flex flex-col md:flex-row">
        {/* LEFT PANEL */}
        <div
          className={`
    md:absolute md:top-0 md:left-0 md:h-full md:w-1/2
    text-white flex items-center justify-center
    text-center p-8 md:p-10
    transition-all duration-500
    z-20
    ${
      isRegister
        ? "md:rounded-l-[120px] md:rounded-r-[16px]"
        : "md:rounded-r-[120px] md:rounded-l-[16px]"
    }
    ${isRegister ? "md:translate-x-full" : "md:translate-x-0"}
  `}
          style={{ backgroundColor: primaryColor }}
        >
          <div className="max-w-xs flex flex-col items-center">
            {/* LOGO */}
            <div className="mb-6 flex justify-center">
              {config?.logo_path ? (
                <img
                  src={config.logo_path}
                  alt={config?.appName}
                  className="h-18 md:h-20 object-contain rounded-2xl shadow-xl"
                />
              ) : (
                <div
                  className=" h-16 w-16 md:h-20 md:w-20
            rounded-2xl 
            flex items-center justify-center 
            text-white font-bold text-2xl
            backdrop-blur-sm bg-white/20
            shadow-lg
          "
                >
                  {config?.appName?.charAt(0) || "A"}
                </div>
              )}
            </div>

            {!isRegister ? (
              <>
                <h2 className="text-xl md:text-2xl font-bold mb-3">
                  Hello, Friend!
                </h2>

                <p className="text-xs md:text-sm opacity-90 mb-5">
                  Register to use all features of{" "}
                  <span className="font-semibold">
                    {config?.appName || "Application"}
                  </span>
                </p>

                <button
                  onClick={() => setIsRegister(true)}
                  className="border border-white px-5 py-2 rounded-full text-sm hover:bg-white hover:text-slate-800 transition"
                >
                  SIGN UP
                </button>
              </>
            ) : (
              <>
                <h2 className="text-xl md:text-2xl font-bold mb-3">
                  Welcome Back!
                </h2>

                <p className="text-xs md:text-sm opacity-90 mb-5">
                  Login to continue using{" "}
                  <span className="font-semibold">
                    {config?.appName || "Application"}
                  </span>
                </p>

                <button
                  onClick={() => setIsRegister(false)}
                  className="border border-white px-5 py-2 rounded-full text-sm hover:bg-white hover:text-slate-800 transition"
                >
                  SIGN IN
                </button>
              </>
            )}
          </div>
        </div>

        {/* FORM SIDE */}
        <div
          className={`
            w-full md:w-1/2
            flex items-center justify-center
            p-6 md:p-10
            transition-all duration-500
            ${isRegister ? "md:ml-0" : "md:ml-auto"}
          `}
        >
          <div className="w-full max-w-sm">
            {/* APP NAME */}
            <h2 className="text-xl md:text-2xl font-semibold text-center mb-6">
              {isRegister
                ? `Create ${config?.appName || "Account"}`
                : `Sign In to ${config?.appName || "App"}`}
            </h2>

            {isRegister ? (
              <RegisterForm
                isSubmitting={isSubmitting}
                onSubmit={handleRegister}
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
