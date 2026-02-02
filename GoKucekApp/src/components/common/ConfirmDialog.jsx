import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export default function ConfirmDialog() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const handleConfirmEvent = (event) => setConfig(event.detail);
    window.addEventListener("global-confirm", handleConfirmEvent);
    return () =>
      window.removeEventListener("global-confirm", handleConfirmEvent);
  }, []);

  if (!config) return null;

  // HANYA warning yang pakai mode konfirmasi (2 tombol)
  const isConfirmMode = config.type === "warning";

  const types = {
    success: {
      icon: <CheckCircle2 className="text-emerald-500" size={32} />,
      bg: "bg-emerald-50",
      btn: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
      title: "Berhasil",
      defaultBtnText: "Tutup",
    },
    error: {
      icon: <XCircle className="text-rose-500" size={32} />,
      bg: "bg-rose-50",
      btn: "bg-rose-600 hover:bg-rose-700 shadow-rose-200",
      title: "Gagal",
      defaultBtnText: "Mengerti",
    },
    warning: {
      icon: <AlertTriangle className="text-amber-500" size={32} />,
      bg: "bg-amber-50",
      btn: "bg-rose-600 hover:bg-rose-700 shadow-rose-200", // Merah karena biasanya untuk hapus
      title: "Konfirmasi",
      defaultBtnText: "Lanjutkan",
    },
  }[config.type || "warning"];

  const handleAction = (result) => {
    if (config.resolve) config.resolve(result);
    setConfig(null);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
        onClick={() => !isConfirmMode && handleAction(false)}
      />

      <div className="relative w-full max-w-[340px] bg-white rounded-[24px] shadow-2xl overflow-hidden border border-slate-100 animate-center-toast">
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            {/* Ikon akan otomatis berubah sesuai types[config.type] */}
            <div
              className={`p-4 rounded-2xl mb-4 ${types.bg} animate-bounce-short`}
            >
              {types.icon}
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              {config.title || types.title}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              {config.message}
            </p>

            <div className="flex gap-3 w-full">
              {/* Tombol Batal HANYA muncul jika mode warning */}
              {isConfirmMode && (
                <button
                  onClick={() => handleAction(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition active:scale-95"
                >
                  {config.cancelText || "Batal"}
                </button>
              )}

              {/* Tombol Utama: Jika success/error, dia akan memenuhi lebar modal (full width) */}
              <button
                onClick={() => handleAction(true)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition shadow-lg active:scale-95 ${types.btn}`}
              >
                {config.confirmText || types.defaultBtnText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
