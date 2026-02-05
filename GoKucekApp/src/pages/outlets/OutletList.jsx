import { useMemo, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";

import LoadingDots from "../../components/common/LoadingDots";
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
        });

        if (isMounted) {
          setData(res.data?.data || []);
          setTotalCount(Number(res.data?.meta?.total || 0));
        }
      } catch (error) {
        console.error("Error fetching outlets:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    },
    [pagination.pageIndex, pagination.pageSize, activeSearch],
  );

  useEffect(() => {
    let isMounted = true;
    fetchOutlets(isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchOutlets]);

  // 2. Search Handlers
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

  const handleDelete = async (outlet) => {
    const setuju = await showConfirm(
      `Apakah anda yakin ingin menghapus outlet ${outlet.name}?`,
      "Konfirmasi Hapus",
      "warning",
      { confirmText: "Ya, Hapus", cancelText: "Batal" },
    );

    if (!setuju) return;

    try {
      const res = await OutletService.deleteOutlet(outlet.id);
      const successMsg =
        res.data?.message || "Data outlet telah berhasil dihapus.";

      await showConfirm(successMsg, "Hapus Berhasil", "success");

      setData((prevData) => prevData.filter((item) => item.id !== outlet.id));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "Terjadi kesalahan server saat menghapus outlet";
      showConfirm(errorMsg, "Gagal Hapus", "error");
    }
  };

  // 3. Table Columns Definition
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
        header: "OUTLET / CABANG",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-gray-800 font-bold text-xxs uppercase flex items-center gap-1">
              {row.original.name}
            </span>
            <span className="text-indigo-500 font-mono text-[9px]">
              KODE: {row.original.code}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "address",
        header: "ALAMAT & KONTAK",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5 text-xxs">
            <span className="text-gray-500 italic truncate max-w-[250px] flex items-center gap-1">
              <MapPin size={10} /> {row.original.address || "-"}
            </span>
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Phone size={10} /> {row.original.phone || "-"}
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
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${
                isActive
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : "bg-rose-50 text-rose-600 border border-rose-100"
              }`}
            >
              <span
                className={`w-1 h-1 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
              />
              {isActive ? "Operasional" : "Tutup"}
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
                setSelectedOutlet(row.original);
                setOpenModal(true);
              }}
              className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-600 hover:text-white transition-all"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => handleDelete(row.original)}
              className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-600 hover:text-white transition-all"
            >
              <Trash2 size={12} />
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
    <div className="p-4 space-y-4 bg-slate-50 min-h-screen text-xxs">
      <AppHead title="Outlet Management" />

      <div className="flex items-center gap-2 text-slate-700 border-b border-slate-200 pb-2">
        <Store size={18} className="text-slate-600" />
        <p className="text-xs font-bold uppercase tracking-tight">
          Master Outlet / Cabang
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center justify-between">
        <button
          onClick={() => {
            setSelectedOutlet(null);
            setOpenModal(true);
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xxs font-bold bg-gokucekBlue uppercase  transition-colors"
        >
          <PlusSquare size={12} /> Tambah Cabang
        </button>

        <form onSubmit={handleSearch} className="flex items-center">
          <div className="relative">
            <input
              className="border border-slate-300 rounded-l px-3 py-1.5 w-64 text-xxs outline-none bg-white pr-8 focus:ring-1 focus:ring-blue-400"
              placeholder="Cari nama atau kode outlet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleReset}
                className="absolute right-2 top-1.5 text-slate-400"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-emerald-700 text-white px-3 py-1.5 rounded-r  bg-gokucekBlue transition-colors font-bold flex items-center gap-1"
          >
            <Search size={12} /> CARI
          </button>
        </form>
      </div>

      <div className="bg-white border-t-2 border-blue-500 rounded-sm shadow-sm overflow-hidden relative min-h-[400px] flex flex-col">
        <div className="overflow-x-auto grow relative">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
              <LoadingDots overlay />
            </div>
          )}

          <table className="w-full">
            <thead className="bg-white border-b border-slate-100 text-slate-500 uppercase sticky top-0 z-10 text-[10px]">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-3 font-bold text-left border-r border-slate-50 last:border-0"
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
                      className="hover:bg-blue-50/60 transition-colors cursor-default"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-3 py-2 align-middle border-r border-slate-50 last:border-0"
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
                      <td
                        colSpan={columns.length}
                        className="p-10 text-center text-slate-400 italic"
                      >
                        Belum ada data outlet
                      </td>
                    </tr>
                  )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 bg-white">
          <TablePagination table={table} totalEntries={totalCount} />
        </div>
      </div>

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
