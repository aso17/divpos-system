import { useState, useEffect } from "react";
import AppRoutes from "./routes/Index";
import CenterToast from "./components/common/CenterToast"; // Pastikan path benar

export default function App() {
  const [toast, setToast] = useState({
    message: "",
    type: "success",
  });

  useEffect(() => {
    const handleToastEvent = (event) => {
      setToast({
        message: event.detail.message,
        type: event.detail.type,
      });
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
        onClose={() => setToast({ ...toast, message: "" })}
      />
    </>
  );
}
