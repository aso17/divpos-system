// Transactions.jsx
// Logic: TIDAK DIUBAH — hanya styling layout wrapper

import React, { useState, useEffect, useRef, useMemo } from "react";
import TransactionService from "../../services/TransactionService";
import { useFormValidation } from "../../hooks/useFormValidation";
import { rules } from "../../utils/validators/rules";
import { inputClasses } from "../../utils/validators/inputClasses";
import AppHead from "../../components/common/AppHead";
import TransactionSuccessModal from "../../components/TransactionSuccessModal";
import TransactionServiceForm from "./TransactionServiceForm";
import TransactionCustomerForm from "./TransactionCustomerForm";
import TransactionCartForm from "./TransactionCartForm";
import { formatRupiah, parseNumber, toNum } from "../../utils/formatter";

import ReceiptText from "lucide-react/dist/esm/icons/receipt-text";

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
        customer_phone: [(v) => rules.phoneID(v, "Format nomor tidak valid")],
        outlet_id: [(v) => rules.required(v, "Pilih outlet terlebih dahulu")],
      },
    );

  // ── Data extraction (TIDAK DIUBAH) ──────────────────────────────────────────
  const {
    is_cash = false,
    is_dp_enabled = false,
    allow_zero_pay = false,
  } = selectedPaymentMethod || {};

  // ── Computation (TIDAK DIUBAH) ───────────────────────────────────────────────
  const subtotal = useMemo(
    () =>
      cart.reduce(
        (acc, item) => acc + toNum(item.final_price) * toNum(item.qty),
        0,
      ),
    [cart],
  );

  const filteredPackages = useMemo(
    () =>
      packages.filter((pkg) =>
        pkg.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [packages, search],
  );

  const dpAmountNum = toNum(dpAmount);
  const payAmountNum = toNum(payAmount);
  const totalDiterima = dpAmountNum + payAmountNum;
  const sisaTagihan = subtotal - dpAmountNum;
  const change = is_cash ? payAmountNum - sisaTagihan : 0;

  const isUnderpaid = !allow_zero_pay && totalDiterima < subtotal;
  const isPaymentEntered = allow_zero_pay || totalDiterima > 0;
  const isDisabled =
    loading || cart.length === 0 || !isPaymentEntered || isUnderpaid;

  // ── Effects (TIDAK DIUBAH) ───────────────────────────────────────────────────
  useEffect(() => {
    if (hasFetched.current) return;
    fetchData();
    hasFetched.current = true;
    return () => abortControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    if (cart.length === 0) {
      setDpAmount(0);
      setPayAmount(0);
    }
  }, [cart.length]);

  // ── Handlers (TIDAK DIUBAH) ──────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      const res = await TransactionService.getInitData();
      const data = res.data.data;
      setPackages(data.packages || []);
      setOutlets(data.outlets || []);
      const payData = data.payment_methods || [];
      setPaymentMethods(payData);
      if (payData.length > 0) setSelectedPaymentMethod(payData[0]);
      if (data.outlets?.length > 0)
        handleChange("outlet_id", data.outlets[0].id);
    } catch (error) {
      triggerToast("Gagal ambil data", "error");
    }
  };

  const handlePhoneChange = async (val) => {
    handleChange("customer_phone", val);
    abortControllerRef.current?.abort();
    if (val.length < 10)
      return setValues((prev) => ({
        ...prev,
        customer_id: null,
        is_new: true,
      }));

    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      const res = await TransactionService.searchCustomer(
        { phone: val },
        { signal: controller.signal },
      );
      const existing = res.data.data;
      setValues((prev) => ({
        ...prev,
        customer_id: existing?.id || null,
        customer_name: existing?.name || "",
        is_new: !existing,
      }));
    } catch (error) {}
  };

  const addToCart = (pkg) => {
    if (cart.find((x) => x.id === pkg.id))
      return triggerToast("Layanan sudah ada.", "warning");
    setCart([...cart, { ...pkg, qty: 1 }]);
  };

  const handleSubmit = async () => {
    if (issubmitting.current || !validate()) return;
    if (cart.length === 0) return triggerToast("Keranjang kosong!", "warning");
    if (!allow_zero_pay && totalDiterima < subtotal)
      return triggerToast(
        `Pembayaran kurang! Total wajib: ${formatRupiah(subtotal)}`,
        "error",
      );

    issubmitting.current = true;
    setLoading(true);
    try {
      const payload = {
        outlet_id: values.outlet_id,
        payment_method_id: selectedPaymentMethod?.id,
        customer: {
          id: values.customer_id,
          name: values.customer_name.trim() || "General",
          phone: values.customer_phone.replace(/\D/g, ""),
          is_new: values.is_new,
        },
        items: cart.map((item) => ({
          package_id: item.id,
          qty: toNum(item.qty),
        })),
        dp_amount: dpAmountNum,
        payment_amount: allow_zero_pay
          ? 0
          : is_cash
            ? payAmountNum
            : sisaTagihan,
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
      triggerToast(error.response?.data?.message || "Gagal!", "error");
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

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHead title="Transaksi" />

      {/* ── Page Header ── */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-6 py-4">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm shadow-emerald-200 flex-shrink-0">
              <ReceiptText size={16} strokeWidth={2.5} className="text-white" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold text-gray-900 leading-tight">
                Transaksi Baru
              </h1>
              <p className="text-[10px] text-gray-400">
                Buat &amp; proses order pelanggan
              </p>
            </div>
          </div>

          {/* Cart count badge — visible on mobile */}
          {cart.length > 0 && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full lg:hidden">
              <span className="text-xs font-bold text-emerald-700">
                {cart.length} layanan
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-5">
        <div className="flex flex-col lg:flex-row gap-5">
          {/* ── LEFT COLUMN: Customer + Services ── */}
          <div className="w-full lg:w-3/5 flex flex-col gap-4">
            <TransactionCustomerForm
              values={values}
              errors={errors}
              outlets={outlets}
              handleChange={handleChange}
              handlePhoneChange={handlePhoneChange}
              inputClasses={inputClasses}
            />
            <TransactionServiceForm
              packages={packages}
              filteredPackages={filteredPackages}
              search={search}
              setSearch={setSearch}
              addToCart={addToCart}
              formatRupiah={formatRupiah}
              toNum={toNum}
            />
          </div>

          {/* ── RIGHT COLUMN: Cart ── */}
          <TransactionCartForm
            cart={cart}
            setCart={setCart}
            paymentMethods={paymentMethods}
            selectedPaymentMethod={selectedPaymentMethod}
            setSelectedPaymentMethod={setSelectedPaymentMethod}
            subtotal={subtotal}
            formatRupiah={formatRupiah}
            toNum={toNum}
            parseNumber={parseNumber}
            isDpEnabled_dp={is_dp_enabled}
            isCash={is_cash}
            allowZeroPay={allow_zero_pay}
            dpAmount={dpAmount}
            setDpAmount={setDpAmount}
            payAmount={payAmount}
            setPayAmount={setPayAmount}
            change={change}
            handleSubmit={handleSubmit}
            isDisabled={isDisabled}
            loading={loading}
          />
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
