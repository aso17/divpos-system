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
  Store,
  X,
  Search,
  MapPin,
  Phone,
  Filter,
} from "lucide-react";

import ResponsiveDataView from "../../components/common/ResponsiveDataView";
import TablePagination from "../../components/TablePagination";
import AppHead from "../../components/common/AppHead";
import OutletService from "../../services/OutletService";
import OutletForm from "./OutletForm";

export default function OutletList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(""); // State baru untuk filter
  const [openModal, setOpenModal] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState(null);

  const fetchOutlets = useCallback(
    async (isMounted = true) => {
      setLoading(true);
      try {
        const res = await OutletService.getOutlets({
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
          keyword: activeSearch,
          is_active: filterStatus, // Kirim filter ke backend
        });
        console.log("Fetched Outlets:", res.data);
        if (isMounted) {
          setData(res.data?.data || []);
          setTotalCount(Number(res.data?.meta?.total || 0));
        }
      } catch (error) {
        const errorMsg =
          error.response?.data?.message ||
          "Terjadi kesalahan saat mengambil data outlet";
        console.error(errorMsg); // Pastikan fungsi showConfirm tersedia di scope global/context
      } finally {
        if (isMounted) setLoading(false);
      }
    },
    [pagination.pageIndex, pagination.pageSize, activeSearch, filterStatus],
  );

  useEffect(() => {
    let isMounted = true;
    fetchOutlets(isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchOutlets]);

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearch(searchTerm);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const handleReset = () => {
    setSearchTerm("");
    setActiveSearch("");
    setFilterStatus("");
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const handleDelete = async (outlet) => {
    // Logic: Gunakan showConfirm yang konsisten dengan modul User
    const setuju = await showConfirm(
      `Apakah anda yakin ingin menghapus outlet ${outlet.name}?`,
      "Konfirmasi Hapus",
      "warning",
      { confirmText: "Ya, Hapus", cancelText: "Batal" },
    );

    if (!setuju) return;

    try {
      const res = await OutletService.deleteOutlet(outlet.id);
      const successMsg = res.data?.message || "Outlet telah berhasil dihapus.";
      await showConfirm(successMsg, "Hapus Berhasil", "success");

      if (data.length === 1 && pagination.pageIndex > 0) {
        setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex - 1 }));
      } else {
        // Filter state lokal agar UI langsung update tanpa loading spinner (Performa)
        setData((prevData) => prevData.filter((item) => item.id !== outlet.id));
      }

      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Gagal menghapus data";
      showConfirm(errorMsg, "Gagal Hapus", "error");
    }
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
        accessorKey: "name",
        header: "OUTLET / CABANG",
        cell: ({ row }) => (
          <div className="flex flex-col py-1">
            <div className="flex items-center gap-2">
              <span className="text-slate-800 font-black text-[11px] uppercase tracking-tight">
                {row.original.name}
              </span>
              {row.original.is_main_branch && (
                <span className="bg-amber-100 text-amber-700 text-[7px] px-1.5 py-0.5 rounded font-black uppercase">
                  Pusat
                </span>
              )}
            </div>
            <span className="text-emerald-600 font-mono text-[9px] font-bold">
              #{row.original.code}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "address",
        header: "LOKASI & KONTAK",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1 py-1">
            <span className="text-slate-500 italic truncate max-w-[200px] flex items-center gap-1.5 text-[10px]">
              <MapPin size={12} className="text-slate-300" />{" "}
              {row.original.city || row.original.address || "-"}
            </span>
            <span className="text-slate-400 flex items-center gap-1.5 font-medium text-[10px]">
              <Phone size={12} className="text-slate-300" />{" "}
              {row.original.phone || "-"}
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
              {isActive ? "Operasional" : "Tutup"}
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
            <button
              onClick={() => {
                setSelectedOutlet(row.original);
                setOpenModal(true);
              }}
              className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => handleDelete(row.original)}
              className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm"
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
    autoResetPageIndex: false,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    rowCount: totalCount,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="px-2 py-4 md:p-6 space-y-4 bg-slate-50/50 min-h-screen pb-28 md:pb-6">
      <AppHead title="Outlet Management" />

      {/* --- Header Section --- */}
      <div className="flex items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2.5">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
            <Store size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-[11px] md:text-sm font-black text-slate-800 uppercase leading-none">
              Master Outlet
            </h1>
            <p className="hidden md:block text-[10px] text-slate-500 mt-1 font-medium">
              Kelola lokasi dan kontak cabang
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedOutlet(null);
            setOpenModal(true);
          }}
          className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg uppercase"
        >
          <PlusSquare size={18} /> Tambah Cabang
        </button>
      </div>
      {/* --- Search & Filter Section --- */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-2 md:p-3">
        {/* 1. Filter Dropdown (Limit Status) */}
        <div className="bg-white px-3 rounded-2xl border border-slate-100 shadow-sm flex items-center group focus-within:border-emerald-500/50 transition-all w-fit self-start h-[52px] md:h-[46px]">
          {/* Bagian Icon */}
          <div className="pr-2 text-slate-400 group-focus-within:text-emerald-600 border-r border-slate-50 mr-2 shrink-0">
            <Filter size={15} className="md:w-3.5 md:h-3.5" />
          </div>

          {/* Bagian Select */}
          <div className="flex flex-col pr-1">
            <label className="text-[9px] md:text-[7px] font-black text-slate-400 uppercase leading-none mb-1">
              Limit Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-[11px] md:text-[10px] font-black text-slate-700 outline-none cursor-pointer  w-auto min-w-[100px] md:min-w-[90px]"
            >
              <option value="">All</option>
              <option value="true">Operational</option>
              <option value="false">Tutup</option>
            </select>
          </div>
        </div>

        {/* 2. Box Search (Input Utama) */}
        <div className="bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm flex-1 md:max-w-[450px] flex items-center h-[52px] md:h-[46px]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setActiveSearch(searchTerm);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            className="flex items-center gap-1.5 w-full"
          >
            <div className="relative flex-1 group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors"
                size={14}
              />
              <input
                className="w-full pl-9 pr-8 py-2 md:py-1.5 bg-slate-50 border border-transparent rounded-xl md:rounded-lg text-[12px] md:text-[11px] outline-none focus:bg-white focus:border-emerald-500/20 transition-all placeholder:text-slate-400 font-bold text-slate-700"
                placeholder="Cari nama atau kode outlet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                >
                  <X size={16} className="md:w-3.5 md:h-3.5" />
                </button>
              )}
            </div>

            {/* 3. Tombol CARI */}
            <button
              type="submit"
              className="bg-slate-900 text-white h-[40px] md:h-[34px] px-5 md:px-6 rounded-xl md:rounded-lg text-[10px] md:text-[9px] font-black uppercase tracking-wider shadow-md hover:bg-black active:scale-95 transition-all flex items-center justify-center shrink-0"
            >
              CARI
            </button>
          </form>
        </div>
      </div>
      <ResponsiveDataView
        data={data}
        loading={loading}
        emptyMessage="Belum ada data outlet tersedia"
        renderMobileCard={(outlet) => (
          <div
            key={outlet.id}
            className="bg-white rounded-[1.25rem] p-3 shadow-sm border border-slate-100 space-y-3 mx-1"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[11px] font-black text-slate-800 uppercase leading-tight">
                    {outlet.name}
                  </h3>
                  {outlet.is_main_branch && (
                    <span className="bg-amber-100 text-amber-700 text-[6px] px-1 rounded font-bold uppercase">
                      Pusat
                    </span>
                  )}
                </div>
                <span className="text-[7px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100 uppercase">
                  #{outlet.code}
                </span>
              </div>
              <div
                className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase border shrink-0 ${outlet.is_active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}
              >
                {outlet.is_active ? "Operasional" : "Tutup"}
              </div>
            </div>
            <div className="space-y-2 py-2 border-y border-slate-50">
              <div className="flex items-center gap-2">
                <MapPin size={10} className="text-slate-300 shrink-0" />
                <p className="text-[9px] text-slate-500 italic truncate">
                  {outlet.city || outlet.address || "Alamat tidak tersedia"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={10} className="text-slate-300 shrink-0" />
                <p className="text-[9px] text-slate-600 font-bold">
                  {outlet.phone || "-"}
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setSelectedOutlet(outlet);
                  setOpenModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[9px] font-black uppercase border border-slate-100 transition-all"
              >
                <Pencil size={10} /> Edit
              </button>
              <button
                onClick={() => handleDelete(outlet)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase border border-rose-100 transition-all"
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

      {/* Floating Action Button Mobile */}
      <button
        onClick={() => {
          setSelectedOutlet(null);
          setOpenModal(true);
        }}
        className="md:hidden fixed bottom-28 right-6 w-12 h-12 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 border-4 border-white transition-all active:scale-90"
      >
        <PlusSquare size={20} />
      </button>

      <OutletForm
        open={openModal}
        onClose={() => setOpenModal(false)}
        initialData={selectedOutlet}
        onSuccess={(newOutlet) => {
          if (selectedOutlet) {
            setData((prev) =>
              prev.map((o) => (o.id === newOutlet.id ? newOutlet : o)),
            );
          } else {
            setData((prev) => [newOutlet, ...prev]);
            setTotalCount((prev) => prev + 1);
          }
          setOpenModal(false);
        }}
      />
    </div>
  );
}
