import React, { useState, useEffect, useRef } from "react";
import { Pencil, Trash2, PlusSquare, Box } from "lucide-react";
import TransactionService from "../../services/TransactionService";
import { useFormValidation } from "../../hooks/useFormValidation";
import { rules } from "../../utils/validators/rules";
import { inputClasses } from "../../utils/validators/inputClasses";
import AppHead from "../../components/common/AppHead";
import TransactionSuccessModal from "./TransactionSuccessModal";
import { formatRupiah, parseNumber, toNum } from "../../utils/formatter";

const Transactions = () => {
  const hasFetched = useRef(false);
  const issubmitting = useRef(false);
  const [cart, setCart] = useState([]);
  const [packages, setPackages] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [payAmount, setPayAmount] = useState(0);
  const [dpAmount, setDpAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [lastTransactionData, setLastTransactionData] = useState(null);

  const abortControllerRef = useRef(null);

  const { values, errors, handleChange, validate, setValues, setErrors } =
    useFormValidation(
      {
        customer_id: null,
        customer_name: "",
        customer_phone: "",
        outlet_id: "",
        is_new: true,
      },
      {
        customer_name: [
          (v) => rules.safeString(v, "Nama mengandung karakter ilegal"),
        ],
        customer_phone: [
          (v) => rules.phoneID(v, "Format nomor tidak valid (Gunakan 08/628)"),
        ],
        outlet_id: [(v) => rules.required(v, "Pilih outlet terlebih dahulu")],
      },
    );

  useEffect(() => {
    if (hasFetched.current) return;
    fetchData();
    hasFetched.current = true;
  }, []);

  const fetchData = async () => {
    try {
      const res = await TransactionService.getInitData();
      const data = res.data.data;
      setPackages(data.packages || []);
      setOutlets(data.outlets || []);
      const payData = data.payment_methods || [];
      setPaymentMethods(payData);

      if (payData.length > 0) setSelectedPaymentMethod(payData[0]);
      if (data.outlets?.length > 0) {
        handleChange("outlet_id", data.outlets[0].id);
      }
    } catch (error) {
      triggerToast("Gagal ambil data", "error");
    }
  };

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const handlePhoneChange = async (val) => {
    handleChange("customer_phone", val);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (val.length < 10) {
      setValues((prev) => ({ ...prev, customer_id: null, is_new: true }));
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      const res = await TransactionService.searchCustomer(
        { phone: val },
        { signal: controller.signal },
      );

      const existing = res.data.data;
      if (existing) {
        setValues((prev) => ({
          ...prev,
          customer_id: existing.id,
          customer_name: existing.name,
          is_new: false,
        }));
      } else {
        setValues((prev) => ({
          ...prev,
          customer_id: null,
          is_new: true,
        }));
      }
    } catch (error) {}
  };

  // --- LOGIC PERHITUNGAN FINAL ---

  const subtotal = cart.reduce((acc, item) => {
    const harga = toNum(item.final_price);
    const qty = toNum(item.qty);

    return acc + harga * qty;
  }, 0);

  const isCash = selectedPaymentMethod?.name?.toLowerCase().match(/cash|tunai/);
  const dpAmountNum = toNum(dpAmount);
  const payAmountNum = toNum(payAmount);
  const sisaTagihan = subtotal - dpAmountNum;
  const change = isCash ? payAmountNum - sisaTagihan : 0;
  const totalHemat = cart.reduce((acc, item) => {
    const hargaAsli = toNum(item.original_price);
    const hargaFinal = toNum(item.final_price);
    const qty = toNum(item.qty);
    if (hargaAsli > hargaFinal) {
      return acc + (hargaAsli - hargaFinal) * qty;
    }
    return acc;
  }, 0);

  const addToCart = (pkg) => {
    if (cart.find((x) => x.id === pkg.id))
      return triggerToast("Layanan sudah ada.", "warning");
    setCart([...cart, { ...pkg, qty: 1, unit: pkg.unit }]);
    setPayAmount(0);
  };

  const handleSubmit = async () => {
    if (issubmitting.current) return;
    if (!validate()) return;

    // 1. Validasi Keranjang
    if (cart.length === 0) return triggerToast("Keranjang kosong!", "warning");
    if (cart.some((item) => toNum(item.qty) <= 0)) {
      return triggerToast("Input qty/berat dengan benar!", "warning");
    }

    // 2. Validasi Pembayaran Tunai (Dicek terhadap sisa tagihan)
    if (isCash && payAmountNum < sisaTagihan) {
      return triggerToast("Uang tunai kurang dari sisa tagihan!", "error");
    }

    issubmitting.current = true;
    setLoading(true);

    try {
      const payload = {
        outlet_id: values.outlet_id,
        payment_method_id: selectedPaymentMethod?.id,
        customer: {
          id: values.customer_id || null,
          name: values.customer_name.trim() || "General",
          phone: values.customer_phone.replace(/\D/g, "") || null,
          is_new: values.is_new,
        },
        items: cart.map((item) => ({
          package_id: item.id,
          qty: toNum(item.qty),
        })),
        // Nominal DP yang diinput
        dp_amount: dpAmountNum,
        // Jika Cash: kirim nominal yang diinput kasir.
        // Jika QRIS/Lainnya: kirim sisa tagihan (pelunasan otomatis pas).
        payment_amount: isCash ? payAmountNum : sisaTagihan,
      };

      const response = await TransactionService.createTransaction(payload);

      // 3. Reset State Setelah Sukses
      setCart([]);
      setPayAmount(0);
      setDpAmount(0); // Penting agar DP tidak terbawa ke transaksi berikutnya
      setValues((prev) => ({
        ...prev,
        customer_id: null,
        customer_name: "",
        customer_phone: "",
        is_new: true,
      }));

      // Tampilkan Modal Sukses & Print
      setLastTransactionData(response.data.data);
      setShowModal(true);

      // Reset flag submit
      issubmitting.current = false;
    } catch (error) {
      issubmitting.current = false;
      // Cek jika ada pesan error spesifik dari backend
      const msg = error.response?.data?.message || "Gagal simpan transaksi!";
      triggerToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const triggerToast = (message, type) => {
    window.dispatchEvent(
      new CustomEvent("global-toast", { detail: { message, type } }),
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-3 p-2 md:p-4 bg-gray-100 min-h-screen font-sans">
      <div className="w-full lg:w-3/5 flex flex-col gap-3">
        <AppHead title="Transaksi" />

        {/* PANEL 1: INFORMASI TRANSAKSI */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
          <h2 className="font-bold text-gray-700 text-[10px] mb-3 flex items-center gap-2 uppercase">
            <span className="w-5 h-5 bg-emerald-600 text-white rounded-lg flex items-center justify-center shadow-sm">
              <Pencil size={12} strokeWidth={3} />
            </span>
            Informasi Transaksi
          </h2>
          <div className="space-y-3">
            <select
              value={values.outlet_id}
              onChange={(e) => handleChange("outlet_id", e.target.value)}
              className={
                inputClasses({ error: !!errors.outlet_id }) +
                " !text-[10px] !py-1 !px-2 font-bold bg-white h-8 !border-emerald-500 focus:!border-emerald-600 focus:!ring-emerald-100"
              }
            >
              <option value="">-- Pilih Outlet --</option>
              {outlets.map((out) => (
                <option key={out.id} value={out.id}>
                  {out.name}
                </option>
              ))}
            </select>
            {errors.outlet_id && (
              <p className="text-[9px] text-red-500 font-bold mt-1 italic">
                {errors.outlet_id}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <input
                  type="text"
                  className={
                    inputClasses({ error: !!errors.customer_phone }) +
                    " !text-[10px] !py-1 !px-2 h-8 !border-emerald-500 focus:!border-emerald-600 focus:!ring-emerald-100"
                  }
                  value={values.customer_phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="No. WhatsApp (08...)"
                />
                {errors.customer_phone && (
                  <p className="text-[8px] text-red-500 font-bold mt-0.5 italic px-1">
                    {errors.customer_phone}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  className={
                    inputClasses({ error: !!errors.customer_name }) +
                    " !text-[10px] !py-1 !px-2 h-8 !border-emerald-500 focus:!border-emerald-600 focus:!ring-emerald-100 " +
                    (!values.is_new
                      ? " bg-emerald-50 font-black text-emerald-800"
                      : " bg-white")
                  }
                  value={values.customer_name}
                  onChange={(e) =>
                    handleChange("customer_name", e.target.value)
                  }
                  disabled={!values.is_new}
                  placeholder="Nama Pelanggan"
                />
                {errors.customer_name && (
                  <p className="text-[8px] text-red-500 font-bold mt-0.5 italic px-1">
                    {errors.customer_name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PANEL 2: PILIH LAYANAN */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex-1">
          <h2 className="font-bold text-gray-700 text-[10px] mb-3 flex items-center gap-2 uppercase">
            <span className="w-5 h-5 bg-emerald-600 text-white rounded-lg flex items-center justify-center shadow-sm">
              <Box size={12} strokeWidth={3} />
            </span>
            Pilih Layanan
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
            {packages.map((pkg) => {
              const originalPrice = Number(pkg.original_price || 0);
              const finalPrice = Number(pkg.final_price || 0);
              const hasDiscount = originalPrice > finalPrice;

              return (
                <button
                  key={pkg.id}
                  onClick={() => addToCart(pkg)}
                  className="relative p-2.5 border border-gray-100 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left shadow-sm group bg-white overflow-hidden flex flex-col justify-between h-full min-h-[85px]"
                >
                  {hasDiscount && (
                    <div className="absolute top-0 right-0 bg-red-600 text-white text-[7px] font-black px-2 py-0.5 rounded-bl-lg shadow-sm z-10">
                      PROMO
                    </div>
                  )}
                  <div className="mb-2">
                    <p className="font-extrabold mt-2 text-[9px] md:text-[8px] leading-tight uppercase group-hover:text-emerald-700 line-clamp-2">
                      {pkg.name}
                    </p>
                  </div>

                  <div className="mt-auto">
                    {hasDiscount && (
                      <p className="text-[8px] text-gray-400 line-through leading-none mb-0.5">
                        {formatRupiah(originalPrice)}
                      </p>
                    )}

                    <div className="flex flex-wrap items-baseline gap-0.5">
                      <span className="text-[11px] text-emerald-600 font-black whitespace-nowrap">
                        {formatRupiah(finalPrice)}
                      </span>
                      <span className="text-[8px] text-gray-400 font-bold uppercase">
                        /{pkg.unit || "Pcs"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* KANAN: CHECKOUT */}
      <div className="w-full lg:w-2/5 lg:sticky lg:top-4 lg:h-fit">
        <div className="bg-white p-4 rounded-xl shadow-lg border-t-4 border-emerald-600 flex flex-col">
          <h2 className="font-bold text-gray-700 text-[10px] border-b pb-3 mb-4 flex items-center gap-2 uppercase">
            <span className="w-5 h-5 bg-emerald-600 text-white rounded-lg flex items-center justify-center shadow-sm">
              <PlusSquare size={12} strokeWidth={3} />
            </span>
            Checkout
          </h2>

          <div className="max-h-[250px] overflow-y-auto space-y-2 mb-4 pr-1 scrollbar-thin">
            {cart.map((item) => {
              const qty = toNum(item.qty || 0);
              const originalPrice = toNum(item.original_price || 0);
              const finalPrice = toNum(item.final_price || 0);
              const subtotalItem = qty * finalPrice;
              const hasDiscount = originalPrice > finalPrice;

              return (
                <div
                  key={item.id}
                  className="bg-gray-50 p-2 rounded-lg border border-gray-200 flex items-center gap-2 group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[9px] text-emerald-800 truncate uppercase mb-1">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="any"
                        className="w-16 border border-orange-400 p-0.5 rounded text-center text-xs font-black text-orange-600 outline-none focus:ring-1 focus:ring-orange-200"
                        value={item.qty || ""}
                        onChange={(e) =>
                          setCart(
                            cart.map((c) =>
                              c.id === item.id
                                ? { ...c, qty: toNum(e.target.value) }
                                : c,
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
                      onClick={() =>
                        setCart(cart.filter((c) => c.id !== item.id))
                      }
                      className="hover:bg-red-50 p-1 rounded transition-colors"
                    >
                      <Trash2
                        size={12}
                        className="text-red-300 group-hover:text-red-600"
                      />
                    </button>

                    <div className="flex flex-col items-end">
                      {/* Harga Coret per item jika ada diskon */}
                      {hasDiscount && (
                        <span className="text-[7px] text-gray-400 line-through leading-none">
                          {formatRupiah(originalPrice * qty)}
                        </span>
                      )}
                      <p className="font-black text-[10px] text-gray-700 leading-tight">
                        {formatRupiah(subtotalItem)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {cart.length === 0 && (
              <div className="py-10 flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-100 rounded-xl">
                <Box size={32} strokeWidth={1} />
                <p className="text-[9px] font-bold uppercase mt-2">
                  Belum ada layanan
                </p>
              </div>
            )}
          </div>

          {/* PAYMENT SECTION */}
          <div className="border-t pt-3 space-y-3">
            <div className="grid grid-cols-3 gap-1">
              {paymentMethods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedPaymentMethod(m)}
                  className={`py-1.5 rounded text-[9px] font-black uppercase border transition-all ${selectedPaymentMethod?.id === m.id ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-400 border-gray-200"}`}
                >
                  {m.type}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center bg-emerald-50 p-2 rounded-lg">
              <span className="text-emerald-600 font-bold text-[10px] uppercase">
                Grand Total
              </span>
              <span className="text-lg font-black text-emerald-700">
                Rp{formatRupiah(subtotal)}
              </span>
            </div>

            {/* INPUT DP / BOOKING FEE */}
            <div className="space-y-1 mb-3">
              <label className="text-[9px] font-black text-orange-600 px-1 uppercase">
                DP / Booking Fee
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-600 font-black text-sm">
                  Rp
                </span>
                <input
                  type="text"
                  value={dpAmount === 0 ? "" : formatRupiah(dpAmount)}
                  onChange={(e) => setDpAmount(parseNumber(e.target.value))}
                  className="w-full border-2 border-orange-400 pl-10 pr-3 py-2 rounded-xl text-md font-black text-orange-700 outline-none focus:ring-4 focus:ring-orange-100 transition-all"
                  placeholder="0"
                />
              </div>
            </div>

            {/* SISA TAGIHAN INFO */}
            <div className="flex justify-between items-center bg-gray-100 p-2 rounded-lg mb-3">
              <span className="text-gray-500 font-bold text-[9px] uppercase">
                Sisa Tagihan
              </span>
              <span className="text-md font-black text-gray-700">
                Rp{formatRupiah(sisaTagihan)}
              </span>
            </div>

            {isCash && (
              <div className="space-y-1 animate-in fade-in duration-300">
                <label className="text-[9px] font-black text-emerald-600 px-1 uppercase">
                  Input Pembayaran
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-sm">
                    Rp
                  </span>
                  <input
                    type="text"
                    onFocus={(e) => e.target.select()}
                    value={payAmount === 0 ? "" : formatRupiah(payAmount)}
                    onChange={(e) => {
                      const clean = parseNumber(e.target.value);
                      setPayAmount(clean);
                    }}
                    className="w-full border-2 border-emerald-600 pl-10 pr-3 py-2.5 rounded-xl text-lg font-black text-emerald-700 outline-none focus:ring-4 focus:ring-emerald-100 transition-all placeholder:text-emerald-200"
                    placeholder="0"
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] px-1 font-extrabold mt-2">
                  <span className="text-gray-400 uppercase tracking-tighter">
                    {change < 0 ? "Kurang Bayar" : "Uang Kembali"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded ${
                      change < 0
                        ? "bg-red-50 text-red-600"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {/* formatRupiah sudah cukup, Math.abs memastikan tidak ada tanda minus double */}
                    {formatRupiah(Math.abs(change))}
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading || cart.length === 0 || (isCash && change < 0)}
              className={`w-full py-3 rounded-xl font-black text-white text-xs shadow-md uppercase transition-all
                ${loading || cart.length === 0 || (isCash && change < 0) ? "bg-gray-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 active:scale-95"}`}
            >
              {loading ? "Processing..." : "Simpan & Print"}
            </button>
          </div>
        </div>
      </div>

      {/* COMPONENT PRINT */}
      <TransactionSuccessModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        data={lastTransactionData}
      />
    </div>
  );
};

export default Transactions;
