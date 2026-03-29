import React, { useEffect, useRef, useState, useCallback } from "react";
import Select from "react-select";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list";
import ReceiptText from "lucide-react/dist/esm/icons/receipt-text";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Printer from "lucide-react/dist/esm/icons/printer";
import Clock from "lucide-react/dist/esm/icons/clock";
import Minus from "lucide-react/dist/esm/icons/minus";
import Plus from "lucide-react/dist/esm/icons/plus";
import Box from "lucide-react/dist/esm/icons/box";
import User from "lucide-react/dist/esm/icons/user";

// ─── FIX: options disimpan di Map per itemId — bukan di cart state ────────
// Dengan ini update options tidak trigger re-render seluruh cart.
// Map{ itemId → Option[] }
function useEmployeeOptionsMap() {
  const [optionsMap, setOptionsMap] = useState({});

  const setOptions = useCallback((itemId, options) => {
    setOptionsMap((prev) => ({ ...prev, [itemId]: options }));
  }, []);

  const getOptions = useCallback(
    (itemId) => optionsMap[itemId] || [],
    [optionsMap]
  );

  return { getOptions, setOptions };
}

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
  isServiceDirect,
  onSearchEmployee,
  outletId,
}) {
  const cartCount = cart.reduce((s, i) => s + toNum(i.qty), 0);

  // FIX: Map per itemId — setiap item punya controller dan timer sendiri
  // key: itemId (string), value: AbortController | TimeoutId
  const controllersRef = useRef({}); // { [itemId]: AbortController }
  const timersRef = useRef({}); // { [itemId]: timeoutId }

  const { getOptions, setOptions } = useEmployeeOptionsMap();

  // Cleanup semua controller + timer saat unmount
  useEffect(() => {
    return () => {
      Object.values(controllersRef.current).forEach((c) => c?.abort());
      Object.values(timersRef.current).forEach((t) => clearTimeout(t));
    };
  }, []);

  // ── FIX: satu fungsi fetch terpadu dengan controller per itemId ───────────
  const fetchEmployees = useCallback(
    (itemId, keyword = "") => {
      if (!outletId) return;

      // Batalkan request sebelumnya KHUSUS untuk item ini, bukan semua item
      controllersRef.current[itemId]?.abort();
      if (timersRef.current[itemId]) clearTimeout(timersRef.current[itemId]);

      timersRef.current[itemId] = setTimeout(
        async () => {
          const controller = new AbortController();
          controllersRef.current[itemId] = controller;

          try {
            const res = await onSearchEmployee(keyword, {
              signal: controller.signal,
            });

            const options = (res.data?.data || []).map((emp) => ({
              value: emp.id,
              label: `${emp.full_name} (${emp.employee_code || "Staff"})`,
            }));

            setOptions(itemId, options);
          } catch (err) {
            if (err.name === "AbortError") return;
            console.error("Fetch employee error:", err);
          }
        },
        keyword ? 400 : 0
      ); // debounce 400ms saat search, langsung saat menu open
    },
    [outletId, onSearchEmployee, setOptions]
  );

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: "10px",
      fontSize: "11px",
      minHeight: "34px",
      backgroundColor: state.isDisabled ? "#f9fafb" : "white",
      borderColor: state.isFocused ? "#10b981" : "#e5e7eb",
      boxShadow: "none",
      "&:hover": { borderColor: "#10b981" },
    }),
    placeholder: (base) => ({ ...base, color: "#9ca3af" }),
    input: (base) => ({ ...base, color: "#374151" }),
    singleValue: (base) => ({ ...base, color: "#065f46", fontWeight: "700" }),
    option: (base, state) => ({
      ...base,
      fontSize: "11px",
      backgroundColor: state.isSelected
        ? "#10b981"
        : state.isFocused
        ? "#ecfdf5"
        : "white",
      color: state.isSelected ? "white" : "#374151",
      cursor: "pointer",
      "&:active": { backgroundColor: "#10b981" },
    }),
    // --- PERBAIKAN DI SINI ---
    menu: (base) => ({
      ...base,
      borderRadius: "10px",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      zIndex: 9999, // Naikkan zIndex agar tidak tertutup elemen lain
      marginTop: "4px", // Beri sedikit jarak agar rapi
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999, // Sangat penting jika menggunakan menuPortalTarget={document.body}
    }),
    // -------------------------
  };

  useEffect(() => {
    if (!isCash && !allowZeroPay) {
      const target = isDpEnabled_dp ? toNum(dpAmount) : toNum(subtotal);
      setPayAmount(target);
    }
  }, [isCash, subtotal, dpAmount, isDpEnabled_dp, allowZeroPay, setPayAmount]);

  return (
    <div className="w-full lg:w-2/5 lg:sticky lg:top-5 lg:h-fit">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
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
            <span
              className="min-w-[24px] h-6 bg-emerald-600 text-white text-[11px]
              font-bold rounded-full flex items-center justify-center px-2"
            >
              {cartCount}
            </span>
          )}
        </div>

        {/* Cart items */}
        <div className="max-h-[380px] overflow-y-auto px-4 py-3 space-y-3">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col p-3 bg-gray-50 border border-gray-100
                  rounded-xl hover:border-emerald-200 transition-all duration-150"
              >
                {/* Nama + qty + hapus */}
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-gray-700 uppercase truncate mb-2">
                      {item.name}
                    </p>
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
                        className="w-6 h-6 rounded-lg bg-white border border-gray-200
                          flex items-center justify-center hover:bg-emerald-50"
                      >
                        <Minus size={10} />
                      </button>
                      <input
                        type="number"
                        step="any"
                        className="w-14 h-7 bg-white border border-emerald-300 rounded-lg
                          text-center text-xs font-black text-emerald-700 outline-none"
                        value={item.qty || ""}
                        onChange={(e) =>
                          setCart(
                            cart.map((c) =>
                              c.id === item.id
                                ? { ...c, qty: e.target.value }
                                : c
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
                        className="w-6 h-6 rounded-lg bg-white border border-gray-200
                          flex items-center justify-center hover:bg-emerald-50"
                      >
                        <Plus size={10} />
                      </button>
                      <span className="text-[9px] font-bold text-gray-400 uppercase">
                        {item.unit}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between self-stretch">
                    <button
                      onClick={() =>
                        setCart(cart.filter((c) => c.id !== item.id))
                      }
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    <p className="text-sm font-black text-gray-800">
                      {formatRupiah(toNum(item.final_price) * toNum(item.qty))}
                    </p>
                  </div>
                </div>

                {/* Dropdown assign employee */}
                {isServiceDirect && (
                  <div className="mt-3 pt-3 border-t border-gray-200/50">
                    <label
                      className="text-[9px] font-black text-emerald-600 uppercase
                               tracking-widest mb-1.5 flex items-center gap-1"
                    >
                      <User size={10} /> Pengerjaan / Stylist
                    </label>
                    <Select
                      placeholder={
                        !outletId
                          ? "Pilih outlet dulu..."
                          : "Pilih/Cari petugas..."
                      }
                      noOptionsMessage={({ inputValue }) =>
                        !inputValue
                          ? "Klik untuk melihat daftar"
                          : "Tidak ditemukan"
                      }
                      loadingMessage={() => "Mencari..."}
                      styles={selectStyles}
                      isClearable
                      isDisabled={!outletId}
                      // ─── TAMBAHKAN 3 BARIS INI AGAR TIDAK PERLU SCROLL ───
                      menuPortalTarget={
                        typeof document !== "undefined" ? document.body : null
                      }
                      menuPlacement="auto"
                      menuShouldScrollIntoView={true}
                      // ──────────────────────────────────────────────────────

                      filterOption={() => true}
                      onMenuOpen={() => fetchEmployees(item.id, "")}
                      onInputChange={(newValue, { action }) => {
                        if (action === "input-change") {
                          fetchEmployees(item.id, newValue);
                        }
                      }}
                      options={getOptions(item.id)}
                      value={
                        item.employee_id
                          ? {
                              value: item.employee_id,
                              label: item.employee_name,
                            }
                          : null
                      }
                      onChange={(selected) => {
                        setCart((prev) =>
                          prev.map((c) =>
                            c.id === item.id
                              ? {
                                  ...c,
                                  employee_id: selected?.value || null,
                                  employee_name: selected?.label || "",
                                }
                              : c
                          )
                        );
                      }}
                    />
                    {!item.employee_id && (
                      <p className="text-[8px] text-red-400 mt-1 italic animate-pulse">
                        * Wajib pilih petugas
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div
              className="py-8 flex flex-col items-center border-2 border-dashed
              border-gray-100 rounded-2xl"
            >
              <Box size={24} className="text-gray-200 mb-2" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Keranjang Kosong
              </p>
            </div>
          )}
        </div>

        {/* Payment section */}
        <div className="border-t border-gray-50 px-4 pb-4 pt-4 space-y-4">
          {/* Metode pembayaran */}
          <div>
            <p
              className="text-[10px] font-bold text-gray-400 uppercase tracking-widest
              mb-2 flex items-center gap-1.5"
            >
              <CreditCard size={11} className="text-emerald-500" /> Metode
              Pembayaran
            </p>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedPaymentMethod(m)}
                  className={`py-2 px-1 rounded-xl text-[10px] font-bold uppercase border transition-all
                    ${
                      selectedPaymentMethod?.id === m.id
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-white text-gray-400 border-gray-200 hover:border-emerald-300 hover:text-emerald-600"
                    }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-emerald-600 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-emerald-200 text-[10px] font-semibold uppercase tracking-widest leading-none">
                Total Bayar
              </p>
              <p className="text-2xl font-black text-white leading-tight mt-1">
                {formatRupiah(subtotal)}
              </p>
            </div>
            <ReceiptText
              size={20}
              className="text-white/40"
              strokeWidth={2.5}
            />
          </div>

          {/* DP */}
          {isDpEnabled_dp && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-amber-600 uppercase">
                DP / Booking Fee
              </label>
              <input
                type="text"
                value={dpAmount === 0 ? "" : formatRupiah(dpAmount)}
                onChange={(e) => setDpAmount(parseNumber(e.target.value) || 0)}
                className="w-full h-11 border-2 border-amber-300 bg-amber-50 rounded-xl
                  px-4 font-black text-amber-700 outline-none focus:border-amber-500"
                placeholder="Rp 0"
              />
            </div>
          )}

          {/* Nominal bayar */}
          {!allowZeroPay ? (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-emerald-700 uppercase">
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
                className={`w-full h-11 border-2 rounded-xl px-4 font-black text-lg outline-none transition-all
                  ${
                    !isCash
                      ? "bg-gray-100 border-gray-200 text-gray-400"
                      : "bg-white border-emerald-400 text-emerald-700 focus:border-emerald-600"
                  }`}
                placeholder="Rp 0"
              />
              {isCash && (
                <div
                  className={`flex items-center justify-between text-xs font-bold px-3 py-1.5 rounded-lg
                  ${
                    change < 0
                      ? "bg-red-50 text-red-600"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  <span className="uppercase text-[9px]">
                    {change < 0 ? "Kurang" : "Kembali"}
                  </span>
                  <span className="font-black">
                    {formatRupiah(Math.abs(change))}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div
              className="bg-amber-50 border border-amber-100 rounded-xl p-3
              flex items-start gap-2.5"
            >
              <Clock size={14} className="text-amber-600 mt-0.5" />
              <p className="text-[10px] text-amber-700 font-bold leading-tight">
                MODE BAYAR NANTI
                <br />
                <span className="font-normal opacity-80 text-[9px]">
                  Sisa tagihan akan dicatat sebagai piutang.
                </span>
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isDisabled}
            className={`w-full h-12 rounded-xl font-black text-sm flex items-center
              justify-center gap-2 transition-all
              ${
                isDisabled
                  ? "bg-gray-100 text-gray-300"
                  : "bg-emerald-600 text-white shadow-lg shadow-emerald-200 active:scale-[0.98]"
              }`}
          >
            {loading ? (
              <span className="animate-pulse">MEMPROSES...</span>
            ) : (
              <>
                <Printer size={16} strokeWidth={2.5} />
                <span>SIMPAN &amp; CETAK</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
