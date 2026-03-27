import React, { useEffect } from "react";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list";
import ReceiptText from "lucide-react/dist/esm/icons/receipt-text";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Printer from "lucide-react/dist/esm/icons/printer";
import Clock from "lucide-react/dist/esm/icons/clock";
import Minus from "lucide-react/dist/esm/icons/minus";
import Plus from "lucide-react/dist/esm/icons/plus";
import Box from "lucide-react/dist/esm/icons/box";

export default function TransactionCartForm({
  cart,
  setCart,
  paymentMethods,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  subtotal,
  formatRupiah,
  toNum,
  isDpEnabled_dp,
  allowZeroPay,
  isCash,
  dpAmount,
  setDpAmount,
  payAmount,
  setPayAmount,
  change,
  handleSubmit,
  isDisabled,
  loading,
  parseNumber,
}) {
  const cartCount = cart.reduce((s, i) => s + toNum(i.qty), 0);

  // --- Auto-fill nominal untuk Non-Tunai (QRIS/Transfer) ---
  useEffect(() => {
    if (!isCash && !allowZeroPay) {
      const targetAmount = isDpEnabled_dp ? toNum(dpAmount) : toNum(subtotal);
      setPayAmount(targetAmount);
    }
  }, [isCash, subtotal, dpAmount, isDpEnabled_dp, allowZeroPay, setPayAmount]);

  return (
    <div className="w-full lg:w-2/5 lg:sticky lg:top-5 lg:h-fit">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm shadow-emerald-200 flex-shrink-0">
              <ClipboardList
                size={16}
                strokeWidth={2.5}
                className="text-white"
              />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800 leading-tight">
                Detail Order
              </h2>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Layanan &amp; Pembayaran
              </p>
            </div>
          </div>

          {cartCount > 0 && (
            <span className="min-w-[24px] h-6 bg-emerald-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center px-2">
              {cartCount}
            </span>
          )}
        </div>

        {/* ── Cart Items (Service List) ── */}
        <div className="max-h-[280px] overflow-y-auto px-4 py-3 space-y-2.5">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div
                key={item.id}
                className="group flex items-start gap-3 p-3 bg-gray-50 border border-gray-100
                  rounded-xl hover:border-emerald-200 hover:bg-emerald-50/40 transition-all duration-150"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-gray-700 uppercase leading-tight truncate mb-2.5">
                    {item.name}
                  </p>

                  {/* Qty stepper */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCart(
                          cart.map((c) =>
                            c.id === item.id
                              ? {
                                  ...c,
                                  qty: Math.max(
                                    0.5,
                                    toNum(c.qty) -
                                      (item.is_weight_based ? 0.5 : 1)
                                  ),
                                }
                              : c
                          )
                        )
                      }
                      className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
                    >
                      <Minus
                        size={10}
                        strokeWidth={2.5}
                        className="text-gray-500"
                      />
                    </button>

                    <input
                      type="number"
                      step="any"
                      className="w-14 h-7 border border-emerald-300 bg-white rounded-lg text-center text-xs font-black text-emerald-700 outline-none"
                      value={item.qty || ""}
                      onChange={(e) =>
                        setCart(
                          cart.map((c) =>
                            c.id === item.id ? { ...c, qty: e.target.value } : c
                          )
                        )
                      }
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setCart(
                          cart.map((c) =>
                            c.id === item.id
                              ? {
                                  ...c,
                                  qty:
                                    toNum(c.qty) +
                                    (item.is_weight_based ? 0.5 : 1),
                                }
                              : c
                          )
                        )
                      }
                      className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
                    >
                      <Plus
                        size={10}
                        strokeWidth={2.5}
                        className="text-gray-500"
                      />
                    </button>

                    <span className="text-[9px] font-bold text-gray-400 uppercase ml-0.5">
                      {item.unit}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between self-stretch gap-2">
                  <button
                    onClick={() =>
                      setCart(cart.filter((c) => c.id !== item.id))
                    }
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <Trash2 size={12} strokeWidth={2} />
                  </button>

                  <div className="text-right">
                    {toNum(item.original_price) > toNum(item.final_price) && (
                      <p className="text-[9px] text-gray-400 line-through leading-none mb-0.5">
                        {formatRupiah(
                          toNum(item.original_price) * toNum(item.qty)
                        )}
                      </p>
                    )}
                    <p className="text-sm font-black text-gray-800 leading-none">
                      {formatRupiah(toNum(item.final_price) * toNum(item.qty))}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-2 flex flex-col items-center text-center border-2 border-dashed border-gray-100 rounded-2xl">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                <Box size={22} strokeWidth={1.5} className="text-gray-300" />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                List Order Kosong
              </p>
              <p className="text-[10px] text-gray-300 mt-1">
                Pilih layanan di sebelah kiri
              </p>
            </div>
          )}
        </div>

        {/* ── Payment Area ── */}
        <div className="border-t border-gray-50 px-4 pb-4 pt-4 space-y-4">
          {/* Payment Method */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <CreditCard size={11} className="text-emerald-500" />
              Metode Pembayaran
            </p>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedPaymentMethod(m)}
                  className={`py-2 px-1 rounded-xl text-[10px] font-bold uppercase border transition-all
                    ${
                      selectedPaymentMethod?.id === m.id
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200"
                        : "bg-white text-gray-400 border-gray-200 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50"
                    }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Grand Total */}
          <div className="bg-emerald-600 rounded-2xl p-4 flex items-center justify-between shadow-sm shadow-emerald-200">
            <div>
              <p className="text-emerald-200 text-[10px] font-semibold uppercase tracking-widest">
                Total Bayar
              </p>
              <p className="text-2xl font-black text-white leading-tight mt-0.5">
                {formatRupiah(subtotal)}
              </p>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
              <ReceiptText size={18} className="text-white" strokeWidth={2} />
            </div>
          </div>

          {/* DP Input */}
          {isDpEnabled_dp && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                DP / Booking Fee
              </label>
              <input
                type="text"
                value={dpAmount === 0 ? "" : formatRupiah(dpAmount)}
                onChange={(e) => setDpAmount(parseNumber(e.target.value) || 0)}
                className="w-full h-12 border-2 border-amber-300 bg-amber-50 rounded-xl px-4 font-black text-lg text-amber-700 outline-none"
                placeholder="Rp 0"
              />
            </div>
          )}

          {/* Payment Input */}
          {!allowZeroPay ? (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                {isCash ? "Nominal Tunai" : "Konfirmasi Pembayaran"}
              </label>
              <input
                type="text"
                readOnly={!isCash}
                onFocus={(e) => isCash && e.target.select()}
                value={payAmount === 0 ? "" : formatRupiah(payAmount)}
                onChange={(e) =>
                  isCash && setPayAmount(parseNumber(e.target.value) || 0)
                }
                className={`w-full h-12 border-2 rounded-xl px-4 font-black text-lg outline-none transition-all
                  ${
                    !isCash
                      ? "bg-gray-100 border-gray-200 text-gray-400"
                      : "bg-white border-emerald-400 text-emerald-700 focus:border-emerald-600"
                  }`}
                placeholder="Rp 0"
              />

              {isCash && (
                <div
                  className={`flex items-center justify-between text-xs font-bold px-3 py-2 rounded-xl ${
                    change < 0
                      ? "bg-red-50 text-red-600"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  <span className="uppercase tracking-wide text-[10px]">
                    {change < 0 ? "⚠ Kurang Bayar" : "✓ Uang Kembali"}
                  </span>
                  <span className="font-black">
                    {formatRupiah(Math.abs(change))}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock size={14} className="text-amber-600" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[11px] font-black text-amber-700 uppercase tracking-wide">
                  Mode Bayar Nanti
                </p>
                <p className="text-[10px] text-amber-600 mt-0.5 leading-relaxed">
                  Masukkan jumlah DP jika pelanggan membayar di muka. Sisa
                  pembayaran akan tercatat sebagai piutang.
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isDisabled}
            className={`w-full h-12 rounded-xl font-black text-sm flex items-center justify-center gap-2.5 transition-all
              ${
                isDisabled
                  ? "bg-gray-100 text-gray-300"
                  : allowZeroPay
                  ? "bg-amber-500 text-white"
                  : "bg-emerald-600 text-white"
              }`}
          >
            {loading ? (
              <span className="animate-pulse">Memproses...</span>
            ) : (
              <>
                <Printer size={15} strokeWidth={2.5} />
                <span>Simpan &amp; Cetak</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
