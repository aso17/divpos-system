import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProjectContext } from "../../context/ProjectContext";
import { useAuth } from "../../context/AuthContext";
import LoadingDots from "../../components/common/LoadingDots";
import AppHead from "../../components/common/AppHead";
import Toast from "../../components/common/CenterToast";
import LoginForm from "./LoginForm";

export default function Login() {
  const { project, loading } = useContext(ProjectContext);
  const { login: loginFromContext } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const navigate = useNavigate();
  const handleLogin = async (values) => {
    setIsSubmitting(true);

    try {
      await loginFromContext(values);
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      const message =
        error.response?.data?.message || error.message || "Login gagal";
      setToastType("error");
      setToastMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingDots />;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <AppHead title="Login" />

      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage("")}
      />

      {/* Changed max-w-md to max-w-sm and p-8 to p-6 */}
      <div className="w-full max-w-[360px] bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        {/* Logo - Slightly smaller to match card size */}
        <div className="flex justify-center mb-5">
          <img
            src={project?.logo_path}
            alt={project?.name}
            className="h-14 md:h-16 object-contain"
          />
        </div>

        {/* Title - Reduced font size to lg for better proportion */}
        <h1
          className="text-center text-lg font-extrabold tracking-tight mb-6"
          style={{ color: project?.primary_color }}
        >
          {project?.name}
        </h1>

        <LoginForm
          project={project}
          isSubmitting={isSubmitting}
          onSubmit={handleLogin}
        />
      </div>

      <footer className="mt-8 text-xs font-medium text-slate-400">
        © {new Date().getFullYear()} {project?.name}. All rights reserved.
      </footer>
    </div>
  );
}
