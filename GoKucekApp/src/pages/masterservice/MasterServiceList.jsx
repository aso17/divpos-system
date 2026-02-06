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
  X,
  Search,
  Info,
  Calendar,
  User,
} from "lucide-react";

import LoadingDots from "../../components/common/LoadingDots";
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
            <span className="text-slate-600 text-xxs font-semibold">
              {pageIndex * pageSize + row.index + 1}
            </span>
          );
        },
      },
      {
        accessorKey: "name",
        header: "NAMA LAYANAN",
        cell: ({ row }) => (
          <div className="flex flex-col max-w-[200px]">
            <span className="text-gray-800 font-bold text-xxs uppercase truncate">
              {row.original.name}
            </span>
            <span className="text-gray-500 italic text-[10px] leading-tight mt-0.5 flex items-start gap-1">
              <Info size={10} className="mt-0.5 shrink-0" />
              <span className="line-clamp-1">
                {row.original.description || "Tanpa deskripsi"}
              </span>
            </span>
          </div>
        ),
      },
      {
        accessorKey: "created_at",
        header: "DIBUAT PADA",
        cell: ({ getValue, row }) => {
          const rawCreatedBy = row.original.created_by;
          const creatorName = rawCreatedBy?.includes("-")
            ? rawCreatedBy.split("-")[1]
            : rawCreatedBy || "System";

          return (
            <div className="flex flex-col text-[10px] leading-tight text-slate-600">
              <span className="flex items-center gap-1 font-medium">
                <Calendar size={10} className="text-slate-400" />
                {getValue()?.split(" ")[0] || "-"}
              </span>
              <span className="flex items-center gap-1 text-slate-400 mt-0.5 uppercase font-semibold text-[9px]">
                <User size={10} />
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
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${
                isActive
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : "bg-rose-50 text-rose-600 border border-rose-100"
              }`}
            >
              <span
                className={`w-1 h-1 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
              />
              {isActive ? "Aktif" : "Nonaktif"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-center text-xxs">ACTION</div>,
        cell: ({ row }) => (
          <div className="flex gap-1 justify-center">
            <button
              onClick={() => {
                setSelectedService(row.original);
                setOpenModal(true);
              }}
              className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-600 hover:text-white transition-all shadow-sm"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => handleDelete(row.original)}
              className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-600 hover:text-white transition-all shadow-sm"
            >
              <Trash2 size={12} />
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
    <div className="p-4 space-y-4 bg-slate-50 min-h-screen text-xxs font-sans">
      <AppHead title="Service Management" />

      {/* Header Section */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 text-slate-700">
          <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
            <Layers size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-tight">
              Master Layanan Jasa
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar Section */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <button
          onClick={() => {
            setSelectedService(null);
            setOpenModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded font-bold uppercase tracking-wider bg-gokucekBlue transition-colors shadow-sm"
        >
          <PlusSquare size={14} /> Tambah Layanan
        </button>

        <form onSubmit={handleSearch} className="flex items-center shadow-sm">
          <div className="relative group">
            <input
              className="border border-slate-300 rounded-l px-3 py-1.5 w-64 text-xxs outline-none bg-white pr-8 focus:ring-1 focus:ring-blue-400"
              placeholder="Cari nama layanan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleReset}
                className="absolute right-2 top-2 text-slate-400 hover:text-rose-500"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-emerald-700 text-white px-3 py-1.5 rounded-r  bg-gokucekBlue transition-colors font-bold flex items-center gap-1"
          >
            <Search size={14} /> CARI
          </button>
        </form>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col min-h-[450px]">
        <div className="overflow-x-auto grow relative">
          {loading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
              <LoadingDots overlay />
            </div>
          )}

          <table className="w-full border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 font-bold text-left border-r border-slate-100 last:border-0"
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
            <tbody className="divide-y divide-slate-100">
              {table.getRowModel().rows.length > 0
                ? table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-2.5 align-middle border-r border-slate-50 last:border-0"
                        >
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
                      <td colSpan={columns.length} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-40">
                          <Layers size={40} />
                          <p className="text-xs font-medium italic">
                            Data layanan tidak ditemukan.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/50">
          <TablePagination table={table} totalEntries={totalCount} />
        </div>
      </div>

      {/* Modal Form */}
      <ServiceForm
        open={openModal}
        onClose={() => setOpenModal(false)}
        initialData={selectedService}
        onSuccess={(newService) => {
          if (selectedService) {
            setData((prev) =>
              prev.map((o) => (o.id === newService.id ? newService : o)),
            );
          } else {
            setData((prev) => [newService, ...prev]);
            setTotalCount((prev) => prev + 1);
          }
          setOpenModal(false);
        }}
      />
    </div>
  );
}
