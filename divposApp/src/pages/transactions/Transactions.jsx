import React, { useState, useEffect, useRef } from "react";
import { Pencil, Trash2, PlusSquare, Box } from "lucide-react";
import TransactionService from "../../services/TransactionService";
import { useFormValidation } from "../../hooks/useFormValidation";
import { rules } from "../../utils/validators/rules";
import { inputClasses } from "../../utils/validators/inputClasses";
import AppHead from "../../components/common/AppHead";
import TransactionSuccessModal from "./TransactionSuccessModal";
import { encrypt } from "../../utils/Encryptions";

const Transactions = () => {
  const hasFetched = useRef(false);
  const issubmitting = useRef(false);
  const [cart, setCart] = useState([]);
  const [packages, setPackages] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [payAmount, setPayAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [lastTransactionData, setLastTransactionData] = useState(null);

  // VALIDASI FINAL - Menggabungkan state pelanggan ke dalam hook
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
          (v) => rules.required(v, "Nama pelanggan wajib diisi"),
          (v) => rules.safeString(v, "Nama mengandung karakter ilegal"),
        ],
        customer_phone: [
          (v) => rules.required(v, "Nomor WA wajib diisi"),
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
      // console.log("Init Data:", data);
      setPackages(data.packages || []);
      setOutlets(data.outlets || []);
      setCustomers(data.customers || []);

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

  const handlePhoneChange = (val) => {
    handleChange("customer_phone", val);

    const existing = customers.find((c) => c.phone === val);

    if (existing) {
      setValues((prev) => ({
        ...prev,
        customer_id: existing.id,
        customer_name: existing.name, // Isi nama otomatis
        customer_phone: val, // Pastikan nomor terbaru
        is_new: false, // Kunci input nama (disabled)
      }));

      setErrors((prev) => ({ ...prev, customer_name: "" }));
    } else {
      // Jika pelanggan BARU (Nomor tidak ditemukan)
      setValues((prev) => ({
        ...prev,
        customer_id: null,
        customer_phone: val,
        is_new: true,
      }));
    }
  };
  const safeNumber = (val) => (isNaN(Number(val)) ? 0 : Number(val));
  const subtotal = cart.reduce(
    (acc, item) => acc + safeNumber(item.price) * safeNumber(item.qty),
    0,
  );
  const isCash = selectedPaymentMethod?.name?.toLowerCase().match(/cash|tunai/);
  const change = isCash ? payAmount - subtotal : 0;

  const addToCart = (pkg) => {
    if (cart.find((x) => x.id === pkg.id))
      return triggerToast("Layanan sudah ada.", "warning");
    setCart([...cart, { ...pkg, qty: 1, unit: pkg.unit }]);
  };

  const handleSubmit = async () => {
    if (issubmitting.current) return;
    // console.log("Status Lock:", issubmitting.current);
    if (!validate()) return;
    if (cart.length === 0) return triggerToast("Keranjang kosong!", "warning");
    if (cart.some((item) => item.qty <= 0))
      return triggerToast("Input qty/berat!", "warning");
    if (isCash && payAmount < subtotal)
      return triggerToast("Uang kurang!", "error");

    issubmitting.current = true;
    setLoading(true);
    try {
      const payload = {
        outlet_id: encrypt(values.outlet_id),
        payment_method_id: encrypt(selectedPaymentMethod?.id),
        customer: {
          id: values.customer_id ? encrypt(values.customer_id) : null,
          name: values.customer_name,
          phone: values.customer_phone,
          is_new: values.is_new,
        },
        // HANYA kirim ID dan QTY. Biarkan BE ambil harga asli dari DB
        items: cart.map((item) => ({
          package_id: encrypt(item.id),
          qty: item.qty,
        })),
        // Kirim nominal uang yang diterima kasir secara mentah
        payment_amount: isCash ? payAmount : subtotal,
      };

      const response = await TransactionService.createTransaction(payload);

      // Reset
      setCart([]);
      setPayAmount(0);
      setValues((prev) => ({
        ...prev,
        customer_id: null,
        customer_name: "",
        customer_phone: "",
        is_new: true,
      }));

      // handlePrint(response.data.data.id);
      // console.log("Siap cetak ID:", response.data.data);
      setLastTransactionData(response.data.data);
      setShowModal(true);
      issubmitting.current = false;
    } catch (error) {
      issubmitting.current = false;
      triggerToast("Gagal simpan transaksi!", "error");
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
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => addToCart(pkg)}
                className="p-2 border border-gray-100 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left shadow-sm group"
              >
                <p className="font-bold text-[9px] md:text-[10px] truncate uppercase group-hover:text-emerald-700">
                  {pkg.name}
                </p>
                <p className="text-[10px] text-emerald-600 font-bold mt-1">
                  Rp{safeNumber(pkg.price).toLocaleString()}
                </p>
              </button>
            ))}
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

          <div className="max-h-[250px] overflow-y-auto space-y-2 mb-4 pr-1">
            {cart.map((item) => (
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
                      className="w-16 border border-orange-400 p-0.5 rounded text-center text-xs font-black text-orange-600 outline-none"
                      value={item.qty || ""}
                      onChange={(e) =>
                        setCart(
                          cart.map((c) =>
                            c.id === item.id
                              ? { ...c, qty: parseFloat(e.target.value) || 0 }
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
                <div className="text-right flex flex-col items-end gap-1">
                  <button
                    onClick={() =>
                      setCart(cart.filter((c) => c.id !== item.id))
                    }
                    className="hover:bg-red-50 p-1 rounded transition-colors"
                  >
                    <Trash2
                      size={14}
                      className="text-red-400 hover:text-red-600"
                    />
                  </button>
                  <p className="font-bold text-[10px]">
                    Rp
                    {(
                      safeNumber(item.qty) * safeNumber(item.price)
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="py-10 flex flex-col items-center justify-center text-gray-300">
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
                  {m.name}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center bg-emerald-50 p-2 rounded-lg">
              <span className="text-emerald-600 font-bold text-[10px] uppercase">
                Grand Total
              </span>
              <span className="text-lg font-black text-emerald-700">
                Rp{subtotal.toLocaleString()}
              </span>
            </div>

            {isCash && (
              <div className="space-y-1">
                <input
                  type="number"
                  value={payAmount || ""}
                  onChange={(e) =>
                    setPayAmount(parseFloat(e.target.value) || 0)
                  }
                  className="w-full border-2 border-emerald-600 px-3 py-2 rounded-lg text-sm font-black text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="UANG BAYAR (RP)"
                />
                <div className="flex justify-between text-[10px] px-1 font-bold">
                  <span className="text-gray-400 uppercase">Kembali</span>
                  <span
                    className={change < 0 ? "text-red-500" : "text-emerald-700"}
                  >
                    Rp{Math.abs(change).toLocaleString()}
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
