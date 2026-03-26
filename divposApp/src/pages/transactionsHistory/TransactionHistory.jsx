// TransactionHistory.jsx — dengan CancelTransactionModal (form reason wajib)

import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useReactToPrint } from "react-to-print";
import History from "lucide-react/dist/esm/icons/history";
import Search from "lucide-react/dist/esm/icons/search";
import X from "lucide-react/dist/esm/icons/x";
import Eye from "lucide-react/dist/esm/icons/eye";
import Printer from "lucide-react/dist/esm/icons/printer";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import Clock from "lucide-react/dist/esm/icons/clock";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import User from "lucide-react/dist/esm/icons/user";
import Receipt from "lucide-react/dist/esm/icons/receipt";
import LayoutList from "lucide-react/dist/esm/icons/layout-list";
import XCircle from "lucide-react/dist/esm/icons/x-circle";

import ResponsiveDataView from "../../components/common/ResponsiveDataView";
import TablePagination from "../../components/TablePagination";
import AppHead from "../../components/common/AppHead";
import TransactionService from "../../services/TransactionService";
import { formatRupiah } from "../../utils/formatter";
import ProcessPaymentHistory from "./ProcessPaymentHistory";
import CancelTransactionModal from "./CancelTransactionModal"; // ← baru
import DetailPaymentModal from "./DetailPaymentModal";
import TransactionSuccessModal from "../../components/TransactionSuccessModal";
import ReceiptPrint from "../../components/ReceiptPrint";

// ─── Status konstanta ─────────────────────────────────────────────────────────
const STATUS_PENDING = "PENDING";
const STATUS_PROCESS = "PROCESS";
const STATUS_READY = "READY";
const STATUS_TAKEN = "TAKEN";
const STATUS_CANCELED = "CANCELED";
const STATUS_COMPLETED = "COMPLETED";

/**
 * Boleh dibatalkan hanya jika:
 * 1. Belum lunas
 * 2. Status masih PENDING atau PROCESS
 */
const canCancel = (trx) =>
  trx.payment_status !== "PAID" &&
  [STATUS_PENDING, STATUS_PROCESS].includes(trx.status);

// ─── Payment badge ────────────────────────────────────────────────────────────
function PayBadge({ status }) {
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

// ─── Transaction status badge ─────────────────────────────────────────────────
const TX_STATUS_MAP = {
  [STATUS_PENDING]: {
    label: "Pending",
    cls: "bg-amber-50  text-amber-600  border-amber-200",
  },
  [STATUS_PROCESS]: {
    label: "Proses",
    cls: "bg-blue-50   text-blue-600   border-blue-200",
  },
  [STATUS_READY]: {
    label: "Siap",
    cls: "bg-purple-50 text-purple-600 border-purple-200",
  },
  [STATUS_TAKEN]: {
    label: "Diambil",
    cls: "bg-gray-50   text-gray-600   border-gray-200",
  },
  [STATUS_CANCELED]: {
    label: "Batal",
    cls: "bg-red-50    text-red-600    border-red-200",
  },
  [STATUS_COMPLETED]: {
    label: "Selesai",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

function TxStatusBadge({ status }) {
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

// ─── Action Button ────────────────────────────────────────────────────────────
function ActionBtn({ onClick, title, variant = "gray", children }) {
  const cls = {
    amber:
      "bg-amber-50  text-amber-600  border-amber-200  hover:bg-amber-500  hover:text-white hover:border-amber-500",
    gray: "bg-gray-50   text-gray-500   border-gray-200   hover:bg-gray-800   hover:text-white hover:border-gray-800",
    green:
      "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600",
    red: "bg-red-50    text-red-500    border-red-200    hover:bg-red-500    hover:text-white hover:border-red-500",
  };
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 rounded-xl flex items-center justify-center border
        transition-all duration-150 flex-shrink-0 ${cls[variant]}`}
    >
      {children}
    </button>
  );
}

// ─── TxCard mobile & tablet ───────────────────────────────────────────────────
function TxCard({ trx, onPay, onDetail, onPrint, onCancel }) {
  const sisa = trx.grand_total - trx.total_paid;
  const isPaid = trx.payment_status === "PAID";
  const isCanceled = trx.status === STATUS_CANCELED;
  const showCancel = canCancel(trx);

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
              className={`text-sm font-bold tabular-nums leading-tight
              ${isCanceled ? "line-through text-gray-400" : "text-gray-800"}`}
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TransactionHistory() {
  const [data, setData] = useState([]);
  const [dataToPrint, setDataToPrint] = useState(null);
  const printRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastTransactionData, setLastTransactionData] = useState(null);
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    data: null,
  });
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [paymentMethods, setPaymentMethods] = useState([]);
  // ── state khusus cancel modal ─────────────────────────────────────────────
  const [cancelModal, setCancelModal] = useState({ isOpen: false, data: null });

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchHistory = useCallback(
    async (isMounted = true) => {
      setLoading(true);
      try {
        const res = await TransactionService.getTransactionHistory({
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
          keyword: activeSearch,
          payment_status: paymentFilter === "ALL" ? "" : paymentFilter,
        });
        if (isMounted) {
          const result = res.data?.data;
          setData(result?.data || []);
          setTotalCount(Number(result?.meta?.total || 0));
        }
      } catch (err) {
        console.error("Gagal mengambil history:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    },
    [pagination.pageIndex, pagination.pageSize, activeSearch, paymentFilter]
  );

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const res = await TransactionService.getPaymentMethods();
        setPaymentMethods(res.data?.data || []);
      } catch (err) {
        console.error("Gagal load metode pembayaran:", err);
      }
    };
    fetchMethods();
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchHistory(isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchHistory]);

  // ── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Nota_${dataToPrint?.invoice_no || "Transaksi"}`,
  });

  const handleOpenPrintPayment = (trx) => {
    const receiptData = {
      ...trx,
      outlet: trx.outlet || {
        name: "NDAH SALON",
        address: "Jl. Alamat Salon Mas No. 123",
        city: "Kota Mas",
        phone: "08xxxxxxx",
      },
      payment_amount: trx.payment_amount || 0,
      change_amount: trx.change_amount || 0,
    };
    setDataToPrint(receiptData);
    setTimeout(() => handlePrint(), 500);
  };

  // ── Modal handlers ────────────────────────────────────────────────────────
  const handleOpenDetailPayment = (trx) => {
    setSelectedTrx(trx);
    setIsDetailOpen(true);
  };
  const handleOpenPaymentModal = (trx) =>
    setPaymentModal({ isOpen: true, data: trx });
  const handleOpenCancelModal = (trx) =>
    setCancelModal({ isOpen: true, data: trx });

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearch(searchTerm);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const handleReset = () => {
    setSearchTerm("");
    setActiveSearch("");
    setPaymentFilter("ALL");
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      {
        id: "no",
        header: "No",
        cell: ({ row, table }) => (
          <span className="text-xs text-gray-400 tabular-nums font-medium">
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              row.index +
              1}
          </span>
        ),
      },
      {
        accessorKey: "invoice_no",
        header: "Invoice / Tanggal",
        cell: ({ row }) => {
          const trx = row.original;
          return (
            <div className="flex flex-col gap-1">
              <span
                className="font-mono text-[11px] font-bold text-emerald-700
              bg-emerald-50 px-2 py-0.5 rounded-lg inline-block w-fit"
              >
                {trx.invoice_no}
              </span>
              <span className="text-[10px] text-gray-400">
                {trx.order_date || trx.created_at}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "customer_name",
        header: "Pelanggan",
        cell: ({ row }) => {
          const trx = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-gray-800 leading-tight">
                {trx.customer_name}
              </span>
              <span className="text-[10px] text-gray-400">
                {trx.customer_phone || "—"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "grand_total",
        header: "Total",
        cell: ({ row }) => {
          const trx = row.original;
          const sisa = trx.grand_total - trx.total_paid;
          return (
            <div className="flex flex-col gap-0.5">
              <span
                className={`text-sm font-bold tabular-nums
              ${
                trx.status === STATUS_CANCELED
                  ? "line-through text-gray-400"
                  : "text-gray-800"
              }`}
              >
                {formatRupiah(trx.grand_total)}
              </span>
              {trx.payment_status !== "PAID" &&
                trx.status !== STATUS_CANCELED && (
                  <span className="text-[10px] font-semibold text-red-500 tabular-nums">
                    Sisa {formatRupiah(sisa)}
                  </span>
                )}
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <PayBadge status={row.original.payment_status} />
            <TxStatusBadge status={row.original.status} />
          </div>
        ),
      },
      {
        id: "actions",
        header: () => (
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Aksi
          </span>
        ),
        cell: ({ row }) => {
          const trx = row.original;
          const isCanceled = trx.status === STATUS_CANCELED;
          const showPay = trx.payment_status !== "PAID" && !isCanceled;
          const showBatal = canCancel(trx);
          return (
            <div className="flex items-center gap-1.5 justify-end">
              {showPay && (
                <ActionBtn
                  onClick={() => handleOpenPaymentModal(trx)}
                  title="Pelunasan"
                  variant="amber"
                >
                  <Wallet size={13} />
                </ActionBtn>
              )}
              <ActionBtn
                onClick={() => handleOpenDetailPayment(trx)}
                title="Detail"
                variant="gray"
              >
                <Eye size={13} />
              </ActionBtn>
              <ActionBtn
                onClick={() => handleOpenPrintPayment(trx)}
                title="Cetak nota"
                variant="green"
              >
                <Printer size={13} />
              </ActionBtn>
              {showBatal && (
                <ActionBtn
                  onClick={() => handleOpenCancelModal(trx)}
                  title="Batalkan transaksi"
                  variant="red"
                >
                  <XCircle size={13} />
                </ActionBtn>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    getCoreRowModel: getCoreRowModel(),
  });

  const paidCount = data.filter((t) => t.payment_status === "PAID").length;
  const unpaidCount = data.filter((t) => t.payment_status !== "PAID").length;

  const TABS = [
    { id: "ALL", label: "Semua", icon: <LayoutList size={13} /> },
    { id: "UNPAID", label: "Belum Lunas", icon: <Clock size={13} /> },
    { id: "PAID", label: "Lunas", icon: <CheckCircle2 size={13} /> },
  ];

  const paginationEl = (
    <TablePagination table={table} totalEntries={totalCount} />
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-6">
      <AppHead title="Riwayat Transaksi" />

      {/* Sticky header */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div
          className="max-w-screen-xl mx-auto px-4 md:px-6 py-3.5
          flex items-center justify-between gap-4 flex-wrap"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center
              shadow-sm shadow-emerald-200 flex-shrink-0"
            >
              <History size={16} strokeWidth={2.5} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-bold text-gray-900 leading-tight">
                Riwayat Transaksi
              </h1>
              <p className="text-[10px] text-gray-400 hidden sm:block mt-0.5">
                Monitoring omzet harian dan status piutang pelanggan
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
              <CheckCircle2
                size={12}
                className="text-emerald-600 flex-shrink-0"
              />
              <span className="text-[10px] font-bold text-emerald-700">
                {paidCount} lunas
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
              <Clock size={12} className="text-red-500 flex-shrink-0" />
              <span className="text-[10px] font-bold text-red-600">
                {unpaidCount} belum
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-4 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1 shadow-sm flex-shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setPaymentFilter(tab.id);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                  transition-all duration-150 whitespace-nowrap
                  ${
                    paymentFilter === tab.id
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 bg-white border border-gray-200
              rounded-xl p-1.5 shadow-sm flex-1 min-w-0 max-w-sm"
          >
            <div className="relative flex-1 min-w-0">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari invoice atau pelanggan..."
                className="w-full h-9 pl-9 pr-8 rounded-lg bg-gray-50 border border-transparent
                  text-sm text-gray-700 font-medium placeholder:text-gray-300
                  outline-none focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100
                  transition-all duration-150"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800
                text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0"
            >
              Cari
            </button>
          </form>
        </div>

        {/* Data view */}
        <ResponsiveDataView
          data={data}
          emptyMessage="Tidak ada riwayat transaksi ditemukan"
          paginationNode={paginationEl}
          renderMobileCard={(trx) => (
            <TxCard
              key={trx.id}
              trx={trx}
              onPay={() => handleOpenPaymentModal(trx)}
              onDetail={() => handleOpenDetailPayment(trx)}
              onPrint={() => handleOpenPrintPayment(trx)}
              onCancel={() => handleOpenCancelModal(trx)}
            />
          )}
          renderDesktopTable={() => (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    {table.getHeaderGroups().map((hg) => (
                      <tr
                        key={hg.id}
                        className="border-b border-gray-100 bg-gray-50/70"
                      >
                        {hg.headers.map((header) => (
                          <th
                            key={header.id}
                            className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i}>
                            {columns.map((_, j) => (
                              <td key={j} className="px-5 py-4">
                                <div
                                  className={`h-4 bg-gray-100 animate-pulse rounded-lg
                                  ${
                                    j === 0
                                      ? "w-6"
                                      : j === 4
                                      ? "w-24"
                                      : "w-full"
                                  }`}
                                />
                              </td>
                            ))}
                          </tr>
                        ))
                      : table.getRowModel().rows.map((row) => (
                          <tr
                            key={row.id}
                            className={`transition-colors duration-100
                              ${
                                row.original.status === STATUS_CANCELED
                                  ? "bg-red-50/30 hover:bg-red-50/60"
                                  : "hover:bg-emerald-50/40"
                              }`}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <td
                                key={cell.id}
                                className="px-5 py-3.5 align-middle"
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-gray-100 bg-gray-50/50">
                {paginationEl}
              </div>
            </div>
          )}
        />
      </div>

      {/* ── Modals ── */}
      <ProcessPaymentHistory
        isOpen={paymentModal.isOpen}
        transaction={paymentModal.data}
        paymentMethods={paymentMethods} // ← KIRIM PROPS INI
        onClose={() => setPaymentModal({ isOpen: false, data: null })}
        onSuccess={(updatedTransaction) => {
          setData((prev) =>
            prev.map((t) =>
              t.id === updatedTransaction.id
                ? { ...t, ...updatedTransaction } // Gabung agar data UI tetap utuh
                : t
            )
          );
          setLastTransactionData({
            ...paymentModal.data,
            ...updatedTransaction,
          });
          setPaymentModal({ isOpen: false, data: null });
          setShowSuccessModal(true);
        }}
      />

      {/* ── Cancel Modal ── */}
      <CancelTransactionModal
        isOpen={cancelModal.isOpen}
        transaction={cancelModal.data}
        onClose={() => setCancelModal({ isOpen: false, data: null })}
        onSuccess={(updatedTrx) => {
          setData((prev) =>
            prev.map((t) =>
              t.id === updatedTrx.id
                ? { ...t, ...updatedTrx, status: STATUS_CANCELED }
                : t
            )
          );
          setCancelModal({ isOpen: false, data: null });
          // Mas bisa tambahkan toast sukses di sini
        }}
      />

      <TransactionSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        data={lastTransactionData}
      />

      <DetailPaymentModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        transaction={selectedTrx}
      />

      {dataToPrint && (
        <div className="hidden">
          <ReceiptPrint ref={printRef} data={dataToPrint} />
        </div>
      )}
    </div>
  );
}
