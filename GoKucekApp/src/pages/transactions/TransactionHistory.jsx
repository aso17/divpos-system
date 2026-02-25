import { useMemo, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Printer, Eye, Search, X, History, Filter } from "lucide-react";

// Import Components & Services
import LoadingDots from "../../components/common/LoadingDots";
import TablePagination from "../../components/TablePagination";
import AppHead from "../../components/common/AppHead";
import TransactionService from "../../services/TransactionService";

export default function TransactionHistory() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  // DEFAULT FILTER: Menampilkan yang aktif saja (Bukan TAKEN/CANCELED & Bukan PAID)
  const [statusFilter, setStatusFilter] = useState("ACTIVE"); // ACTIVE, PENDING, PROCESS, READY, TAKEN, CANCELED
  const [paymentFilter, setPaymentFilter] = useState("UNPAID_ONLY"); // ALL, PAID, UNPAID_ONLY

  const navigate = useNavigate();

  const fetchHistory = useCallback(
    async (isMounted = true) => {
      setLoading(true);
      try {
        const res = await TransactionService.getTransactionHistory({
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
          keyword: activeSearch,
          status: statusFilter, // Kirim ke backend
          payment_status: paymentFilter, // Kirim ke backend
        });

        if (isMounted) {
          const result = res.data?.data;
          setData(result?.data || []);
          setTotalCount(Number(result?.meta?.total || 0));
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    },
    [
      pagination.pageIndex,
      pagination.pageSize,
      activeSearch,
      statusFilter,
      paymentFilter,
    ],
  );

  useEffect(() => {
    let isMounted = true;
    fetchHistory(isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchHistory]);

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearch(searchTerm);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const handleReset = () => {
    setSearchTerm("");
    setActiveSearch("");
    setStatusFilter("ACTIVE");
    setPaymentFilter("UNPAID_ONLY");
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const columns = useMemo(
    () => [
      {
        id: "no",
        header: "NO",
        cell: ({ row, table }) => {
          const { pageIndex, pageSize } = table.options.state.pagination;
          return (
            <span className="text-slate-400 font-medium text-[10px]">
              {pageIndex * pageSize + row.index + 1}
            </span>
          );
        },
      },
      {
        accessorKey: "invoice_no",
        header: "INVOICE / TANGGAL",
        cell: ({ row }) => (
          <div className="flex flex-col py-1">
            <span className="text-slate-800 font-bold text-[10px] uppercase">
              {row.original.invoice_no}
            </span>
            <span className="text-slate-400 text-[9px]">
              {row.original.created_at || "-"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "customer_name",
        header: "CUSTOMER",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-emerald-700 font-black text-[10px] uppercase">
              {row.original.customer_name}
            </span>
            <span className="text-slate-400 text-[9px]">
              {row.original.customer_phone || "-"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "total_price",
        header: "TOTAL BAYAR",
        cell: ({ getValue }) => (
          <span className="text-slate-800 font-black text-[10px]">
            Rp{Number(getValue() || 0).toLocaleString("id-ID")}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "STATUS ORDER",
        cell: ({ getValue }) => {
          const status = getValue();
          const colors = {
            PENDING: "bg-amber-50 text-amber-600 border-amber-100",
            PROCESS: "bg-blue-50 text-blue-600 border-blue-100",
            READY: "bg-indigo-50 text-indigo-600 border-indigo-100",
            TAKEN: "bg-emerald-50 text-emerald-600 border-emerald-100",
            CANCELED: "bg-rose-50 text-rose-600 border-rose-100",
          };
          return (
            <span
              className={`px-2 py-0.5 border rounded text-[8px] font-black uppercase ${colors[status] || colors.PENDING}`}
            >
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: "payment_status",
        header: "PEMBAYARAN",
        cell: ({ getValue }) => {
          const status = getValue();
          return (
            <span
              className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                status === "PAID"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : "bg-rose-50 text-rose-600 border-rose-100"
              }`}
            >
              {status === "PAID" ? "LUNAS" : "BELUM LUNAS"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => (
          <div className="text-center text-[10px] tracking-widest font-black">
            AKSI
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex gap-2 justify-center">
            <button className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-800 hover:text-white transition-all shadow-sm">
              <Eye size={14} />
            </button>
            <button className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
              <Printer size={14} />
            </button>
          </div>
        ),
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
    autoResetPageIndex: false,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    rowCount: totalCount,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      <AppHead title="Riwayat Transaksi" />

      {/* Header Page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
            <History size={24} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-none">
              Riwayat Transaksi
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Monitoring status cucian dan pembayaran
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search Input */}
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 flex-1 min-w-[300px]"
          >
            <div className="relative flex-1 group">
              <Search
                className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors"
                size={16}
              />
              <input
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                placeholder="Cari invoice atau pelanggan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="bg-slate-800 text-white px-6 py-2.5 rounded-xl text-xxs font-bold hover:bg-slate-700 shadow-md transition-all"
            >
              CARI
            </button>
          </form>

          {/* Status Order Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Filter size={14} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-[10px] font-bold text-slate-600 outline-none cursor-pointer"
            >
              <option value="ALL">SEMUA STATUS</option>
              <option value="ACTIVE">BELUM DIAMBIL</option>
              <option value="PENDING">PENDING</option>
              <option value="PROCESS">PROSES</option>
              <option value="READY">SIAP AMBIL</option>
              <option value="TAKEN">SUDAH DIAMBIL</option>
              <option value="CANCELED">DIBATALKAN</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-transparent text-[10px] font-bold text-slate-600 outline-none cursor-pointer"
            >
              <option value="ALL">SEMUA PEMBAYARAN</option>
              <option value="UNPAID_ONLY">BELUM LUNAS</option>
              <option value="PAID">LUNAS</option>
            </select>
          </div>

          {(activeSearch ||
            statusFilter !== "ACTIVE" ||
            paymentFilter !== "UNPAID_ONLY") && (
            <button
              onClick={handleReset}
              className="text-xxs font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1"
            >
              <X size={14} /> RESET FILTER
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden relative min-h-[450px] flex flex-col">
        <div className="overflow-x-auto grow relative">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
              <LoadingDots overlay />
            </div>
          )}

          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr
                  key={hg.id}
                  className="bg-slate-50/50 border-b border-slate-100"
                >
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] text-left"
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
              {table.getRowModel().rows.length > 0
                ? table.getRowModel().rows.map((row) => (
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
                  ))
                : !loading && (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="p-20 text-center text-slate-400 italic text-xs font-medium uppercase"
                      >
                        Data transaksi tidak ditemukan
                      </td>
                    </tr>
                  )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50/50 border-t border-slate-100">
          <TablePagination table={table} totalEntries={totalCount} />
        </div>
      </div>
    </div>
  );
}
