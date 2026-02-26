import { useState, useEffect } from "react";
import AppRoutes from "./routes/Index";
import CenterToast from "./components/common/CenterToast";
import ConfirmDialog from "./components/common/ConfirmDialog";
import "./utils/Toast";
import "./utils/confirm";

export default function App() {
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    const handleToastEvent = (event) => {
      const { message = "", type = "success" } = event.detail || {};
      setToast({ message, type });
    };

    window.addEventListener("global-toast", handleToastEvent);
    return () => window.removeEventListener("global-toast", handleToastEvent);
  }, []);

  return (
    <>
      <AppRoutes />

      <CenterToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />

      <ConfirmDialog />
    </>
  );
}
