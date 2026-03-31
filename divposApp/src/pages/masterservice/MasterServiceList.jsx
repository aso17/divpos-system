import {
  useMemo,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Pencil,
  Trash2,
  X,
  Search,
  Info,
  Calendar,
  User,
  FileText,
} from "lucide-react";

import ResponsiveDataView from "../../components/common/ResponsiveDataView";
import TablePagination from "../../components/TablePagination";
import MasterService from "../../services/MasterService";
import ServiceForm from "./MasterServiceForm";

// 🚩 Import Hook Guard
import { useHasAccess } from "../../guards/useHasAccess";

const MasterServiceList = forwardRef((props, ref) => {
  const can = useHasAccess(); // 🚩 Inisialisasi hook

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  useImperativeHandle(ref, () => ({
    openForm: (service = null) => {
      setSelectedService(service);
      setOpenModal(true);
    },
  }));

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
        console.error("Gagal mengambil data layanan:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    },
    [pagination.pageIndex, pagination.pageSize, activeSearch]
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
    if (!window.confirm(`Hapus layanan ${service.name}?`)) return;

    try {
      await MasterService.deleteMasterService(service.id);
      setData((prev) => prev.filter((item) => item.id !== service.id));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Gagal menghapus layanan", err);
    }
  };

  // 🚩 REFACTOR: Columns dinamis berdasarkan permission
  const columns = useMemo(() => {
    const baseColumns = [
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
        header: "NAMA LAYANAN",
        cell: ({ row }) => (
          <div className="flex flex-col py-1">
            <span className="text-slate-800 font-bold text-[10px] uppercase tracking-tight">
              {row.original.name}
            </span>
            <span className="text-slate-500 italic truncate max-w-[200px] flex items-center gap-1.5 text-[9px] mt-0.5 font-medium">
              <Info size={11} className="text-slate-300 shrink-0" />
              {row.original.description || "Tanpa deskripsi"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "created_at",
        header: "INFO INPUT",
        cell: ({ getValue, row }) => (
          <div className="flex flex-col gap-0.5 py-1">
            <span className="flex items-center gap-1.5 text-slate-500 font-medium text-[9px]">
              <Calendar size={11} className="text-slate-300" />
              {getValue()?.split(" ")[0] || "-"}
            </span>
            <span className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[8px]">
              <User size={11} className="text-slate-300" />
              {row.original.created_by || "Admin"}
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
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
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
    ];

    // 🚩 Tambahkan kolom AKSI hanya jika punya akses update atau delete
    if (can(["update", "delete"])) {
      baseColumns.push({
        id: "actions",
        header: () => (
          <div className="text-center text-[10px] font-black text-slate-400 uppercase">
            AKSI
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex gap-2 justify-center">
            {can("update") && (
              <button
                onClick={() => {
                  setSelectedService(row.original);
                  setOpenModal(true);
                }}
                className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
              >
                <Pencil size={14} />
              </button>
            )}
            {can("delete") && (
              <button
                onClick={() => handleDelete(row.original)}
                className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ),
      });
    }

    return baseColumns;
  }, [can, handleDelete]);

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
    <div className="space-y-4">
      {/* Search Section */}
      <div className="flex justify-start px-1">
        <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-full md:w-auto md:min-w-[320px]">
          <form onSubmit={handleSearch} className="flex items-center gap-1.5">
            <div className="relative flex-1 group">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={13}
              />
              <input
                className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-[11px] outline-none transition-all placeholder:text-slate-400"
                placeholder="Cari layanan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="h-9 px-4 bg-emerald-600 text-white text-[10px] font-black rounded-lg transition-colors uppercase"
            >
              CARI
            </button>
          </form>
        </div>
      </div>

      <ResponsiveDataView
        data={data}
        loading={loading}
        emptyMessage="Belum ada data layanan tersedia"
        renderMobileCard={(service) => (
          <div
            key={service.id}
            className="bg-white rounded-[1.25rem] p-3 shadow-sm border border-slate-100 space-y-3 mb-3 mx-1"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-1 flex-1">
                <h3 className="text-[11px] font-black text-slate-800 uppercase leading-tight">
                  {service.name}
                </h3>
                <span className="text-[7px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 uppercase">
                  ID: {service.id}
                </span>
              </div>
              <div
                className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase border ${
                  service.is_active
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-rose-50 text-rose-600 border-rose-100"
                }`}
              >
                {service.is_active ? "Aktif" : "Off"}
              </div>
            </div>
            <div className="space-y-2 py-2 border-y border-slate-50">
              <div className="flex items-start gap-2">
                <FileText
                  size={10}
                  className="text-slate-300 shrink-0 mt-0.5"
                />
                <p className="text-[9px] text-slate-500 leading-relaxed italic">
                  {service.description || "Tidak ada deskripsi."}
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              {/* 🚩 Proteksi tombol mobile */}
              {can("update") && (
                <button
                  onClick={() => {
                    setSelectedService(service);
                    setOpenModal(true);
                  }}
                  className="flex-1 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[9px] font-black uppercase border border-slate-100 active:scale-95 transition-all"
                >
                  Edit
                </button>
              )}
              {can("delete") && (
                <button
                  onClick={() => handleDelete(service)}
                  className="flex-1 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase border border-rose-100 active:scale-95 transition-all"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>
        )}
        renderDesktopTable={() => (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-4 text-[8px] font-black text-slate-400 uppercase tracking-widest"
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
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-white border-t border-slate-100">
              <TablePagination table={table} totalEntries={totalCount} />
            </div>
          </div>
        )}
      />

      <ServiceForm
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedService(null);
        }}
        initialData={selectedService}
        onSuccess={(newService) => {
          if (selectedService) {
            setData((prev) =>
              prev.map((s) => (s.id === newService.id ? newService : s))
            );
          } else {
            setData((prev) => [newService, ...prev]);
            setTotalCount((prev) => prev + 1);
          }
          setOpenModal(false);
          setSelectedService(null);
        }}
      />
    </div>
  );
});

export default MasterServiceList;
