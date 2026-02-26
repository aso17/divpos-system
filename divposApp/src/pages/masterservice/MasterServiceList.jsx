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
  Layers,
  FileText,
  X,
  Search,
  Info,
  Calendar,
  User,
} from "lucide-react";

import LoadingDots from "../../components/common/LoadingDots";

import ResponsiveDataView from "../../components/common/ResponsiveDataView";
import TablePagination from "../../components/TablePagination";
import AppHead from "../../components/common/AppHead";
import MasterService from "../../services/MasterService";
import ServiceForm from "./MasterServiceForm";

export default function MasterServiceList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const fetchServices = useCallback(
    async (isMounted = true) => {
      setLoading(true);
      try {
        const res = await MasterService.getMasterServices({
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
          keyword: activeSearch,
        });

        if (isMounted) {
          setData(res.data?.data || []);
          setTotalCount(Number(res.data?.meta?.total || 0));
        }
      } catch (error) {
        const errorMsg =
          error.response?.data?.message || "Gagal mengambil data layanan";
        console.error(errorMsg);
      } finally {
        if (isMounted) setLoading(false);
      }
    },
    [pagination.pageIndex, pagination.pageSize, activeSearch],
  );

  useEffect(() => {
    let isMounted = true;
    fetchServices(isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchServices]);

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

  const handleDelete = async (service) => {
    const setuju = await showConfirm(
      `Hapus layanan ${service.name}?`,
      "Konfirmasi Hapus",
      "warning",
    );

    if (!setuju) return;

    try {
      const res = await MasterService.deleteMasterService(service.id);
      const successMsg =
        res.data?.message || "Data layanan telah berhasil dihapus.";

      await showConfirm(successMsg, "Hapus Berhasil", "success");
      setData((prev) => prev.filter((item) => item.id !== service.id));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "Terjadi kesalahan server saat menghapus layanan";
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
        header: "NAMA LAYANAN",
        cell: ({ row }) => (
          <div className="flex flex-col py-1">
            <span className="text-slate-800 font-bold text-xxs uppercase tracking-tight">
              {row.original.name}
            </span>
            <span className="text-slate-500 italic truncate max-w-[200px] flex items-center gap-1.5 text-[10px] mt-0.5">
              <Info size={12} className="text-slate-300" />
              {row.original.description || "Tanpa deskripsi"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "created_at",
        header: "INFO INPUT",
        cell: ({ getValue, row }) => {
          const rawCreatedBy = row.original.created_by;
          const creatorName = rawCreatedBy?.includes("-")
            ? rawCreatedBy.split("-")[1]
            : rawCreatedBy || "System";

          return (
            <div className="flex flex-col gap-1 py-1">
              <span className="flex items-center gap-1.5 text-slate-500 font-medium text-[10px]">
                <Calendar size={12} className="text-slate-300" />
                {getValue()?.split(" ")[0] || "-"}
              </span>
              <span className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[9px]">
                <User size={12} className="text-slate-300" />
                {creatorName}
              </span>
            </div>
          );
        },
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
          <div className="text-center text-[10px] tracking-widest font-black">
            AKSI
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                setSelectedService(row.original);
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
    [pagination.pageIndex, pagination.pageSize],
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
      <AppHead title="Service Management" />

      {/* --- Header Section --- */}
      <div className="flex items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2.5">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
            <Layers size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-[11px] md:text-sm font-black text-slate-800 uppercase leading-none">
              Master Layanan
            </h1>
            <p className="hidden md:block text-[10px] text-slate-500 mt-1 font-medium">
              Kelola daftar layanan jasa laundry utama
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedService(null);
            setOpenModal(true);
          }}
          className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg uppercase"
        >
          <PlusSquare size={18} /> Tambah Layanan
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
                placeholder="Cari nama layanan..."
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

      {/* --- Responsive Data View Layanan --- */}
      <ResponsiveDataView
        data={data}
        loading={loading}
        emptyMessage="Belum ada data layanan tersedia"
        renderMobileCard={(service) => (
          <div
            key={service.id}
            className="bg-white rounded-[1.25rem] p-3 shadow-sm border border-slate-100 space-y-3 mx-1"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-1 flex-1">
                <h3 className="text-[11px] font-black text-slate-800 uppercase leading-tight">
                  {service.name}
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-[7px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 uppercase">
                    SERVICE ID: {service.id}
                  </span>
                </div>
              </div>
              <div
                className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase border shrink-0 ${
                  service.is_active
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-rose-50 text-rose-600 border-rose-100"
                }`}
              >
                {service.is_active ? "Aktif" : "Non-Aktif"}
              </div>
            </div>

            {/* Deskripsi Section (Mengikuti gaya estimasi durasi) */}
            <div className="space-y-2 py-2 border-y border-slate-50">
              <div className="flex items-start gap-2">
                <FileText
                  size={10}
                  className="text-slate-300 shrink-0 mt-0.5"
                />
                <p className="text-[9px] text-slate-500 leading-relaxed italic">
                  {service.description || "Tidak ada deskripsi layanan."}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setSelectedService(service);
                  setOpenModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[9px] font-black uppercase border border-slate-100 active:scale-95 transition-all"
              >
                <Pencil size={10} /> Edit
              </button>
              <button
                onClick={() => handleDelete(service)}
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
          setSelectedService(null);
          setOpenModal(true);
        }}
        className="md:hidden fixed bottom-28 right-6 w-12 h-12 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 border-4 border-white transition-all"
      >
        <PlusSquare size={20} />
      </button>

      <ServiceForm
        open={openModal}
        onClose={() => setOpenModal(false)}
        initialData={selectedService}
        onSuccess={(newService) => {
          if (selectedService) {
            setData((prev) =>
              prev.map((s) => (s.id === newService.id ? newService : s)),
            );
          } else {
            setData((prev) => [newService, ...prev]);
            if (typeof setTotalCount === "function")
              setTotalCount((prev) => prev + 1);
          }
          setOpenModal(false);
        }}
      />
    </div>
  );
}
