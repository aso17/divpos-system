import React, { useState, useEffect, useMemo } from "react";
import X from "lucide-react/dist/esm/icons/x";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import Banknote from "lucide-react/dist/esm/icons/banknote";
import QrCode from "lucide-react/dist/esm/icons/qr-code";
import { formatRupiah, parseNumber, toNum } from "../../utils/formatter";
import TransactionService from "../../services/TransactionService";

export default function ProcessPaymentHistory({
  isOpen,
  onClose,
  transaction,
  paymentMethods = [],
  onSuccess,
}) {
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState("");

  const availableMethods = useMemo(() => {
    let rawList = Array.isArray(paymentMethods) ? paymentMethods : [];
    if (rawList.length === 0 && paymentMethods?.data?.payment_methods) {
      rawList = paymentMethods.data.payment_methods;
    } else if (rawList.length === 0 && paymentMethods?.payment_methods) {
      rawList = paymentMethods.payment_methods;
    }
    return rawList.filter((m) => m.type !== "DEBT");
  }, [paymentMethods]);

  const remainingBill = transaction
    ? toNum(transaction.grand_total) - toNum(transaction.total_paid)
    : 0;

  // Cari detail metode terpilih
  const currentMethod = useMemo(
    () => availableMethods.find((m) => m.id === selectedMethodId) || null,
    [selectedMethodId, availableMethods]
  );

  const isCash = currentMethod?.is_cash ?? true;

  // --- LOGIC OTOMATIS: Jika Non-Tunai, paksa nominal sesuai Sisa Tagihan ---
  useEffect(() => {
    if (isOpen && transaction) {
      if (!isCash) {
        setAmount(remainingBill);
      } else if (amount === 0 || amount === remainingBill) {
        // Default awal tetap sisa tagihan, tapi kalau cash boleh diedit nanti
        setAmount(remainingBill);
      }
    }
  }, [isCash, remainingBill, isOpen]);

  useEffect(() => {
    if (isOpen && transaction && selectedMethodId === "") {
      if (availableMethods.length > 0) {
        const defaultMethod =
          availableMethods.find((m) => m.is_default) || availableMethods[0];
        setSelectedMethodId(defaultMethod?.id || "");
      }
    }
  }, [isOpen, transaction, availableMethods, selectedMethodId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const finalAmount = toNum(amount);

    if (finalAmount < remainingBill) {
      return triggerToast(
        `Nominal minimal ${formatRupiah(remainingBill)} untuk melunasi`,
        "warning"
      );
    }

    if (!isCash && finalAmount !== remainingBill) {
      return triggerToast(
        `Pembayaran ${currentMethod?.name} harus nominal pas.`,
        "warning"
      );
    }

    setLoading(true);
    try {
      const payload = {
        transaction_id: transaction.id,
        payment_amount: finalAmount,
        payment_method_id: selectedMethodId,
      };

      const res = await TransactionService.processPaymentHistory(payload);
      if (res.data?.success) {
        const finalUpdate = {
          ...transaction,
          ...res.data.data,
          id: transaction.id,
        };
        onSuccess?.(finalUpdate);
        onClose();
      }
    } catch (error) {
      triggerToast(
        error.response?.data?.message || "Terjadi kesalahan",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const triggerToast = (message, type) => {
    window.dispatchEvent(
      new CustomEvent("global-toast", { detail: { message, type } })
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2.5 rounded-2xl shadow-lg shadow-emerald-200">
              <Wallet size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-[11px] font-black text-slate-800 uppercase leading-none tracking-tight">
                Pelunasan
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 font-bold">
                {transaction?.invoice_no}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer & Bill Summary */}
          <div className="space-y-3">
            <div className="bg-slate-50/80 p-3 rounded-2xl border border-dashed border-slate-200 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                {transaction?.customer_name?.substring(0, 2) || "GU"}
              </div>
              <div className="leading-none">
                <p className="text-[11px] font-black text-slate-700">
                  {transaction?.customer_name || "Pelanggan Umum"}
                </p>
                <p className="text-[9px] text-slate-400 font-bold mt-1">
                  {transaction?.customer_phone || "-"}
                </p>
              </div>
            </div>
            <div className="bg-rose-50 p-4 rounded-[1.5rem] border border-rose-100 flex justify-between items-center">
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
                Sisa Tagihan
              </span>
              <p className="text-lg font-black text-rose-600">
                {formatRupiah(remainingBill)}
              </p>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Pilih Metode Bayar
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableMethods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMethodId(m.id)}
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border-2 transition-all ${
                    selectedMethodId === m.id
                      ? "border-emerald-500 bg-emerald-50/50 ring-4 ring-emerald-50"
                      : "border-slate-50 bg-slate-50/50 hover:border-slate-200 text-slate-500"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg ${
                      selectedMethodId === m.id
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {m.is_cash ? <Banknote size={14} /> : <QrCode size={14} />}
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase ${
                      selectedMethodId === m.id ? "text-emerald-700" : ""
                    }`}
                  >
                    {m.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Nominal Diterima {!isCash && "(Kunci Otomatis)"}
            </label>
            <div className="relative group">
              <div
                className={`absolute left-5 top-1/2 -translate-y-1/2 font-black transition-colors ${
                  !isCash
                    ? "text-slate-400"
                    : "text-slate-300 group-focus-within:text-emerald-500"
                }`}
              >
                Rp
              </div>
              <input
                type="text"
                className={`w-full pl-12 pr-6 py-5 border-2 rounded-[1.5rem] outline-none font-black text-2xl transition-all shadow-inner
                  ${
                    !isCash
                      ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-slate-50 border-transparent focus:border-emerald-500 focus:bg-white text-slate-800"
                  }`}
                value={formatRupiah(amount)}
                onChange={(e) =>
                  isCash && setAmount(parseNumber(e.target.value) || 0)
                }
                onFocus={(e) => isCash && e.target.select()}
                disabled={loading || !isCash} // DISABLED JIKA NON-TUNAI
              />
            </div>

            {/* Hint Pelunasan Non-Tunai */}
            {!isCash && (
              <div className="flex items-center gap-2 px-2 py-1 text-blue-600 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[9px] font-black uppercase tracking-tighter">
                  Pembayaran QRIS/Transfer wajib nominal pas
                </span>
              </div>
            )}

            {isCash && toNum(amount) > remainingBill && (
              <div className="flex items-center justify-between px-2 animate-in slide-in-from-top-1 duration-200">
                <span className="text-[10px] font-bold text-emerald-600 uppercase italic">
                  Kembalian
                </span>
                <span className="text-xs font-black text-emerald-600 italic">
                  {formatRupiah(toNum(amount) - remainingBill)}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={loading || availableMethods.length === 0}
              className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                "Konfirmasi Pelunasan"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full py-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-rose-500 transition-colors"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
