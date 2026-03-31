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
import LayoutList from "lucide-react/dist/esm/icons/layout-list";
import XCircle from "lucide-react/dist/esm/icons/x-circle";

import ResponsiveDataView from "../../components/common/ResponsiveDataView";
import TablePagination from "../../components/TablePagination";
import AppHead from "../../components/common/AppHead";
import TransactionService from "../../services/TransactionService";
import { formatRupiah } from "../../utils/formatter";
import ProcessPaymentHistory from "./ProcessPaymentHistory";
import CancelTransactionModal from "./CancelTransactionModal";
import DetailPaymentModal from "./DetailPaymentModal";
import TransactionSuccessModal from "../../components/TransactionSuccessModal";
import ReceiptPrint from "../../components/ReceiptPrint";

// ─── Import dari file terpisah ────────────────────────────────────────────────
import {
  STATUS_CANCELED,
  hasEmployeeData,
  canCancel,
} from "./TransactionConstanta";
import {
  PayBadge,
  TxStatusBadge,
  ActionBtn,
  TxCard,
} from "./TransactionHistoryComponent";

const TABS = [
  { id: "ALL", label: "Semua", icon: <LayoutList size={13} /> },
  { id: "UNPAID", label: "Belum Lunas", icon: <Clock size={13} /> },
  { id: "PAID", label: "Lunas", icon: <CheckCircle2 size={13} /> },
];

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
  const [cancelModal, setCancelModal] = useState({ isOpen: false, data: null });

  const showEmployeeCol = useMemo(() => hasEmployeeData(data), [data]);

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
    let isMounted = true;
    fetchHistory(isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchHistory]);

  useEffect(() => {
    TransactionService.getPaymentMethods()
      .then((res) => setPaymentMethods(res.data?.data || []))
      .catch((err) => console.error("Gagal load metode pembayaran:", err));
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Nota_${dataToPrint?.invoice_no || "Transaksi"}`,
  });

  const handleOpenPrintPayment = (trx) => {
    setDataToPrint({
      ...trx,
      payment_amount: trx.payment_amount || 0,
      change_amount: trx.change_amount || 0,
    });
    setTimeout(() => handlePrint(), 500);
  };

  const handleOpenDetailPayment = (trx) => {
    setSelectedTrx(trx);
    setIsDetailOpen(true);
  };
  const handleOpenPaymentModal = (trx) =>
    setPaymentModal({ isOpen: true, data: trx });
  const handleOpenCancelModal = (trx) =>
    setCancelModal({ isOpen: true, data: trx });

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

  // ── Counts ────────────────────────────────────────────────────────────────
  const { paidCount, unpaidCount } = useMemo(
    () => ({
      paidCount: data.filter((t) => t.payment_status === "PAID").length,
      unpaidCount: data.filter((t) => t.payment_status !== "PAID").length,
    }),
    [data]
  );

  const columns = useMemo(() => {
    const baseCols = [
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
              <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg inline-block w-fit">
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
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-gray-800 leading-tight">
              {row.original.customer_name}
            </span>
            <span className="text-[10px] text-gray-400">
              {row.original.customer_phone || "—"}
            </span>
          </div>
        ),
      },
    ];

    if (showEmployeeCol) {
      baseCols.push({
        id: "employees",
        header: "Stylist",
        cell: ({ row }) => {
          const names = [
            ...new Set(
              (row.original.details || [])
                .map((d) => d.employee_name)
                .filter(Boolean)
            ),
          ];
          return (
            <div className="flex flex-wrap gap-1 max-w-[140px]">
              {names.map((name, i) => (
                <span
                  key={i}
                  className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5
                    rounded border border-blue-100 font-bold whitespace-nowrap"
                >
                  {name}
                </span>
              ))}
            </div>
          );
        },
      });
    }

    return [
      ...baseCols,
      {
        accessorKey: "grand_total",
        header: "Total",
        cell: ({ row }) => {
          const trx = row.original;
          const sisa = trx.grand_total - trx.total_paid;
          return (
            <div className="flex flex-col gap-0.5">
              <span
                className={`text-sm font-bold tabular-nums ${
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
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right block">
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
                  title="Batalkan"
                  variant="red"
                >
                  <XCircle size={13} />
                </ActionBtn>
              )}
            </div>
          );
        },
      },
    ];
    // FIX: dep [showEmployeeCol] bukan [data]
  }, [showEmployeeCol]);

  const table = useReactTable({
    data,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    getCoreRowModel: getCoreRowModel(),
  });

  const paginationEl = (
    <TablePagination table={table} totalEntries={totalCount} />
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-6">
      <AppHead title="Riwayat Transaksi" />

      {/* Sticky Header */}
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
                  text-sm text-gray-700 font-medium outline-none
                  focus:bg-white focus:border-emerald-400 transition-all duration-150"
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
              className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white
                text-xs font-bold rounded-lg transition-colors flex-shrink-0"
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
                                  ${j === 0 ? "w-6" : "w-full"}`}
                                />
                              </td>
                            ))}
                          </tr>
                        ))
                      : table.getRowModel().rows.map((row) => (
                          <tr
                            key={row.id}
                            className={`transition-colors duration-100 ${
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

      {/* Modals */}
      <ProcessPaymentHistory
        isOpen={paymentModal.isOpen}
        transaction={paymentModal.data}
        paymentMethods={paymentMethods}
        onClose={() => setPaymentModal({ isOpen: false, data: null })}
        onSuccess={(updatedTransaction) => {
          setData((prev) =>
            prev.map((t) =>
              t.id === updatedTransaction.id
                ? { ...t, ...updatedTransaction }
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
