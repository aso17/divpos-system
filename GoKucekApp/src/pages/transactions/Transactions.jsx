import React, { useState, useEffect } from "react";
import TransactionService from "../../services/TransactionService";
import { encrypt } from "../../utils/Encryptions";

const Transactions = () => {
  const [cart, setCart] = useState([]);
  const [packages, setPackages] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [outlets, setOutlets] = useState([]); // Tambahan State Outlet
  const [selectedOutlet, setSelectedOutlet] = useState(""); // Tambahan State Selected Outlet
  const [paymentMethod, setPaymentMethod] = useState("cash"); // Tambahan State Payment Method
  const [payAmount, setPayAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [customerInput, setCustomerInput] = useState({
    id: null,
    name: "",
    phone: "",
    isNew: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resPkg, resCust, resOut] = await Promise.all([
        TransactionService.getPackages(),
        TransactionService.getCustomers(),
        TransactionService.getOutlets(), // Asumsi service ini ada
      ]);

      setPackages(resPkg.data.data);
      setCustomers(resCust.data.data);
      setOutlets(resOut.data.data);
      if (resOut.data.data.length > 0)
        setSelectedOutlet(resOut.data.data[0].id);
    } catch (error) {
      console.error("Gagal data", error);
    }
  };

  const handlePhoneChange = (e) => {
    const inputPhone = e.target.value;
    const existing = customers.find((c) => c.phone === inputPhone);
    if (existing) {
      setCustomerInput({
        id: existing.id,
        name: existing.name,
        phone: existing.phone,
        isNew: false,
      });
    } else {
      setCustomerInput({
        ...customerInput,
        phone: inputPhone,
        id: null,
        isNew: true,
      });
    }
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const change = payAmount - subtotal;

  const addToCart = (pkg) => {
    if (cart.find((x) => x.id === pkg.id)) return alert("Layanan sudah ada.");
    setCart([...cart, { ...pkg, qty: 0 }]);
  };

  const removeFromCart = (id) => setCart(cart.filter((item) => item.id !== id));

  const handleSubmit = async () => {
    if (!customerInput.name || !customerInput.phone)
      return alert("Isi data pelanggan!");
    if (!selectedOutlet) return alert("Pilih outlet!");
    if (cart.some((item) => item.qty <= 0))
      return alert("Input berat timbangan!");

    setLoading(true);
    const payload = {
      outlet_id: encrypt(selectedOutlet), // Payload Outlet
      payment_method: paymentMethod, // Payload Payment Method
      customer: {
        id: customerInput.id ? encrypt(customerInput.id) : null,
        name: customerInput.name,
        phone: customerInput.phone,
        is_new: customerInput.isNew,
      },
      items: cart.map((item) => ({
        package_id: encrypt(item.id),
        qty: item.qty,
        price: item.price,
        subtotal: item.qty * item.price,
      })),
      total_base_price: subtotal,
      grand_total: subtotal,
      payment_amount: paymentMethod === "cash" ? payAmount : subtotal,
      change_amount: paymentMethod === "cash" ? change : 0,
    };
    try {
      await TransactionService.createTransaction(payload);
      alert("Berhasil!");
      setCart([]);
      setPayAmount(0);
      setCustomerInput({ id: null, name: "", phone: "", isNew: true });
      fetchData();
    } catch (error) {
      alert("Gagal!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-3 p-2 md:p-4 bg-gray-100 min-h-screen font-sans">
      <div className="w-full lg:w-3/5 flex flex-col gap-3">
        {/* PANEL 1: OUTLET & PELANGGAN */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
          <h2 className="font-bold text-gray-700 text-[10px] mb-3 flex items-center gap-2 uppercase">
            <span className="w-4 h-4 bg-green-600 text-white rounded-full flex items-center justify-center text-[9px]">
              1
            </span>
            Informasi Transaksi
          </h2>
          <div className="space-y-3">
            {/* Pemilihan Outlet */}
            <div>
              <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">
                Outlet Aktif
              </label>
              <select
                value={selectedOutlet}
                onChange={(e) => setSelectedOutlet(e.target.value)}
                className="w-full border border-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold outline-none bg-gray-50 focus:ring-1 focus:ring-green-500"
              >
                {outlets.map((out) => (
                  <option key={out.id} value={out.id}>
                    {out.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Input Pelanggan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                type="text"
                className="w-full border border-gray-300 px-3 py-1.5 rounded-lg text-xs outline-none focus:ring-1 focus:ring-green-500"
                value={customerInput.phone}
                onChange={handlePhoneChange}
                placeholder="No. WhatsApp"
              />
              <input
                type="text"
                className={`w-full border border-gray-300 px-3 py-1.5 rounded-lg text-xs ${!customerInput.isNew ? "bg-green-50 font-bold text-green-700 border-green-200" : ""}`}
                value={customerInput.name}
                onChange={(e) =>
                  setCustomerInput({ ...customerInput, name: e.target.value })
                }
                disabled={!customerInput.isNew}
                placeholder="Nama Pelanggan"
              />
            </div>
          </div>
        </div>

        {/* PANEL 2: LAYANAN */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex-1">
          <h2 className="font-bold text-gray-700 text-[10px] mb-3 flex items-center gap-2 uppercase">
            <span className="w-4 h-4 bg-green-600 text-white rounded-full flex items-center justify-center text-[9px]">
              2
            </span>
            Pilih Layanan
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() =>
                  addToCart({ id: pkg.id, name: pkg.name, price: pkg.price })
                }
                className="p-2 border border-gray-100 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left active:bg-green-100 shadow-sm"
              >
                <p className="font-bold text-[9px] md:text-[10px] truncate leading-tight uppercase">
                  {pkg.name}
                </p>
                <p className="text-[10px] text-green-600 font-bold mt-1">
                  Rp{Number(pkg.price).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KANAN: RINGKASAN & BAYAR */}
      <div className="w-full lg:w-2/5 lg:sticky lg:top-4 lg:h-fit">
        <div className="bg-white p-4 rounded-xl shadow-lg border-t-4 border-green-600 flex flex-col overflow-hidden">
          <h2 className="font-bold text-xs text-gray-800 border-b pb-2 mb-3 uppercase italic">
            3. Checkout
          </h2>

          {/* KERANJANG */}
          <div className="max-h-[250px] overflow-y-auto space-y-2 mb-4 pr-1">
            {cart.length === 0 ? (
              <p className="text-center py-4 text-gray-400 text-[10px] italic">
                Keranjang kosong
              </p>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 p-2 rounded-lg border border-gray-200 flex items-center gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[9px] text-green-800 truncate uppercase leading-none mb-1.5">
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
                      <span className="text-[9px] font-bold text-gray-400 uppercase italic">
                        Kg
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-400 mb-1"
                    >
                      ✕
                    </button>
                    <p className="font-bold text-[10px]">
                      Rp{(item.qty * item.price).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* PEMBAYARAN */}
          <div className="border-t pt-3 space-y-2">
            {/* Pemilihan Metode Pembayaran */}
            <div className="grid grid-cols-3 gap-1 mb-2">
              {["cash", "transfer", "qris"].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-1 rounded text-[9px] font-black uppercase border transition-all ${paymentMethod === method ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-400 border-gray-200"}`}
                >
                  {method}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center bg-green-50 p-2 rounded">
              <span className="text-green-600 font-bold text-[10px] uppercase">
                Total
              </span>
              <span className="text-lg font-black text-green-700">
                Rp{subtotal.toLocaleString()}
              </span>
            </div>

            {paymentMethod === "cash" && (
              <div className="space-y-1">
                <input
                  type="number"
                  value={payAmount || ""}
                  onChange={(e) =>
                    setPayAmount(parseFloat(e.target.value) || 0)
                  }
                  className="w-full border-2 border-green-600 px-3 py-1.5 rounded-lg text-sm font-black text-green-700 bg-white outline-none"
                  placeholder="Input Bayar (Rp)"
                />
                <div className="flex justify-between text-[10px] px-1 font-bold">
                  <span className="text-gray-400 uppercase">Kembali</span>
                  <span
                    className={change < 0 ? "text-red-500" : "text-green-700"}
                  >
                    Rp{Math.abs(change).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={
                cart.length === 0 ||
                (paymentMethod === "cash" && change < 0) ||
                loading
              }
              className={`w-full py-3 rounded-xl font-black text-white text-xs shadow-md transition-all uppercase ${cart.length === 0 || (paymentMethod === "cash" && change < 0) || loading ? "bg-gray-300" : "bg-green-600 hover:bg-green-700"}`}
            >
              {loading ? "Proses..." : "Simpan & Print"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
