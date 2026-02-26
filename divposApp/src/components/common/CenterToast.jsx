import { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, XCircle, X } from "lucide-react";

export default function CenterToast({
  message,
  type = "success",
  duration = 3000,
  onClose,
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const config = {
    success: {
      icon: <CheckCircle2 className="text-emerald-500" size={28} />,
      bgColor: "bg-emerald-50",
      accent: "bg-emerald-500",
      title: "Berhasil",
    },
    error: {
      icon: <XCircle className="text-rose-500" size={28} />,
      bgColor: "bg-rose-50",
      accent: "bg-rose-500",
      title: "Gagal",
    },
    info: {
      icon: <Info className="text-blue-500" size={28} />,
      bgColor: "bg-blue-50",
      accent: "bg-blue-500",
      title: "Informasi",
    },
    warning: {
      icon: <AlertCircle className="text-amber-500" size={28} />,
      bgColor: "bg-amber-50",
      accent: "bg-amber-500",
      title: "Peringatan",
    },
  }[type];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Toast Card */}
      <div className="relative w-full max-w-[340px] animate-center-toast">
        <div className="bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden border border-slate-100">
          {/* Progress Bar */}
          <div className={`h-1.5 w-full ${config.bgColor}`}>
            <div
              className={`h-full ${config.accent} animate-progress-bar`}
              style={{ animationDuration: `${duration}ms` }}
            />
          </div>

          <div className="p-6">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className={`p-3 rounded-2xl mb-4 ${config.bgColor}`}>
                {config.icon}
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-1">
                {config.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PERBAIKAN DI SINI: Menghapus atribut 'jsx' dan gunakan dangerouslySetInnerHTML */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .animate-center-toast {
          animation: toastIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .animate-progress-bar {
          animation: progress linear forwards;
        }

        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `,
        }}
      />
    </div>
  );
}
