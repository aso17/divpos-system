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
  Search,
  X,
  Clock,
  Zap,
} from "lucide-react";

// Import Components & Services

import ResponsiveDataView from "../../components/common/ResponsiveDataView";
import TablePagination from "../../components/TablePagination";
import AppHead from "../../components/common/AppHead";
import CategoryService from "../../services/CategoryService";
import CategoryForm from "./CategoryForm"; // Pastikan form ini nanti kamu buat

export default function CategoryList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // 1. Fetch Data
  const fetchCategories = useCallback(
    async (isMounted = true) => {
      setLoading(true);
      try {
        const res = await CategoryService.getCategories({
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
          keyword: activeSearch,
        });

        if (isMounted) {
          setData(res.data?.data || []);
          setTotalCount(Number(res.data?.meta?.total || 0));
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    },
    [pagination.pageIndex, pagination.pageSize, activeSearch],
  );

  useEffect(() => {
    let isMounted = true;
    fetchCategories(isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchCategories]);

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

  const handleDelete = async (category) => {
    // 1. Konfirmasi Awal
    const setuju = await showConfirm(
      `Apakah anda yakin ingin menghapus kategori "${category.name}"?`,
      "Konfirmasi Hapus",
      "warning",
      { confirmText: "Ya, Hapus", cancelText: "Batal" },
    );

    if (!setuju) return;

    try {
      // 2. Eksekusi ke API
      const res = await CategoryService.deleteCategory(category.id);
      const successMsg =
        res.data?.message || "Kategori telah berhasil dihapus.";

      await showConfirm(successMsg, "Hapus Berhasil", "success");

      setData((prevData) => prevData.filter((item) => item.id !== category.id));
      // Update total count jika ada pagination di UI
      if (typeof setTotalCount === "function") {
        setTotalCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "Terjadi kesalahan server saat menghapus kategori";
      showConfirm(errorMsg, "Gagal Hapus", "error");
    }
  };

  // 3. Columns Definition
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
        accessorKey: "name",
        header: "KATEGORI",
        cell: ({ row }) => (
          <div className="flex flex-col py-1">
            <span className="text-slate-800 font-bold text-xxs uppercase tracking-tight">
              {row.original.name}
            </span>
            <span className="text-[9px] font-mono text-slate-400 italic">
              slug: {row.original.slug}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "duration_hours",
        header: "DURASI PROSES",
        cell: ({ getValue }) => (
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Clock size={12} />
            </div>
            <div className="flex flex-col">
              <span className="text-slate-700 font-black text-xxs">
                {getValue()} Jam
              </span>
              <span className="text-[9px] text-slate-400 font-medium uppercase">
                {" "}
                Estimasi Selesai{" "}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "priority",
        header: "PRIORITAS",
        cell: ({ getValue }) => (
          <div className="flex items-center gap-1">
            <Zap
              size={12}
              className={
                getValue() > 0
                  ? "text-amber-500 fill-amber-500"
                  : "text-slate-300"
              }
            />
            <span className="text-slate-600 font-bold text-[10px]">
              Level {getValue()}
            </span>
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
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase border ${
                isActive
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : "bg-rose-50 text-rose-600 border-rose-100"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
              />
              {isActive ? "Aktif" : "Nonaktif"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => (
          <div className="text-center text-[10px] tracking-widest font-black text-slate-400">
            AKSI
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                setSelectedCategory(row.original);
                setOpenModal(true);
              }}
              className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => handleDelete(row.original)}
              className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
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
      <AppHead title="Kategori & Durasi" />

      {/* --- Header Section --- */}
      <div className="flex items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2.5">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
            <Clock size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-[11px] md:text-sm font-black text-slate-800 uppercase leading-none">
              Kategori & Durasi
            </h1>
            <p className="hidden md:block text-[10px] text-slate-500 mt-1 font-medium">
              Atur kecepatan layanan dan durasi jam kerja laundry
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedCategory(null);
            setOpenModal(true);
          }}
          className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg uppercase"
        >
          <PlusSquare size={18} /> Tambah Kategori
        </button>
      </div>

      {/* --- Search Section (Anti-Molor) --- */}
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
                placeholder="Cari kategori..."
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

      {/* --- Responsive Data View Category --- */}
      <ResponsiveDataView
        data={data}
        loading={loading}
        emptyMessage="Belum ada data kategori tersedia"
        renderMobileCard={(category) => (
          <div
            key={category.id}
            className="bg-white rounded-[1.25rem] p-3 shadow-sm border border-slate-100 space-y-3 mx-1"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-1 flex-1">
                <h3 className="text-[11px] font-black text-slate-800 uppercase leading-tight">
                  {category.name}
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-[7px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 uppercase">
                    {category.duration_hours} JAM
                  </span>
                </div>
              </div>
              <div
                className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase border shrink-0 ${category.is_active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}
              >
                {category.is_active ? "Aktif" : "Non-Aktif"}
              </div>
            </div>

            <div className="space-y-2 py-2 border-y border-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={10} className="text-slate-300 shrink-0" />
                  <p className="text-[9px] text-slate-500">Estimasi Selesai:</p>
                </div>
                <p className="text-[9px] text-slate-700 font-bold">
                  {category.duration_hours} Jam Kerja
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setSelectedCategory(category);
                  setOpenModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[9px] font-black uppercase border border-slate-100 active:scale-95 transition-all"
              >
                <Pencil size={10} /> Edit
              </button>
              <button
                onClick={() => handleDelete(category)}
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
                        <td
                          key={cell.id}
                          className="px-6 py-4 align-middle font-medium text-slate-600 text-[11px]"
                        >
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

      {/* Floating Action Button Mobile */}
      <button
        onClick={() => {
          setSelectedCategory(null);
          setOpenModal(true);
        }}
        className="md:hidden fixed bottom-28 right-6 w-12 h-12 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 border-4 border-white transition-all"
      >
        <PlusSquare size={20} />
      </button>

      <CategoryForm
        open={openModal}
        onClose={() => setOpenModal(false)}
        initialData={selectedCategory}
        onSuccess={(newCategory) => {
          if (selectedCategory) {
            setData((prev) =>
              prev.map((c) => (c.id === newCategory.id ? newCategory : c)),
            );
          } else {
            setData((prev) => [newCategory, ...prev]);
            if (typeof setTotalCount === "function")
              setTotalCount((prev) => prev + 1);
          }
          setOpenModal(false);
        }}
      />
    </div>
  );
}
