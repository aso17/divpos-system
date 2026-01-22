import { useMemo, useEffect, useState } from "react";
import LoadingDots from "../../components/common/LoadingDots";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import TablePagination from "../../components/TablePagination";
import {
  Pencil,
  Trash2,
  Download,
  Database,
  PlusSquare,
  Server,
  Share2,
  Menu,
} from "lucide-react";
import ServerNasService from "../../services/ServerNasService";
import ServerNasForm from "./ServerNasForm";

export default function ServerNasList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const handleAddRouter = async (payload) => {
    await ServerNasService.create(payload);
    setOpenModal(false);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const columns = useMemo(
    () => [
      {
        id: "select",
        header: () => (
          <input
            type="checkbox"
            className="rounded border-gray-300 sm:w-3 sm:h-3"
          />
        ),
        cell: () => (
          <input
            type="checkbox"
            className="rounded border-gray-300 sm:w-3 sm:h-3"
          />
        ),
      },
      {
        accessorKey: "name",
        header: "NAMA ROUTER",
        cell: ({ getValue }) => (
          <span className="text-gray-600 uppercase font-medium text-xxs">
            {getValue()}
          </span>
        ),
      },
      {
        accessorKey: "connection_type",
        header: "TIPE KONEKSI",
        cell: ({ getValue }) => (
          <span
            className={`text-xxs font-bold ${getValue() === "IP_PUBLIC" ? "text-green-600" : "text-gray-500"}`}
          >
            {getValue() === "IP_PUBLIC" ? "IP PUBLIC" : "VPN RADIUS"}
          </span>
        ),
      },
      {
        accessorKey: "ip_address",
        header: "IP ADDRESS",
        cell: ({ getValue }) => (
          <span className="text-gray-600 text-xxs">{getValue()}</span>
        ),
      },
      {
        accessorKey: "secret",
        header: "SECRET",
        cell: () => (
          <span className="text-gray-400 tracking-tight text-xxs">
            *******************
          </span>
        ),
      },
      {
        accessorKey: "online_users",
        header: "ONLINE",
        cell: ({ getValue }) => (
          <span className="text-green-600 font-bold text-xxs text-center block w-full">
            {getValue() ?? 0}
          </span>
        ),
      },
      {
        id: "script",
        header: () => (
          <span className="flex items-center gap-1 font-semibold italic text-xxs">
            {"</>"} SCRIPT
          </span>
        ),
        cell: () => (
          <button className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-100 text-sky-600 rounded text-[10px] font-bold border border-sky-200 hover:bg-sky-200 transition-colors">
            <Download size={10} /> DOWNLOAD
          </button>
        ),
      },
      {
        accessorKey: "snmp_status",
        header: "SNMP",
        cell: ({ getValue }) => {
          const status = getValue();
          const isConnected = status === "CONNECTED";
          return (
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold text-white min-w-[80px] inline-block text-center ${
                isConnected ? "bg-green-600" : "bg-slate-400"
              }`}
            >
              {isConnected ? "CONNECTED" : "DISCONNECTED"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => (
          <div className="text-center font-bold text-xxs">ACTION</div>
        ),
        cell: () => (
          <div className="flex gap-1 justify-center">
            <button className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-600 hover:text-white transition-all">
              <Pencil size={12} />
            </button>
            <button className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-600 hover:text-white transition-all">
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
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    ServerNasService.getAll({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: debouncedSearch,
    }).then((res) => {
      if (mounted) {
        setData(res.data || []);
        setTotalCount(res.total || 0);
        setLoading(false);
      }
    });
    return () => (mounted = false);
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  if (loading) return <LoadingDots />;

  return (
    <div className="p-4 space-y-4 bg-slate-50 min-h-screen text-xxs">
      {/* JUDUL */}
      <div className="flex items-center gap-2 text-slate-700 border-b border-slate-200 pb-2">
        <Database size={18} className="text-slate-600" />
        <p className="text-base text-xs font-bold uppercase tracking-tight">
          Router Dan Server
        </p>
      </div>
      {/* TOP BUTTONS & SEARCH */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-1.5">
          <button className="flex items-center gap-1 px-2.5 py-1.5 bg-cyan-500 text-white rounded shadow-sm text-xxs font-bold hover:bg-cyan-600 transition-colors">
            <Menu size={12} /> MENU
          </button>
          <button
            onClick={() => setOpenModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white rounded text-xxs font-bold"
          >
            <PlusSquare size={12} /> ADD
          </button>

          <button className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-500 text-white rounded shadow-sm text-xxs font-bold hover:bg-rose-600 transition-colors">
            <Server size={12} /> SERVER
          </button>
          <button className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-500 text-white rounded shadow-sm text-xxs font-bold hover:bg-teal-600 transition-colors">
            <Share2 size={12} /> ROUTING
          </button>
        </div>

        <input
          className="border border-slate-300 rounded px-3 py-1.5 w-60 text-xxs focus:ring-1 focus:ring-blue-400 outline-none transition-all bg-white"
          placeholder="Search router / IP..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {/* TABLE CONTAINER */}
      <div className="bg-white border-t-2 border-blue-500 rounded-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white border-b border-slate-100 text-slate-500 uppercase">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-3 font-bold text-left border-r border-slate-50 last:border-0 text-[10px] tracking-wider"
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
                  className="hover:bg-slate-50 transition-colors"
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
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="border-t border-slate-100 bg-white">
          <TablePagination table={table} totalCount={totalCount} />
        </div>
      </div>
      <ServerNasForm
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSubmit={handleAddRouter}
      />
      ;
    </div>
  );
}
