import React, { useState, useEffect } from "react";
import X from "lucide-react/dist/esm/icons/x";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import Receipt from "lucide-react/dist/esm/icons/receipt";

import SubmitButton from "../../components/SubmitButton";
import { rules } from "../../utils/validators/rules";
import { inputClasses } from "../../utils/validators/inputClasses";
import { useFormValidation } from "../../hooks/useFormValidation";
import TransactionService from "../../services/TransactionService";

const REASON_PRESETS = [
  "Permintaan pelanggan",
  "Pelanggan tidak jadi",
  "Layanan tidak tersedia",
  "Salah input data",
  "Lainnya",
];

const triggerToast = (message, type) =>
  window.dispatchEvent(
    new CustomEvent("global-toast", { detail: { message, type } })
  );

const MAX_REASON = 200;
const MIN_REASON = 10;

export default function CancelTransactionModal({
  isOpen,
  onClose,
  transaction,
  onSuccess,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Validasi — pola identik dengan RoleForm ───────────────────────────────
  const { values, errors, handleChange, validate, setValues, setErrors } =
    useFormValidation(
      { reason: "" },
      {
        reason: [
          (v) => rules.required(v, "Alasan pembatalan wajib diisi"),
          (v) =>
            rules.minLength(v, MIN_REASON, `Minimal ${MIN_REASON} karakter`),
          (v) =>
            rules.maxLength(v, MAX_REASON, `Maksimal ${MAX_REASON} karakter`),
          (v) =>
            rules.safeString(v, "Alasan mengandung karakter tidak diizinkan"),
        ],
      }
    );

  // ── Reset tiap modal dibuka — pola identik dengan RoleForm ────────────────
  useEffect(() => {
    if (!isOpen) return;
    setValues({ reason: "" });
    setErrors({});
    setIsSubmitting(false);
  }, [isOpen, setValues, setErrors]);

  // ── Preset click ──────────────────────────────────────────────────────────
  const handlePreset = (preset) => {
    handleChange("reason", preset === "Lainnya" ? "" : preset);
  };

  // ── Submit — pola identik dengan RoleForm ─────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await TransactionService.cancelTransaction(
        transaction.id,
        values.reason.trim()
      );

      if (res.data?.success) {
        const finalUpdate = {
          ...transaction,
          ...res.data.data,
          id: transaction.id,
        };
        triggerToast(
          res.data?.message || "Transaksi berhasil dibatalkan.",
          "success"
        );
        onSuccess?.(finalUpdate);
        onClose();
      }
    } catch (err) {
      triggerToast(
        err.response?.data?.message ||
          "Terjadi kesalahan saat membatalkan transaksi.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const charCount = values.reason.trim().length;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4
      bg-black/40 backdrop-blur-sm"
    >
      <div
        className="bg-white rounded-sm w-full max-w-sm shadow-2xl overflow-hidden
        border-t-4 border-red-500 animate-in fade-in zoom-in duration-200"
      >
        <div className="p-6 overflow-y-auto max-h-[95vh]">
          {/* ── Header — pola dari RoleForm ── */}
          <h2
            className="text-xs font-bold mb-4 text-slate-700 uppercase tracking-wider
            border-b pb-3 flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <span className="p-1 bg-red-50 text-red-600 rounded">
                <XCircle size={14} />
              </span>
              Batalkan Transaksi
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors
                text-slate-400 hover:text-slate-600 disabled:opacity-40"
            >
              <X size={16} />
            </button>
          </h2>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 text-xxs"
          >
            {/* ── Info transaksi ── */}
            <div className="bg-slate-50/50 p-3 rounded-2xl border border-dashed border-slate-200">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full bg-slate-200 flex items-center
                  justify-center text-[10px] font-black text-slate-500 flex-shrink-0"
                >
                  {transaction?.customer_name?.substring(0, 2).toUpperCase() ||
                    "GU"}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-700 leading-none truncate">
                    {transaction?.customer_name || "Pelanggan Umum"}
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold mt-1">
                    {transaction?.customer_phone || "-"}
                  </p>
                </div>
                <div className="ml-auto text-right flex-shrink-0">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Receipt size={10} className="text-emerald-500" />
                    <span className="font-mono text-[10px] font-bold text-emerald-700">
                      {transaction?.invoice_no}
                    </span>
                  </div>
                  <span
                    className="text-[9px] font-bold text-amber-600 bg-amber-50
                    border border-amber-200 px-1.5 py-0.5 rounded-full mt-1 inline-block"
                  >
                    {transaction?.status}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Warning ── */}
            <div
              className="flex items-start gap-3 bg-amber-50 border border-amber-200
              rounded-xl px-4 py-3"
            >
              <AlertTriangle
                size={14}
                className="text-amber-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-[10px] font-semibold text-amber-700 leading-relaxed">
                Transaksi yang dibatalkan{" "}
                <span className="font-black">tidak dapat dipulihkan</span>.
                Pastikan pembatalan sudah dikonfirmasi dengan pelanggan.
              </p>
            </div>

            {/* ── Preset cepat ── */}
            <div>
              <label className="block mb-2 text-slate-600 font-bold uppercase text-[9px]">
                Pilih Alasan Cepat
              </label>
              <div className="flex flex-wrap gap-1.5">
                {REASON_PRESETS.map((preset) => {
                  const isSelected =
                    preset !== "Lainnya" && values.reason === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePreset(preset)}
                      disabled={isSubmitting}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border
                        transition-all duration-150 disabled:opacity-40
                        ${
                          isSelected
                            ? "bg-red-500 text-white border-red-500 shadow-sm"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:border-red-300 hover:text-red-600"
                        }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Textarea — inputClasses + counter + error persis RoleForm ── */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-600 font-bold uppercase text-[9px]">
                  Alasan Pembatalan <span className="text-red-500">*</span>
                </label>
                {/* Counter: berubah merah jika mendekati/melebihi batas */}
                <span
                  className={`text-[9px] font-bold tabular-nums transition-colors
                  ${
                    charCount > MAX_REASON
                      ? "text-red-500"
                      : charCount >= MIN_REASON
                      ? "text-emerald-500"
                      : "text-slate-300"
                  }`}
                >
                  {charCount} / {MAX_REASON}
                </span>
              </div>

              <textarea
                value={values.reason}
                onChange={(e) => handleChange("reason", e.target.value)}
                disabled={isSubmitting}
                maxLength={MAX_REASON + 1} // biarkan 1 karakter lebih agar maxLength rule terpicu
                rows={3}
                placeholder="Jelaskan alasan pembatalan secara singkat..."
                className={`${inputClasses({ error: !!errors.reason })}
                  min-h-[80px] py-2 resize-none leading-relaxed
                  focus:border-red-400 focus:ring-red-400/20
                  disabled:opacity-50`}
              />

              {/* Inline error — persis RoleForm */}
              {errors.reason && (
                <p className="text-[10px] text-red-500 mt-1">{errors.reason}</p>
              )}
            </div>

            {/* ── Footer buttons — pola dari RoleForm ── */}
            <div className="flex justify-end gap-2 pt-4 border-t mt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-[10px] font-black uppercase
                  bg-slate-50 text-slate-600 border border-slate-200
                  hover:bg-slate-100 rounded-lg transition-all disabled:opacity-40"
              >
                Tidak, Kembali
              </button>

              <SubmitButton
                isSubmitting={isSubmitting}
                label="Batalkan Transaksi"
                loadingLabel="Memproses..."
                fullWidth={false}
                className="text-[10px] font-bold uppercase py-1.5 px-6 rounded
                  bg-red-500 hover:bg-red-600 shadow-sm shadow-red-200"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
