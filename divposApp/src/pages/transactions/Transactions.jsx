import React, { useState, useEffect, useRef } from "react";
import { Pencil, Trash2, PlusSquare, Box, Search, X } from "lucide-react";
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
  const abortControllerRef = useRef(null);

  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [packages, setPackages] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [payAmount, setPayAmount] = useState(0);
  const [dpAmount, setDpAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [lastTransactionData, setLastTransactionData] = useState(null);
  const [appSettings, setAppSettings] = useState({}); // FIXED: Inisialisasi sebagai Object {}

  const { values, errors, handleChange, validate, setValues } =
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
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const fetchData = async () => {
    try {
      const res = await TransactionService.getInitData();
      const data = res.data.data;
      setPackages(data.packages || []);
      setOutlets(data.outlets || []);
      setAppSettings(data.app_setting || {}); // FIXED: Pastikan menerima Object

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

  const handlePhoneChange = async (val) => {
    handleChange("customer_phone", val);
    if (abortControllerRef.current) abortControllerRef.current.abort();

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
        setValues((prev) => ({ ...prev, customer_id: null, is_new: true }));
      }
    } catch (error) {
      // Ignore abort errors
    }
  };

  const filteredPackages = packages.filter((pkg) =>
    pkg.name.toLowerCase().includes(search.toLowerCase()),
  );

  // Helper Ambil Setting (FIXED: Untuk format Object Key-Value)
  const getSetting = (key, defaultValue) => {
    // 1. Pastikan appSettings adalah Array dan ada isinya
    if (Array.isArray(appSettings) && appSettings.length > 0) {
      // 2. Cari object yang punya key sesuai parameter
      const setting = appSettings.find((s) => s.key === key);

      if (setting) {
        const val = setting.value;

        if (val === true || val === "true" || val === 1 || val === "1")
          return true;
        if (val === false || val === "false" || val === 0 || val === "0")
          return false;
        return val;
      }
    }
    return defaultValue;
  };

  // Logic Perhitungan
  const subtotal = cart.reduce(
    (acc, item) => acc + toNum(item.final_price) * toNum(item.qty),
    0,
  );

  const isCash = selectedPaymentMethod?.name?.toLowerCase().match(/cash|tunai/);
  const dpAmountNum = toNum(dpAmount);
  const payAmountNum = toNum(payAmount);
  const sisaTagihan = subtotal - dpAmountNum;
  const change = isCash ? payAmountNum - sisaTagihan : 0;
  // 1. Ambil Setting Utama saja
  const isDpEnabled_dp = getSetting("trx_enable_dp", false);

  // 2. Fix deteksi object (Wajib agar tombol tidak terkunci terus)
  const isSettingLoaded = appSettings && Object.keys(appSettings).length > 0;

  // 3. Logic Validasi: Jika DP Aktif, total uang (DP + Bayar) tidak boleh 0
  const isZeroPaymentInvalid = isDpEnabled_dp
    ? dpAmountNum + payAmountNum <= 0
    : false;

  const isDisabled =
    loading ||
    !isSettingLoaded ||
    cart.length === 0 ||
    (isCash && isDpEnabled_dp && change < 0) ||
    isZeroPaymentInvalid;
  const addToCart = (pkg) => {
    if (cart.find((x) => x.id === pkg.id))
      return triggerToast("Layanan sudah ada.", "warning");
    setCart([...cart, { ...pkg, qty: 1 }]);
  };
  // Tambahkan useEffect ini Mas A_so
  useEffect(() => {
    if (cart.length === 0) {
      setDpAmount(0);
      setPayAmount(0);
    }
  }, [cart.length]);

  const handleSubmit = async () => {
    if (issubmitting.current || !validate()) return;
    if (cart.length === 0) return triggerToast("Keranjang kosong!", "warning");
    if (cart.some((item) => toNum(item.qty) <= 0))
      return triggerToast("Input qty dengan benar!", "warning");

    if (isCash && isDpEnabled_dp && payAmountNum < sisaTagihan) {
      return triggerToast("Pembayaran kurang!", "error");
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
        dp_amount: dpAmountNum,
        payment_amount: isCash ? payAmountNum : sisaTagihan,
      };

      const response = await TransactionService.createTransaction(payload);

      setCart([]);
      setPayAmount(0);
      setDpAmount(0);
      setValues((prev) => ({
        ...prev,
        customer_id: null,
        customer_name: "",
        customer_phone: "",
        is_new: true,
      }));

      setLastTransactionData(response.data.data);
      setShowModal(true);
    } catch (error) {
      const msg = error.response?.data?.message || "Gagal simpan transaksi!";
      triggerToast(msg, "error");
    } finally {
      issubmitting.current = false;
      setLoading(false);
    }
  };

  const triggerToast = (message, type) => {
    window.dispatchEvent(
      new CustomEvent("global-toast", { detail: { message, type } }),
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-3 md:p-5 bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen font-sans">
      {/* LEFT SIDE */}
      <div className="w-full lg:w-3/5 flex flex-col gap-4">
        <AppHead title="Transaksi" />

        {/* PANEL CUSTOMER */}
        <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
          <h2 className="font-bold text-gray-700 text-[10px] mb-4 flex items-center gap-2 uppercase tracking-wide">
            <span className="w-6 h-6 bg-emerald-600 text-white rounded-lg flex items-center justify-center shadow">
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
                " !text-[11px] !py-2 !px-3 font-bold bg-white h-10 rounded-lg !border-emerald-500 focus:!border-emerald-600 focus:!ring-emerald-100"
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
              <p className="text-[9px] text-red-500 font-bold italic">
                {errors.outlet_id}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  className={
                    inputClasses({ error: !!errors.customer_phone }) +
                    " !text-[11px] !py-2 !px-3 h-10 rounded-lg !border-emerald-500 focus:!border-emerald-600 focus:!ring-emerald-100"
                  }
                  value={values.customer_phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="No. WhatsApp (08...)"
                />

                {errors.customer_phone && (
                  <p className="text-[8px] text-red-500 font-bold italic">
                    {errors.customer_phone}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  className={
                    inputClasses({ error: !!errors.customer_name }) +
                    " !text-[11px] !py-2 !px-3 h-10 rounded-lg !border-emerald-500 focus:!border-emerald-600 focus:!ring-emerald-100 " +
                    (!values.is_new
                      ? "bg-emerald-50 font-black text-emerald-800"
                      : "bg-white")
                  }
                  value={values.customer_name}
                  onChange={(e) =>
                    handleChange("customer_name", e.target.value)
                  }
                  disabled={!values.is_new}
                  placeholder="Nama Pelanggan"
                />

                {errors.customer_name && (
                  <p className="text-[8px] text-red-500 font-bold italic">
                    {errors.customer_name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PANEL SERVICES */}
        <div className="bg-white p-5 rounded-3xl shadow-lg border border-gray-100 flex flex-col flex-1">
          {/* HEADER */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-gray-700 text-xs flex items-center gap-2 uppercase tracking-wider">
              <span className="w-7 h-7 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                <Box size={14} strokeWidth={2.5} />
              </span>
              Pilih Layanan
            </h2>

            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
              {filteredPackages.length} layanan
            </span>
          </div>

          {/* SEARCH BAR */}
          <div className="mb-5 flex items-center gap-3">
            <div className="relative w-full max-w-xs">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari layanan..."
                className="
                w-full
                border border-gray-200
                bg-gray-50
                rounded-xl
                py-2
                pl-9
                pr-8
                text-xs
                font-semibold
                transition
                focus:outline-none
                focus:bg-white
                focus:ring-2
                focus:ring-emerald-100
                focus:border-emerald-500
                "
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* SERVICES GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-3">
            {filteredPackages.map((pkg) => {
              const originalPrice = toNum(pkg.original_price);
              const finalPrice = toNum(pkg.final_price);
              const hasDiscount = originalPrice > finalPrice;

              return (
                <button
                  key={pkg.id}
                  onClick={() => addToCart(pkg)}
                  className="
                      relative
                      p-3
                      border border-gray-100
                      rounded-2xl
                      bg-white
                      text-left
                      flex flex-col justify-between
                      min-h-[105px]

                      shadow-sm
                      hover:shadow-md
                      hover:border-emerald-400
                      hover:bg-emerald-50
                      hover:-translate-y-[2px]
                      active:scale-[0.98]

                      transition-all
                      duration-200
                      group
                      overflow-hidden
                      "
                >
                  {/* PROMO */}
                  {hasDiscount && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-black px-2 py-[2px] rounded-bl-xl shadow-sm">
                      PROMO
                    </div>
                  )}

                  {/* NAME */}
                  <div className="mb-2 mt-3">
                    <p
                      className="
                      font-extrabold
                      text-[10px]
                      leading-tight
                      uppercase
                      line-clamp-2
                      text-gray-700
                      group-hover:text-emerald-700
                      "
                    >
                      {pkg.name}
                    </p>
                  </div>

                  {/* PRICE */}
                  <div className="mt-auto">
                    {hasDiscount && (
                      <p className="text-[8px] text-gray-400 line-through mb-[2px]">
                        {formatRupiah(originalPrice)}
                      </p>
                    )}

                    <div className="flex items-baseline gap-1">
                      <span className="text-[13px] text-emerald-600 font-black">
                        {formatRupiah(finalPrice)}
                      </span>

                      <span className="text-[8px] text-gray-400 font-bold uppercase">
                        /{pkg.unit || "pcs"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* EMPTY STATE */}
          {filteredPackages.length === 0 && (
            <div className="py-14 flex flex-col items-center text-gray-300">
              <Search size={36} strokeWidth={1.5} />

              <p className="text-xs font-bold uppercase mt-3">
                Layanan tidak ditemukan
              </p>

              <p className="text-[10px] text-gray-400 mt-1">
                Coba kata kunci lain
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE CHECKOUT */}

      <div className="w-full lg:w-2/5 lg:sticky lg:top-5 lg:h-fit">
        <div className="bg-white p-5 rounded-2xl shadow-xl border border-gray-100 flex flex-col">
          <h2 className="font-bold text-gray-700 text-[10px] border-b pb-3 mb-4 flex items-center gap-2 uppercase tracking-wide">
            <span className="w-6 h-6 bg-emerald-600 text-white rounded-lg flex items-center justify-center shadow">
              <PlusSquare size={12} strokeWidth={3} />
            </span>
            Checkout
          </h2>

          {/* CART */}

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
                            c.id === item.id
                              ? { ...c, qty: e.target.value }
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

          {/* PAYMENT */}

          <div className="border-t pt-4 space-y-3">
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

            <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-xl">
              <span className="text-emerald-600 font-bold text-[11px] uppercase">
                Grand Total
              </span>

              <span className="text-xl font-black text-emerald-700">
                Rp{formatRupiah(subtotal)}
              </span>
            </div>

            {/* INPUT DP */}

            {isDpEnabled_dp && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-orange-600 uppercase">
                  DP / Booking Fee
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-600 font-black">
                    Rp
                  </span>

                  <input
                    type="text"
                    value={dpAmount === 0 ? "" : formatRupiah(dpAmount)}
                    onChange={(e) =>
                      setDpAmount(parseNumber(e.target.value) || 0)
                    }
                    className="w-full border-2 border-orange-400 pl-10 pr-3 py-2 rounded-xl font-black text-orange-700 focus:ring-4 focus:ring-orange-100"
                    placeholder="0"
                  />
                </div>
              </div>
            )}

            {/* INPUT BAYAR */}

            {isCash && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-emerald-600 uppercase">
                  Input Pembayaran
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-black">
                    Rp
                  </span>

                  <input
                    type="text"
                    onFocus={(e) => e.target.select()}
                    value={payAmount === 0 ? "" : formatRupiah(payAmount)}
                    onChange={(e) =>
                      setPayAmount(parseNumber(e.target.value) || 0)
                    }
                    className="w-full border-2 border-emerald-600 pl-10 pr-3 py-2.5 rounded-xl text-lg font-black text-emerald-700 focus:ring-4 focus:ring-emerald-100"
                    placeholder="0"
                  />
                </div>

                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-gray-400 uppercase">
                    {change < 0 ? "Kurang Bayar" : "Uang Kembali"}
                  </span>

                  <span
                    className={`${change < 0 ? "text-red-600" : "text-emerald-700"}`}
                  >
                    {formatRupiah(Math.abs(change))}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isDisabled}
              className={`w-full py-3 rounded-xl font-black text-white text-xs shadow-md uppercase transition-all ${
                isDisabled
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 active:scale-95"
              }`}
            >
              {loading
                ? "Processing..."
                : isZeroPaymentInvalid
                  ? "Input Nominal Bayar/DP"
                  : "Simpan & Print"}
            </button>
          </div>
        </div>
      </div>

      <TransactionSuccessModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        data={lastTransactionData}
      />
    </div>
  );
};

export default Transactions;
