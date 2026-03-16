import React, { useState, useEffect } from "react";
import X from "lucide-react/dist/esm/icons/x";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import { formatRupiah, parseNumber, toNum } from "../../utils/formatter";
import TransactionService from "../../services/TransactionService";

export default function ProcessPaymentHistory({
  isOpen,
  onClose,
  transaction,
  onSuccess,
}) {
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const remainingBill = transaction
    ? toNum(transaction.grand_total) - toNum(transaction.total_paid)
    : 0;

  useEffect(() => {
    if (isOpen && transaction) {
      setAmount(remainingBill);
    }
  }, [isOpen, transaction, remainingBill]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (toNum(amount) < remainingBill) {
      return triggerToast(
        `Nominal harus minimal ${formatRupiah(remainingBill)} untuk melunasi`,
        "warning",
      );
    }

    setLoading(true);

    try {
      const payload = {
        transaction_id: transaction.id,
        payment_amount: toNum(amount),
      };

      const res = await TransactionService.processPaymentHistory(payload);

      if (res.data?.success) {
        // Gabungkan data lama dengan data baru dari server
        const finalUpdate = {
          ...transaction, // Ambil data asli (termasuk 'details' agar tidak hilang saat print)
          ...res.data.data, // Timpa dengan data finansial terbaru dari BE
          id: transaction.id, // WAJIB: Kunci ID tetap pakai yang lama untuk keperluan map di Parent
        };

        // Panggil onSuccess yang di Parent sudah kita siapkan untuk:
        // 1. Update list di tabel
        // 2. Set data ke Success Modal
        // 3. Buka Success Modal
        onSuccess?.(finalUpdate);

        // Tutup modal pelunasan
        onClose();
      }
    } catch (error) {
      console.error("Error pelunasan:", error);
      triggerToast(
        error.response?.data?.message || "Terjadi kesalahan koneksi ke server",
        "error",
      );
    } finally {
      setLoading(false); // Spinner pasti berhenti
    }
  };

  const triggerToast = (message, type) => {
    window.dispatchEvent(
      new CustomEvent("global-toast", { detail: { message, type } }),
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex justify-between items-center text-sans">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-xl">
              <Wallet size={18} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase leading-none">
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
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Customer Detail Section */}
          <div className="bg-slate-50/50 p-3 rounded-2xl border border-dashed border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                {transaction?.customer_name?.substring(0, 2).toUpperCase() ||
                  "GU"}
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-700 leading-none">
                  {transaction?.customer_name || "Pelanggan Umum"}
                </p>
                <p className="text-[9px] text-slate-400 font-bold mt-1">
                  {transaction?.customer_phone || "-"}
                </p>
              </div>
            </div>
          </div>
          {/* Info Card */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">
                Total Tagihan
              </span>
              <p className="text-[11px] font-bold text-slate-700">
                {formatRupiah(transaction?.grand_total)}
              </p>
            </div>
            <div className="bg-rose-50 p-3 rounded-2xl border border-rose-100">
              <span className="text-[8px] font-black text-rose-400 uppercase tracking-wider">
                Sisa Piutang
              </span>
              <p className="text-[11px] font-black text-rose-600">
                {formatRupiah(remainingBill)}
              </p>
            </div>
          </div>

          {/* Input Area */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">
              Nominal Diterima
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">
                Rp
              </div>
              <input
                type="text"
                autoFocus
                className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl outline-none font-black text-xl transition-all text-slate-800"
                value={formatRupiah(amount)}
                onChange={(e) => {
                  // PERBAIKAN 2: Simpan dalam bentuk angka murni agar tidak bentrok dengan formatter
                  const val = parseNumber(e.target.value);
                  setAmount(val || 0);
                }}
                onFocus={(e) => e.target.select()}
                placeholder="0"
                disabled={loading}
              />
            </div>

            {toNum(amount) > remainingBill && (
              <div className="flex items-center gap-1.5 ml-1 animate-in slide-in-from-top-1 duration-200">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-[10px] font-bold text-emerald-600 italic">
                  Kembalian: {formatRupiah(toNum(amount) - remainingBill)}
                </p>
              </div>
            )}
          </div>

          {/* Button Group */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 ${loading ? "opacity-70 cursor-not-allowed" : "active:scale-95"}`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Konfirmasi Pelunasan"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full py-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-rose-500 transition-colors disabled:opacity-30"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
