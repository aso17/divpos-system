import React from "react";
import X from "lucide-react/dist/esm/icons/x";
import Receipt from "lucide-react/dist/esm/icons/receipt";
import { formatRupiah } from "../../utils/formatter";

export default function DetailPaymentModal({ isOpen, onClose, transaction }) {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-xl">
              <Receipt size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase leading-none">
                Detail Transaksi
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 font-bold">
                {transaction.invoice_no}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Section: Customer & Info */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                Customer
              </span>
              <p className="text-sm font-bold text-slate-800">
                {transaction.customer_name}
              </p>
              <p className="text-[10px] text-slate-400 font-bold">
                {transaction.customer_phone}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                Tanggal Order
              </span>
              <p className="text-[10px] font-bold text-slate-700">
                {transaction.order_date}
              </p>
            </div>
          </div>

          {/* Section: Item Layanan (Details dari JSON Mas) */}
          <div className="space-y-3 mb-8">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Item Layanan
            </span>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
              {transaction.details?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div className="max-w-[70%]">
                    <p className="text-[11px] font-bold text-slate-700 leading-tight">
                      {item.package_name}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold">
                      {item.qty} {item.unit} x{" "}
                      {formatRupiah(item.price_per_unit)}
                    </p>
                  </div>
                  <p className="text-[11px] font-black text-slate-800">
                    {formatRupiah(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Status Pembayaran */}
          <div className="space-y-4">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Ringkasan Pembayaran
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                <p className="text-[8px] font-black text-emerald-400 uppercase">
                  Sudah Dibayar
                </p>
                <p className="text-xs font-black text-emerald-600">
                  {formatRupiah(transaction.total_paid)}
                </p>
              </div>
              <div className="bg-rose-50 p-3 rounded-2xl border border-rose-100">
                <p className="text-[8px] font-black text-rose-400 uppercase">
                  Sisa Tagihan
                </p>
                <p className="text-xs font-black text-rose-600">
                  {transaction.remaining_bill > 0
                    ? formatRupiah(transaction.remaining_bill)
                    : "LUNAS"}
                </p>
              </div>
            </div>
          </div>

          {/* Badge Status */}
          <div className="mt-6 flex gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                transaction.payment_status === "PAID"
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-rose-100 text-rose-600"
              }`}
            >
              {transaction.payment_status}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest">
              {transaction.payment_method}
            </span>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Tutup Detail
          </button>
        </div>
      </div>
    </div>
  );
}
