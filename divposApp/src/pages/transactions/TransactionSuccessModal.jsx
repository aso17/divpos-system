import React, { useRef } from "react";
import { CheckCircle, Printer, X } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import ReceiptPrint from "../../components/ReceiptPrint";

const TransactionSuccessModal = ({ isOpen, onClose, data }) => {
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  if (!isOpen) return null;

  return (
    // p-2 atau p-4 memberikan jarak aman dari tepi layar HP
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] p-2 md:p-4">
      {/* max-h-[90vh] dan overflow-y-auto berjaga-jaga jika layar HP sangat pendek/landskap */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        {/* HEADER MODAL - Padding disesuaikan */}
        <div className="bg-emerald-600 p-5 md:p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-8 h-8 md:w-10 md:h-10" strokeWidth={3} />
          </div>
          <h2 className="text-base md:text-lg font-black uppercase tracking-widest leading-tight">
            Transaksi Berhasil
          </h2>
          <p className="text-[10px] md:text-xs opacity-90 font-medium mt-1">
            No. Invoice: {data?.invoice_no}
          </p>
        </div>

        {/* RINGKASAN DATA */}
        <div className="p-5 md:p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
            <div className="flex justify-between items-start gap-2">
              <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase mt-0.5">
                Pelanggan
              </span>
              <span className="text-xs font-black text-gray-700 text-right break-words">
                {data?.customer_name}
              </span>
            </div>

            <div className="flex justify-between items-center border-t border-gray-200 pt-2">
              <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase">
                Total
              </span>
              <span className="text-sm md:text-base font-black text-emerald-600">
                Rp {parseInt(data?.grand_total || 0).toLocaleString("id-ID")}
              </span>
            </div>

            <div className="flex justify-between items-center border-t border-gray-200 pt-2">
              <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase">
                Kembalian
              </span>
              <span className="text-sm md:text-base font-black text-orange-600">
                Rp {parseInt(data?.change_amount || 0).toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handlePrint}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95"
            >
              <Printer size={16} />
              Cetak Nota
            </button>
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-white border-2 border-gray-100 hover:bg-gray-50 text-gray-500 rounded-xl font-black text-xs uppercase transition-all flex items-center justify-center active:scale-95"
            >
              Tutup
            </button>
          </div>
        </div>

        <div style={{ display: "none" }}>
          <ReceiptPrint ref={componentRef} data={data} />
        </div>
      </div>
    </div>
  );
};

export default TransactionSuccessModal;
