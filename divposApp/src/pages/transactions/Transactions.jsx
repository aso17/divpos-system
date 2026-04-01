// Transactions.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
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
import { GetWithExpiry } from "../../utils/Storage";
import ReceiptText from "lucide-react/dist/esm/icons/receipt-text";

const Transactions = () => {
  const hasFetched = useRef(false);
  const issubmitting = useRef(false);
  const abortControllerRef = useRef(null);

  const [cart, setCart] = useState([]);
  const [businessType, setBusinessType] = useState("");
  const [search, setSearch] = useState("");
  const [packages, setPackages] = useState([]);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [payAmount, setPayAmount] = useState(0);
  const [dpAmount, setDpAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [lastTransactionData, setLastTransactionData] = useState(null);
  const [activeServiceId, setActiveServiceId] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState(null);

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
      }
    );

  // ── Payment flags ────────────────────────────────────────────────────────────
  const {
    is_cash = false,
    is_dp_enabled = false,
    allow_zero_pay = false,
  } = selectedPaymentMethod || {};

  // ── Subtotal ─────────────────────────────────────────────────────────────────
  const subtotal = useMemo(
    () =>
      cart.reduce(
        (acc, item) => acc + toNum(item.final_price) * toNum(item.qty),
        0
      ),
    [cart]
  );

  // ── Visible categories: hanya yang punya package di service aktif ─────────────
  const visibleCategories = useMemo(() => {
    if (!activeServiceId) return categories;
    const relevantIds = new Set(
      packages
        .filter((p) => p.service_id === activeServiceId)
        .map((p) => p.category_id)
    );
    return categories.filter((c) => relevantIds.has(c.id));
  }, [activeServiceId, packages, categories]);

  // ── Filtered packages: early-exit tiap kondisi gagal ─────────────────────────
  const filteredPackages = useMemo(() => {
    const q = search.toLowerCase();
    return packages.filter((pkg) => {
      if (activeServiceId && pkg.service_id !== activeServiceId) return false;
      if (activeCategoryId && pkg.category_id !== activeCategoryId)
        return false;
      if (
        q &&
        !(
          pkg.name.toLowerCase().includes(q) ||
          (pkg.code || "").toLowerCase().includes(q) ||
          (pkg.category_name || "").toLowerCase().includes(q)
        )
      )
        return false;
      return true;
    });
  }, [packages, activeServiceId, activeCategoryId, search]);

  // ── Payment computation ───────────────────────────────────────────────────────
  const dpAmountNum = toNum(dpAmount);
  const payAmountNum = toNum(payAmount);
  const totalDiterima = dpAmountNum + payAmountNum;
  const sisaTagihan = subtotal - dpAmountNum;
  const change = is_cash ? payAmountNum - sisaTagihan : 0;

  const isUnderpaid = !allow_zero_pay && totalDiterima < subtotal;
  const isPaymentEntered = allow_zero_pay || totalDiterima > 0;
  const isDisabled =
    loading || cart.length === 0 || !isPaymentEntered || isUnderpaid;

  // ── Effects ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const storedUser = GetWithExpiry("user");
    if (storedUser) {
      setBusinessType(storedUser.tenant?.business_type || "");
      if (storedUser.outlet?.id)
        handleChange("outlet_id", storedUser.outlet.id);
    }
  }, []);

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

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const triggerToast = useCallback((message, type) => {
    window.dispatchEvent(
      new CustomEvent("global-toast", { detail: { message, type } })
    );
  }, []);

  const fetchData = async () => {
    try {
      const res = await TransactionService.getInitData();
      const data = res.data.data;
      setServices(data.services || []);
      setCategories(data.categories || []);
      setPackages(data.packages || []);
      setOutlets(data.outlets || []);
      const payData = data.payment_methods || [];
      setPaymentMethods(payData);
      if (payData.length > 0) setSelectedPaymentMethod(payData[0]);
    } catch {
      triggerToast("Gagal ambil data", "error");
    }
  };

  // Gabungkan setActiveServiceId + reset category dalam 1 handler
  // supaya React batch keduanya jadi 1 render, bukan 2
  const handleServiceChange = useCallback((serviceId) => {
    setActiveServiceId(serviceId);
    setActiveCategoryId(null);
  }, []);

  const handlePhoneChange = useCallback(
    async (val) => {
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
          { signal: controller.signal }
        );
        const existing = res.data.data;
        setValues((prev) => ({
          ...prev,
          customer_id: existing?.id || null,
          customer_name: existing?.name || "",
          is_new: !existing,
        }));
      } catch {}
    },
    [handleChange, setValues]
  );

  const addToCart = useCallback(
    (pkg) => {
      setCart((prev) => {
        if (prev.find((x) => x.id === pkg.id)) {
          triggerToast("Layanan sudah ada.", "warning");
          return prev; // tidak ubah state jika sudah ada — cegah re-render
        }
        return [...prev, { ...pkg, qty: 1 }];
      });
    },
    [triggerToast]
  );

  const handleSubmit = async () => {
    if (issubmitting.current || !validate()) return;
    if (cart.length === 0) return triggerToast("Keranjang kosong!", "warning");
    if (
      ["SLN", "BRB"].includes(businessType) &&
      cart.some((i) => !i.employee_id)
    )
      return triggerToast("Pilih petugas untuk setiap layanan!", "error");
    if (!allow_zero_pay && totalDiterima < subtotal)
      return triggerToast(
        `Pembayaran kurang! Total wajib: ${formatRupiah(subtotal)}`,
        "error"
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
          employee_id: item.employee_id || null,
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

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHead title="Transaksi" />

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
          {cart.length > 0 && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full lg:hidden">
              <span className="text-xs font-bold text-emerald-700">
                {cart.length} layanan
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-5">
        <div className="flex flex-col lg:flex-row gap-5">
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
              filteredPackages={filteredPackages}
              services={services}
              visibleCategories={visibleCategories}
              activeServiceId={activeServiceId}
              activeCategoryId={activeCategoryId}
              onServiceChange={handleServiceChange}
              setActiveCategoryId={setActiveCategoryId}
              search={search}
              setSearch={setSearch}
              addToCart={addToCart}
              formatRupiah={formatRupiah}
              toNum={toNum}
            />
          </div>

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
            isServiceDirect={["SLN", "BRB"].includes(businessType)}
            onSearchEmployee={(keyword) =>
              TransactionService.searchEmployeTransaction({
                outlet_id: values.outlet_id,
                q: keyword,
              })
            }
            outletId={values.outlet_id}
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
