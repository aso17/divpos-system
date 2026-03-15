import { useMemo, useEffect, useState, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import History from "lucide-react/dist/esm/icons/history";
import Search from "lucide-react/dist/esm/icons/search";
import X from "lucide-react/dist/esm/icons/x";
import Eye from "lucide-react/dist/esm/icons/eye";
import Printer from "lucide-react/dist/esm/icons/printer";
import Filter from "lucide-react/dist/esm/icons/filter";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import Clock from "lucide-react/dist/esm/icons/clock";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import User from "lucide-react/dist/esm/icons/user";
import Receipt from "lucide-react/dist/esm/icons/receipt";
import ResponsiveDataView from "../../components/common/ResponsiveDataView";
import TablePagination from "../../components/TablePagination";
import AppHead from "../../components/common/AppHead";
import TransactionService from "../../services/TransactionService";
import { formatRupiah, parseNumber, toNum } from "../../utils/formatter";
import ProcessPaymentHistory from "./ProcessPaymentHistory.";
import TransactionSuccessModal from "../../components/TransactionSuccessModal";

export default function TransactionHistory() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastTransactionData, setLastTransactionData] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    data: null,
  });

  const [paymentFilter, setPaymentFilter] = useState("ALL");

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
          // console.log(result);
          setData(result?.data || []);
          setTotalCount(Number(result?.meta?.total || 0));
        }
      } catch (error) {
        console.error("Gagal mengambil history:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    },
    [pagination.pageIndex, pagination.pageSize, activeSearch, paymentFilter],
  );

  useEffect(() => {
    let isMounted = true;
    fetchHistory(isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchHistory]);

  const handleOpenPaymentModal = (trx) => {
    setPaymentModal({ isOpen: true, data: trx });
  };
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

  const columns = useMemo(
    () => [
      {
        id: "no",
        header: "NO",
        cell: ({ row, table }) => (
          <span className="text-slate-400 font-medium text-[10px]">
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              row.index +
              1}
          </span>
        ),
      },
      {
        accessorKey: "invoice_no",
        header: "INVOICE / TANGGAL",
        cell: ({ row }) => {
          const trx = row.original;

          return (
            <div className="flex flex-col">
              <span className="text-slate-800 font-semibold text-xs uppercase">
                {trx.invoice_no}
              </span>
              <span className="text-slate-400 text-xxs">
                {trx.order_date || trx.created_at}
              </span>
            </div>
          );
        },
      },

      {
        accessorKey: "customer_name",
        header: "CUSTOMER",
        cell: ({ row }) => {
          const trx = row.original;

          return (
            <div className="flex flex-col">
              <span className="text-emerald-700 font-semibold text-xs uppercase">
                {trx.customer_name}
              </span>
              <span className="text-slate-400 text-xxs">
                {trx.customer_phone || "-"}
              </span>
            </div>
          );
        },
      },

      {
        accessorKey: "grand_total",
        header: "TOTAL",
        cell: ({ row }) => {
          const trx = row.original;
          const sisa = trx.grand_total - trx.total_paid;

          return (
            <div className="flex flex-col">
              <span className="text-slate-800 font-semibold text-xs">
                {formatRupiah(trx.grand_total)}
              </span>

              {trx.payment_status !== "PAID" && (
                <span className="text-rose-500 text-xxs font-medium">
                  Sisa: {formatRupiah(sisa)}
                </span>
              )}
            </div>
          );
        },
      },

      {
        accessorKey: "payment_status",
        header: "PEMBAYARAN",
        cell: ({ getValue }) => {
          const status = getValue();
          const isPaid = status === "PAID";

          return (
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                isPaid
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {isPaid ? "Lunas" : "Belum Lunas"}
            </span>
          );
        },
      },

      {
        id: "actions",
        header: () => (
          <div className="text-center text-[8px] font-black uppercase">
            Action
          </div>
        ),
        cell: ({ row }) => {
          const trx = row.original;
          const isUnpaid = trx.payment_status !== "PAID";

          return (
            <div className="flex gap-2 justify-center">
              {/* Tombol Bayar Muncul Cuma Kalau Belum Lunas */}
              {isUnpaid && (
                <button
                  onClick={() => handleOpenPaymentModal(trx)}
                  className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-600 hover:text-white transition shadow-sm"
                  title="Pelunasan"
                >
                  <Wallet size={14} />
                </button>
              )}

              <button
                title="detail"
                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-800 hover:text-white transition"
              >
                <Eye size={14} />
              </button>

              <button
                title="detail"
                className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition"
              >
                <Printer size={14} />
              </button>
            </div>
          );
        },
      },
    ],
    [],
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

  return (
    <div className="px-2 py-4 md:p-6 space-y-4 bg-slate-50/50 min-h-screen pb-28 md:pb-6 font-sans">
      <AppHead title="Riwayat Transaksi" />

      {/* --- Header --- */}
      <div className="flex items-center gap-2.5 px-1">
        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
          <History size={20} className="text-emerald-600" />
        </div>
        <div>
          <h1 className="text-[11px] md:text-sm font-black text-slate-800 uppercase leading-none">
            History Transaksi
          </h1>
          <p className="hidden md:block text-[10px] text-slate-500 mt-1 font-medium">
            Monitoring omzet harian dan status piutang pelanggan
          </p>
        </div>
      </div>

      {/* --- Filter Tabs (Mobile & Desktop Friendly) --- */}
      <div className="flex gap-2 bg-white border border-slate-200 p-1 rounded-xl w-full md:w-fit shadow-sm">
        {[
          { id: "ALL", label: "Semua", icon: <Wallet size={14} /> },
          { id: "UNPAID", label: "Belum Lunas", icon: <Clock size={14} /> },
          { id: "PAID", label: "Lunas", icon: <CheckCircle2 size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setPaymentFilter(tab.id);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              paymentFilter === tab.id
                ? "bg-emerald-600 text-white shadow"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- Search Box --- */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm max-w-md">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              className="w-full pl-9 pr-8 py-2.5 rounded-lg text-sm bg-slate-50 border border-transparent focus:border-emerald-400 focus:bg-white outline-none transition"
              placeholder="Cari invoice atau customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {searchTerm && (
              <button
                type="button"
                onClick={handleReset}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold"
          >
            Cari
          </button>
        </form>
      </div>

      <ResponsiveDataView
        data={data}
        // loading={loading}
        emptyMessage="Tidak ada history transaksi ditemukan"
        renderMobileCard={(trx) => {
          const sisa = trx.grand_total - trx.total_paid;
          return (
            <div
              key={trx.id}
              className="bg-white rounded-[1.25rem] p-4 shadow-sm border border-slate-100 space-y-4 mx-1"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Receipt size={14} className="text-slate-400" />
                    <h3 className="text-[11px] font-black text-slate-800 uppercase">
                      {trx.invoice_no}
                    </h3>
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium ml-5">
                    {trx.order_date}
                  </p>
                </div>
                <div
                  className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                    trx.payment_status === "PAID"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                      : "bg-rose-50 text-rose-600 border-rose-100"
                  }`}
                >
                  {trx.payment_status === "PAID" ? "Lunas" : "Belum Lunas"}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center border border-slate-100/50">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-emerald-600" />
                  <span className="text-[10px] font-black text-slate-700 uppercase">
                    {trx.customer_name}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-800">
                    Rp{Number(trx.grand_total).toLocaleString("id-ID")}
                  </p>
                  {sisa > 0 && (
                    <p className="text-[8px] font-bold text-rose-500 italic">
                      Sisa: Rp{Number(sisa).toLocaleString("id-ID")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end items-center">
                {/* Tombol Bayar - Lebar Tetap */}
                {trx.payment_status !== "PAID" && (
                  <button
                    onClick={() => handleOpenPaymentModal(trx)}
                    className="w-24 py-1 bg-amber-500 text-white rounded-xl text-[9px] font-black uppercase shadow-md flex items-center justify-center gap-2 h-10 shrink-0"
                  >
                    <Wallet size={12} /> Bayar
                  </button>
                )}

                {/* Tombol Detail - Lebar Tetap (Sama dengan tombol Bayar agar simetris) */}
                <button className="w-24 py-1 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase shadow-sm flex items-center justify-center gap-2 h-10 shrink-0">
                  <Eye size={12} /> Detail
                </button>

                {/* Tombol Printer - Lebar Tetap Kecil */}
                <button className="w-10 py-1 bg-white text-emerald-600 border border-emerald-100 rounded-xl flex items-center justify-center shadow-sm h-10 shrink-0">
                  <Printer size={12} />
                </button>
              </div>
            </div>
          );
        }}
        renderDesktopTable={() => (
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr
                      key={hg.id}
                      className="bg-slate-50/50 border-b border-slate-100"
                    >
                      {hg.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-4 text-[8px] font-black text-slate-400 uppercase tracking-widest"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-emerald-50/30 transition-colors group"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4 align-middle">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50/50 border-t border-slate-100">
              <TablePagination table={table} totalEntries={totalCount} />
            </div>
          </div>
        )}
      />
      <ProcessPaymentHistory
        isOpen={paymentModal.isOpen}
        transaction={paymentModal.data}
        onClose={() => setPaymentModal({ isOpen: false, data: null })}
        onSuccess={(updatedTransaction) => {
          // 1. Logic update state tanpa reload (Instant Update)
          setData((prev) =>
            prev.map((t) =>
              t.id === updatedTransaction.id ? updatedTransaction : t,
            ),
          );

          // 2. Set data untuk modal sukses (Gunakan variabel yang benar)
          setLastTransactionData(updatedTransaction);

          // 3. Tutup modal pelunasan & buka modal sukses
          setPaymentModal({ isOpen: false, data: null });
          setShowSuccessModal(true);
        }}
      />

      <TransactionSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        data={lastTransactionData}
      />
    </div>
  );
}
