import { useMemo, useEffect, useState, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Pencil,
  Trash2,
  PlusSquare,
  Plus,
  Search,
  X,
  CreditCard,
  Banknote,
  Landmark,
} from "lucide-react";

// Import Components & Services
import TablePagination from "../../components/TablePagination";
import AppHead from "../../components/common/AppHead";
import ResponsiveDataView from "../../components/common/ResponsiveDataView";
import PaymentMethodService from "../../services/PaymentMethodService";
import PaymentMethodForm from "./PaymentMethodForm";

export default function PaymentMethodList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // 1. Fetch Data
  const fetchPayments = useCallback(
    async (isMounted = true) => {
      setLoading(true);
      try {
        const res = await PaymentMethodService.getPaymentMethods({
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
          keyword: activeSearch,
        });

        if (isMounted) {
          setData(res.data?.data || []);
          setTotalCount(Number(res.data?.meta?.total || 0));
        }
      } catch (error) {
        console.error("Error fetching payment methods:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    },
    [pagination.pageIndex, pagination.pageSize, activeSearch],
  );

  useEffect(() => {
    let isMounted = true;
    fetchPayments(isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchPayments]);

  // 2. Handlers
  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearch(searchTerm);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const handleReset = () => {
    setSearchTerm("");
    setActiveSearch("");
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const handleDelete = async (pm) => {
    // 1. Munculkan Alert Konfirmasi dengan style warning
    const setuju = await showConfirm(
      `Apakah anda yakin ingin menghapus metode pembayaran "${pm.name}"?`,
      "Konfirmasi Hapus",
      "warning",
      {
        confirmText: "Ya, Hapus",
        cancelText: "Batal",
      },
    );

    if (!setuju) return;

    try {
      // 2. Eksekusi penghapusan ke Service
      const res = await PaymentMethodService.deletePaymentMethod(pm.id);

      // 3. Ambil pesan sukses dari response backend
      const successMsg =
        res.data?.message || "Metode pembayaran telah berhasil dihapus.";

      // 4. Munculkan Alert Sukses
      await showConfirm(successMsg, "Hapus Berhasil", "success");

      // 5. Update State Local (UI) agar data langsung hilang dari tabel
      setData((prevData) => prevData.filter((item) => item.id !== pm.id));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      // 6. Tangani error jika gagal (misal: data masih digunakan di transaksi)
      const errorMsg =
        err.response?.data?.message || "Gagal menghapus metode pembayaran";

      showConfirm(errorMsg, "Gagal Hapus", "error");
      console.error("Delete Error:", err);
    }
  };

  // 3. Table Columns (Desktop)
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
        accessorKey: "name",
        header: "METODE & TIPE",
        cell: ({ row }) => (
          <div className="flex flex-col py-1 text-left">
            <div className="flex items-center gap-2">
              <span className="text-slate-800 font-black text-[10px] uppercase tracking-tight">
                {row.original.name}
              </span>
              <span
                className={`text-[8px] px-1 rounded font-bold uppercase border ${
                  row.original.type === "CASH"
                    ? "bg-blue-50 text-blue-600 border-blue-100"
                    : "bg-purple-50 text-purple-600 border-purple-100"
                }`}
              >
                {row.original.type}
              </span>
            </div>
            <p className="text-[9px] text-slate-400 mt-0.5 italic">
              {row.original.description || "Tidak ada keterangan"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "account_number",
        header: "DETAIL REKENING",
        cell: ({ row }) => (
          <div className="flex flex-col text-left">
            {row.original.type === "CASH" ? (
              <span className="text-slate-400 text-[10px] font-medium italic">
                Fisik / Tunai
              </span>
            ) : (
              <>
                <span className="text-slate-700 font-black text-[10px]">
                  {row.original.account_number}
                </span>
                <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">
                  A.N {row.original.account_name}
                </span>
              </>
            )}
          </div>
        ),
      },
      {
        accessorKey: "is_active",
        header: "STATUS",
        cell: ({ getValue }) => {
          const isActive = getValue();
          return (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                isActive
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : "bg-rose-50 text-rose-600 border-rose-100"
              }`}
            >
              {isActive ? "Aktif" : "Nonaktif"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => (
          <div className="text-center text-[10px] font-black text-slate-400 uppercase">
            AKSI
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                setSelectedPayment(row.original);
                setOpenModal(true);
              }}
              className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => handleDelete(row.original)}
              className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"
            >
              <Trash2 size={14} />
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
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="px-2 py-4 md:p-6 space-y-4 bg-slate-50/50 min-h-screen pb-28 md:pb-6">
      <AppHead title="Metode Pembayaran" />

      {/* --- Header Section --- */}
      <div className="flex items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2.5">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
            <CreditCard size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-[11px] md:text-sm font-black text-slate-800 uppercase leading-none">
              Metode Pembayaran
            </h1>
            <p className="hidden md:block text-[10px] text-slate-500 mt-1 font-medium">
              Atur akun bank, e-wallet, dan metode tunai outlet
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedPayment(null);
            setOpenModal(true);
          }}
          className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg uppercase"
        >
          <PlusSquare size={18} /> Tambah Metode
        </button>
      </div>

      {/* --- Search Section --- */}
      <div className="flex justify-start px-1">
        <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm w-full md:w-auto md:min-w-[320px]">
          <form onSubmit={handleSearch} className="flex items-center gap-1.5">
            <div className="relative flex-1 group">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors"
                size={13}
              />
              <input
                className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] outline-none focus:bg-white focus:border-emerald-500/50 transition-all placeholder:text-slate-400"
                placeholder="Cari metode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="bg-slate-900 text-white h-[32px] px-3 md:px-4 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-sm"
            >
              <Search size={14} className="md:hidden" />
              <span className="hidden md:block">CARI</span>
            </button>
          </form>
        </div>
      </div>

      {/* --- Responsive Data View --- */}
      <ResponsiveDataView
        data={data}
        loading={loading}
        emptyMessage="Belum ada metode pembayaran"
        renderMobileCard={(pm) => (
          <div
            key={pm.id}
            className="bg-white rounded-[1.25rem] p-3 shadow-sm border border-slate-100 space-y-3 mx-1"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-0.5 flex-1">
                <h3 className="text-[11px] font-black text-slate-800 uppercase leading-tight">
                  {pm.name}
                </h3>
                <div className="flex gap-1 items-center">
                  <span className="text-[7px] font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded border border-blue-100 uppercase">
                    {pm.type}
                  </span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">
                    {pm.account_number || "Cash Payment"}
                  </span>
                </div>
              </div>
              <div
                className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase border shrink-0 ${pm.is_active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}
              >
                {pm.is_active ? "Aktif" : "Off"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-50">
              <div className="border-r border-slate-50 pr-1">
                <p className="text-[7px] text-slate-400 font-black uppercase mb-0.5">
                  Atas Nama
                </p>
                <p className="text-[9px] font-black text-slate-700 truncate uppercase">
                  {pm.account_name || "-"}
                </p>
              </div>
              <div className="pl-1 text-right">
                <p className="text-[7px] text-slate-400 font-black uppercase mb-0.5">
                  Tipe
                </p>
                <p className="text-[9px] font-black text-slate-700 uppercase italic">
                  {pm.type}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setSelectedPayment(pm);
                  setOpenModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[9px] font-black uppercase border border-slate-100 active:scale-95 transition-all"
              >
                <Pencil size={10} /> Edit
              </button>
              <button
                onClick={() => handleDelete(pm)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase border border-rose-100 active:scale-95 transition-all"
              >
                <Trash2 size={10} /> Hapus
              </button>
            </div>
          </div>
        )}
        renderDesktopTable={() => (
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
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
                      className="hover:bg-emerald-50/30 transition-colors"
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

      {/* Floating Action Button */}
      <button
        onClick={() => {
          setSelectedPayment(null);
          setOpenModal(true);
        }}
        className="md:hidden fixed bottom-28 right-6 w-12 h-12 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 border-4 border-white transition-all"
      >
        <Plus size={24} />
      </button>

      <PaymentMethodForm
        open={openModal}
        initialData={selectedPayment}
        onClose={() => {
          setOpenModal(false);
          setSelectedPayment(null);
        }}
        onSuccess={(newPayment) => {
          if (selectedPayment) {
            setData((prev) =>
              prev.map((p) => (p.id === newPayment.id ? newPayment : p)),
            );
          } else {
            setData((prev) => [newPayment, ...prev]);
            setTotalCount((prev) => prev + 1);
          }
          setOpenModal(false);
          setSelectedPayment(null);
        }}
      />
    </div>
  );
}
