import Box from "lucide-react/dist/esm/icons/box";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import PlusSquare from "lucide-react/dist/esm/icons/plus-square";

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
  allowZeroPay, // Tambahkan prop baru ini
  isCash,
  dpAmount,
  setDpAmount,
  parseNumber,
  payAmount,
  setPayAmount,
  change,
  handleSubmit,
  isDisabled,
  loading,
}) {
  return (
    <div className="w-full lg:w-2/5 lg:sticky lg:top-5 lg:h-fit">
      <div className="bg-white p-5 rounded-2xl shadow-xl border border-gray-100 flex flex-col">
        {/* HEADER */}
        <h2 className="font-bold text-gray-700 text-[10px] border-b pb-3 mb-4 flex items-center gap-2 uppercase tracking-wide">
          <span className="w-6 h-6 bg-emerald-600 text-white rounded-lg flex items-center justify-center shadow">
            <PlusSquare size={12} strokeWidth={3} />
          </span>
          Checkout
        </h2>

        {/* CART LIST */}
        <div className="max-h-[260px] overflow-y-auto space-y-2 mb-4 pr-1 scrollbar-thin">
          {cart.map((item) => (
            <div
              key={item.id}
              className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center gap-2 group"
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[10px] text-emerald-800 truncate uppercase mb-1">
                  {item.name}
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    className="w-16 border border-orange-400 p-1 rounded text-center text-xs font-black text-orange-600 outline-none focus:ring-1 focus:ring-orange-200"
                    value={item.qty || ""}
                    onChange={(e) =>
                      setCart(
                        cart.map((c) =>
                          c.id === item.id ? { ...c, qty: e.target.value } : c,
                        ),
                      )
                    }
                  />
                  <span className="text-[9px] font-bold text-gray-400 uppercase">
                    {item.unit}
                  </span>
                </div>
              </div>

              <div className="text-right flex flex-col items-end justify-between self-stretch">
                <button
                  onClick={() => setCart(cart.filter((c) => c.id !== item.id))}
                  className="hover:bg-red-50 p-1 rounded"
                >
                  <Trash2 size={12} className="text-red-400" />
                </button>
                <div className="flex flex-col items-end">
                  {toNum(item.original_price) > toNum(item.final_price) && (
                    <span className="text-[7px] text-gray-400 line-through">
                      {formatRupiah(
                        toNum(item.original_price) * toNum(item.qty),
                      )}
                    </span>
                  )}
                  <p className="font-black text-[11px] text-gray-700">
                    {formatRupiah(toNum(item.final_price) * toNum(item.qty))}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="py-12 flex flex-col items-center text-gray-300 border-2 border-dashed border-gray-100 rounded-xl">
              <Box size={32} strokeWidth={1} />
              <p className="text-[10px] font-bold uppercase mt-2">
                Belum ada layanan
              </p>
            </div>
          )}
        </div>

        {/* PAYMENT AREA */}
        <div className="border-t pt-4 space-y-3">
          {/* PAYMENT METHODS SELECTOR */}
          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedPaymentMethod(m)}
                className={`py-2 rounded text-[10px] font-black uppercase border transition-all ${
                  selectedPaymentMethod?.id === m.id
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-gray-400 border-gray-200"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>

          {/* TOTAL DISPLAY */}
          <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-xl">
            <span className="text-emerald-600 font-bold text-[11px] uppercase">
              Grand Total
            </span>
            <span className="text-xl font-black text-emerald-700">
              {formatRupiah(subtotal)}
            </span>
          </div>

          {/* DP INPUT (Muncul jika is_dp_enabled) */}
          {isDpEnabled_dp && (
            <div className="space-y-1 animate-in fade-in duration-300">
              <label className="text-[10px] font-black text-orange-600 uppercase">
                DP / Booking Fee
              </label>
              <input
                type="text"
                value={dpAmount === 0 ? "" : formatRupiah(dpAmount)}
                onChange={(e) => setDpAmount(parseNumber(e.target.value) || 0)}
                className="w-full border-2 border-orange-400 px-3 py-2 rounded-xl font-black text-orange-700 focus:ring-4 focus:ring-orange-100 text-lg"
                placeholder="0"
              />
            </div>
          )}

          {/* PAYMENT INPUT (Hanya muncul jika BUKAN Bayar Nanti) */}
          {!allowZeroPay ? (
            <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black text-emerald-600 uppercase">
                {isCash ? "Input Nominal Tunai" : "Konfirmasi Pembayaran"}
              </label>
              <input
                type="text"
                onFocus={(e) => e.target.select()}
                value={payAmount === 0 ? "" : formatRupiah(payAmount)}
                onChange={(e) => setPayAmount(parseNumber(e.target.value) || 0)}
                className="w-full border-2 border-emerald-600 px-3 py-2.5 rounded-xl text-lg font-black text-emerald-700 focus:ring-4 focus:ring-emerald-100"
                placeholder="0"
              />

              {isCash && (
                <div className="flex justify-between text-[10px] font-bold mt-1">
                  <span className="text-gray-400 uppercase">
                    {change < 0 ? "Kurang Bayar" : "Uang Kembali"}
                  </span>
                  <span
                    className={change < 0 ? "text-red-600" : "text-emerald-700"}
                  >
                    {formatRupiah(Math.abs(change))}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* INFO BAYAR NANTI */
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center animate-in zoom-in-95 duration-300">
              <p className="text-[10px] font-black text-amber-700 uppercase">
                Mode Bayar Nanti (Piutang)
              </p>
              <p className="text-[9px] text-amber-600">
                Transaksi akan disimpan tanpa pembayaran sekarang.
              </p>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            onClick={handleSubmit}
            disabled={isDisabled}
            className={`w-full py-4 rounded-xl font-black text-white text-xs shadow-md uppercase transition-all ${
              isDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : allowZeroPay
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-emerald-600 hover:bg-emerald-700 active:scale-95"
            }`}
          >
            {loading
              ? "Processing..."
              : allowZeroPay
                ? "Simpan Piutang"
                : "Simpan & Print"}
          </button>
        </div>
      </div>
    </div>
  );
}
