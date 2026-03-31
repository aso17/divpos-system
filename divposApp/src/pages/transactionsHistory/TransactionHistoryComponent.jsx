import Receipt from "lucide-react/dist/esm/icons/receipt";
import User from "lucide-react/dist/esm/icons/user";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import Eye from "lucide-react/dist/esm/icons/eye";
import Printer from "lucide-react/dist/esm/icons/printer";
import XCircle from "lucide-react/dist/esm/icons/x-circle";

import { formatRupiah } from "../../utils/formatter";
import {
  TX_STATUS_MAP,
  STATUS_PENDING,
  STATUS_CANCELED,
  canCancel,
} from "./TransactionConstanta";

// ─── PayBadge ─────────────────────────────────────────────────────────────────
export function PayBadge({ status }) {
  const paid = status === "PAID";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
      text-[10px] font-bold border flex-shrink-0
      ${
        paid
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-red-50 text-red-600 border-red-200"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0
        ${paid ? "bg-emerald-500" : "bg-red-400"}`}
      />
      {paid ? "Lunas" : "Belum Lunas"}
    </span>
  );
}

// ─── TxStatusBadge ────────────────────────────────────────────────────────────
export function TxStatusBadge({ status }) {
  const s = TX_STATUS_MAP[status] ?? TX_STATUS_MAP[STATUS_PENDING];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full
      text-[9px] font-bold border flex-shrink-0 ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

// ─── ActionBtn ────────────────────────────────────────────────────────────────
const ACTION_CLS = {
  amber:
    "bg-amber-50  text-amber-600  border-amber-200  hover:bg-amber-500  hover:text-white hover:border-amber-500",
  gray: "bg-gray-50   text-gray-500   border-gray-200   hover:bg-gray-800   hover:text-white hover:border-gray-800",
  green:
    "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600",
  red: "bg-red-50    text-red-500    border-red-200    hover:bg-red-500    hover:text-white hover:border-red-500",
};

export function ActionBtn({ onClick, title, variant = "gray", children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 rounded-xl flex items-center justify-center border
        transition-all duration-150 flex-shrink-0 ${ACTION_CLS[variant]}`}
    >
      {children}
    </button>
  );
}

// ─── TxCard ───────────────────────────────────────────────────────────────────
export function TxCard({ trx, onPay, onDetail, onPrint, onCancel }) {
  const sisa = trx.grand_total - trx.total_paid;
  const isPaid = trx.payment_status === "PAID";
  const isCanceled = trx.status === STATUS_CANCELED;
  const showCancel = canCancel(trx);

  const stylists = [
    ...new Set((trx.details || []).map((d) => d.employee_name).filter(Boolean)),
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div
        className={`h-[3px] flex-shrink-0 ${
          isCanceled ? "bg-red-400" : isPaid ? "bg-emerald-500" : "bg-amber-400"
        }`}
      />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Invoice + badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Receipt size={12} className="text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-bold text-emerald-700 truncate leading-tight">
                {trx.invoice_no}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {trx.order_date}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <PayBadge status={trx.payment_status} />
            <TxStatusBadge status={trx.status} />
          </div>
        </div>

        {/* Customer + total */}
        <div
          className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5
          flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <User size={10} className="text-emerald-700" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate leading-tight">
                {trx.customer_name}
              </p>
              {trx.customer_phone && (
                <p className="text-[10px] text-gray-400">
                  {trx.customer_phone}
                </p>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p
              className={`text-sm font-bold tabular-nums leading-tight ${
                isCanceled ? "line-through text-gray-400" : "text-gray-800"
              }`}
            >
              {formatRupiah(trx.grand_total)}
            </p>
            {sisa > 0 && !isCanceled && (
              <p className="text-[10px] font-semibold text-red-500 tabular-nums mt-0.5">
                Sisa {formatRupiah(sisa)}
              </p>
            )}
          </div>
        </div>

        {/* Stylist badges */}
        {stylists.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">
              Stylist:
            </span>
            {stylists.map((name, i) => (
              <span
                key={i}
                className="text-[9px] font-bold bg-blue-50 text-blue-600
                border border-blue-100 px-2 py-0.5 rounded-full whitespace-nowrap"
              >
                {name}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          {!isPaid && !isCanceled && (
            <button
              onClick={onPay}
              className="flex-1 h-9 flex items-center justify-center gap-1.5
                bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white
                rounded-xl text-xs font-bold transition-colors shadow-sm shadow-amber-100"
            >
              <Wallet size={12} strokeWidth={2.5} /> Bayar
            </button>
          )}
          <button
            onClick={onDetail}
            className="w-9 h-9 flex items-center justify-center flex-shrink-0
              bg-white border border-emerald-200 text-emerald-600
              hover:bg-emerald-600 hover:text-white hover:border-emerald-600
              rounded-xl transition-all duration-150"
          >
            <Eye size={12} strokeWidth={2} />
          </button>
          <button
            onClick={onPrint}
            title="Cetak nota"
            className="w-9 h-9 flex items-center justify-center flex-shrink-0
              bg-white border border-emerald-200 text-emerald-600
              hover:bg-emerald-600 hover:text-white hover:border-emerald-600
              rounded-xl transition-all duration-150"
          >
            <Printer size={12} strokeWidth={2} />
          </button>
          {showCancel && (
            <button
              onClick={onCancel}
              title="Batalkan transaksi"
              className="w-9 h-9 flex items-center justify-center flex-shrink-0
                bg-white border border-red-200 text-red-500
                hover:bg-red-500 hover:text-white hover:border-red-500
                rounded-xl transition-all duration-150"
            >
              <XCircle size={12} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
