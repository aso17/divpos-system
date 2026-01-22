import { useEffect } from "react";

export default function CenterToast({
  message,
  type = "success",
  duration = 4000,
  onClose,
}) {
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const styles = {
    success: {
      accent: "bg-green-500",
      title: "Success",
    },
    error: {
      accent: "bg-red-500",
      title: "Failed",
    },
    info: {
      accent: "bg-blue-500",
      title: "Info",
    },
    warning: {
      accent: "bg-yellow-500",
      title: "Warning",
    },
  }[type];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Subtle backdrop */}
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" />

      {/* Toast card */}
      <div className="relative animate-center-toast">
        <div className="w-[320px] rounded-2xl bg-white shadow-2xl overflow-hidden">
          {/* Accent bar */}
          <div className={`h-1.5 ${styles.accent}`} />

          <div className="p-6 text-center">
            <p className="text-sm font-semibold text-slate-900 mb-1">
              {styles.title}
            </p>
            <p className="text-sm text-slate-500 leading-relaxed">{message}</p>

            <button
              onClick={onClose}
              className="mt-4 text-xs font-medium text-slate-400 hover:text-slate-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .animate-center-toast {
          animation: centerFadeScale 0.25s ease-out forwards;
        }

        @keyframes centerFadeScale {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
