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
  Tag,
  Layers,
  Box,
} from "lucide-react";

// Import Components & Services
import LoadingDots from "../../components/common/LoadingDots";
import TablePagination from "../../components/TablePagination";
import AppHead from "../../components/common/AppHead";
import PackageService from "../../services/PackageService";
import PackageForm from "./PackageForm";

export default function PackageList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // 1. Fetch Data
  const fetchPackages = useCallback(
    async (isMounted = true) => {
      setLoading(true);
      try {
        const res = await PackageService.getPackages({
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
          keyword: activeSearch,
        });

        if (isMounted) {
          setData(res.data?.data || []);
          setTotalCount(Number(res.data?.meta?.total || 0));
        }
      } catch (error) {
        console.error("Error fetching packages:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    },
    [pagination.pageIndex, pagination.pageSize, activeSearch],
  );

  useEffect(() => {
    let isMounted = true;
    fetchPackages(isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchPackages]);

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

  const handleDelete = async (pkg) => {
    // Asumsi fungsi showConfirm sudah tersedia secara global
    const setuju = await showConfirm(
      `Hapus paket "${pkg.name}"?`,
      "Konfirmasi Hapus",
      "warning",
    );

    if (setuju) {
      try {
        await PackageService.deletePackage(pkg.id);
        fetchPackages();
        showConfirm("Paket berhasil dihapus", "Berhasil", "success");
      } catch (err) {
        showConfirm("Gagal menghapus data", "Error", "error");
      }
    }
  };

  // 3. Columns Definition (Sync with Migration)
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
        header: "PAKET & KODE",
        cell: ({ row }) => (
          <div className="flex flex-col py-1">
            <div className="flex items-center gap-2">
              <span className="text-slate-800 font-bold text-xs uppercase tracking-tight">
                {row.original.name}
              </span>
              <span className="text-[9px] font-mono bg-slate-100 px-1 rounded text-slate-500 font-bold">
                {row.original.code}
              </span>
            </div>
            <div className="flex gap-1 mt-1">
              <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[8px] font-bold border border-emerald-100 uppercase">
                {row.original.service?.name || "Service"}
              </span>
              <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[8px] font-bold border border-blue-100 uppercase">
                {row.original.category?.name || "Category"}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "price",
        header: "HARGA / SATUAN",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-slate-700 font-black text-xs">
              Rp {Number(row.original.price).toLocaleString("id-ID")}
            </span>
            <span className="text-[9px] text-slate-400 font-medium italic">
              Per {row.original.unit}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "min_order",
        header: "MIN. ORDER",
        cell: ({ getValue, row }) => (
          <span className="text-slate-600 font-bold text-[10px]">
            {Number(getValue())}{" "}
            <span className="text-[8px] font-normal text-slate-400">
              {row.original.unit}
            </span>
          </span>
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
                setSelectedPackage(row.original);
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
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      <AppHead title="Paket & Harga" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
            <Box size={24} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">
              Paket & Harga
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Kelola tarif layanan, satuan, dan minimal order
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedPackage(null);
            setOpenModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 uppercase"
        >
          <PlusSquare size={18} /> Tambah Paket
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <form
          onSubmit={handleSearch}
          className="flex items-center gap-2 w-full md:w-auto"
        >
          <div className="relative flex-1 md:w-80 group">
            <Search
              className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors"
              size={16}
            />
            <input
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              placeholder="Cari nama atau kode paket..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleReset}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-rose-500"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-slate-800 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-700 transition-all shadow-md uppercase"
          >
            Cari
          </button>
        </form>
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
                      className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left"
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
                      className="hover:bg-emerald-50/30 transition-colors cursor-default"
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
                        className="p-20 text-center text-slate-400 italic text-xs font-medium"
                      >
                        Belum ada data paket tersedia
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

      {/* Modal Form */}
      <PackageForm
        open={openModal}
        initialData={selectedPackage}
        onClose={() => setOpenModal(false)}
        onSuccess={() => {
          fetchPackages();
          setOpenModal(false);
        }}
      />
    </div>
  );
}
