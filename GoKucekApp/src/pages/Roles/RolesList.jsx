import { useMemo, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Pencil, Trash2, PlusSquare, Shield, X, Search } from "lucide-react";
import LoadingDots from "../../components/common/LoadingDots";
import TablePagination from "../../components/TablePagination";
import AppHead from "../../components/common/AppHead";
import RolesService from "../../services/RoleService";
import { encrypt } from "../../utils/Encryptions";

export default function RolesList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // searchTerm: untuk menampung ketikan user (real-time)
  const [searchTerm, setSearchTerm] = useState("");
  // activeSearch: kata kunci yang benar-benar digunakan untuk filter API
  const [activeSearch, setActiveSearch] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();

  const fetchRoles = useCallback(
    async (isMounted = true) => {
      setLoading(true);
      try {
        const res = await RolesService.getRoles({
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
          keyword: activeSearch,
        });

        if (isMounted) {
          // console.log("Fetched roles:", res.data.meta.total);
          setData(res.data?.data || []);
          setTotalCount(Number(res.data.meta.total || 0));
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    },
    [pagination.pageIndex, pagination.pageSize, activeSearch],
  );

  useEffect(() => {
    let isMounted = true;
    fetchRoles(isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchRoles]);

  // Handler saat tombol cari diklik atau tekan Enter
  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearch(searchTerm);
    setPagination((p) => ({ ...p, pageIndex: 0 })); // Reset ke hal 1
  };

  // Handler Reset Pencarian
  const handleReset = () => {
    setSearchTerm("");
    setActiveSearch("");
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const columns = useMemo(
    () => [
      {
        id: "no",
        header: "NO",
        cell: ({ row, table }) => (
          <span className="text-slate-600 text-xxs font-semibold">
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              row.index +
              1}
          </span>
        ),
      },
      {
        accessorKey: "role_name",
        header: "NAMA ROLE",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-gray-800 font-bold text-xxs uppercase">
              {row.original.role_name}
            </span>
            <span className="text-indigo-500 font-mono text-[9px]">
              {row.original.code}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "DESKRIPSI",
        cell: ({ getValue }) => (
          <span className="text-gray-500 text-xxs italic truncate max-w-[200px] inline-block">
            {getValue() || "Tidak ada deskripsi"}
          </span>
        ),
      },
      {
        accessorKey: "is_active",
        header: "STATUS",
        cell: ({ getValue }) => (
          <span
            className={`px-1.5 py-0.5 rounded-sm text-[10px] text-white inline-block ${getValue() ? "bg-emerald-500" : "bg-rose-500"}`}
          >
            {getValue() ? "active" : "inactive"}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center text-xxs">ACTION</div>,
        cell: ({ row }) => (
          <div className="flex gap-1 justify-center">
            <button
              title="Setting Module Permissions"
              onClick={() => {
                const hashedId = encrypt(row.original.id);
                navigate(`/rolespermission/${hashedId}`, {
                  state: {
                    role_name: row.original.role_name,
                    code: row.original.code,
                  },
                });
              }}
              className="p-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-600 hover:text-white transition-all"
            >
              <Shield size={12} />
            </button>
            <button
              onClick={() => {
                setSelectedRole(row.original);
                setOpenModal(true);
              }}
              className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-600 hover:text-white transition-all"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={async () => {
                if (confirm(`Hapus role ${row.original.role_name}?`)) {
                  await RolesService.deleteRole(row.original.id);
                  fetchRoles();
                }
              }}
              className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-600 hover:text-white transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ),
      },
    ],
    [fetchRoles, navigate],
  );

  const table = useReactTable({
    data,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
    rowCount: totalCount,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) return <LoadingDots fullscreen={false} />;

  return (
    <div className="p-4 space-y-4 bg-slate-50 min-h-screen text-xxs">
      <AppHead title="Role Management" />

      <div className="flex items-center gap-2 text-slate-700 border-b border-slate-200 pb-2">
        <Shield size={18} className="text-slate-600" />
        <p className="text-xs font-bold uppercase tracking-tight">
          Role & Permission
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center justify-between">
        <button
          onClick={() => {
            setSelectedRole(null);
            setOpenModal(true);
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white rounded text-xxs font-bold uppercase"
        >
          <PlusSquare size={12} /> Tambah Role
        </button>

        {/* INPUT PENCARIAN DENGAN TOMBOL */}
        <form onSubmit={handleSearch} className="flex items-center gap-1">
          <div className="relative">
            <input
              className="border border-slate-300 rounded-l px-3 py-1.5 w-60 text-xxs focus:ring-1 focus:ring-blue-400 outline-none bg-white pr-8"
              placeholder="Search role name / code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleReset}
                className="absolute right-2 top-1.5 text-slate-400 hover:text-rose-500"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-emerald-700 text-white px-3 py-1.5 rounded-r hover:bg-emerald-800 transition-colors flex items-center gap-1"
          >
            <Search size={12} />
            CARI
          </button>
        </form>
      </div>

      <div className="bg-white border-t-2 border-indigo-500 rounded-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white border-b border-slate-100 text-slate-500 uppercase text-[10px]">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-3 font-bold text-left tracking-wider border-r border-slate-50"
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
              {data.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-3 py-2 border-r border-slate-50 last:border-0"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-10 text-center text-slate-400"
                  >
                    Data tidak ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination table={table} />
      </div>
    </div>
  );
}
