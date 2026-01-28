import { useMemo, useEffect, useState, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Pencil, Trash2, PlusSquare, Users, Settings, X } from "lucide-react";
import LoadingDots from "../../components/common/LoadingDots";
import TablePagination from "../../components/TablePagination";
import AppHead from "../../components/common/AppHead";
import UsersService from "../../services/UsersService";
import UserForm from "./UserForm";

export default function UsersList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // ========================
  // Handlers
  // ========================

  // Gunakan useCallback agar fungsi tidak dibuat ulang di setiap render
  const fetchUsers = useCallback(
    async (isMounted = true) => {
      setLoading(true);
      try {
        const res = await UsersService.getUsers({
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
          keyword: debouncedSearch,
        });

        if (isMounted) {
          setData(res.data?.data || res.data || []);
          setTotalCount(Number(res.data?.total || 0));
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    },
    [pagination.pageIndex, pagination.pageSize, debouncedSearch],
  );

  const handleEdit = (user) => {
    setSelectedUser(user);
    setOpenModal(true);
  };

  const handleDelete = async (user) => {
    if (!confirm(`Hapus user ${user.full_name}?`)) return;
    try {
      await UsersService.deleteUser(user.id);
      fetchUsers(); // Refresh data setelah hapus
    } catch (err) {
      alert("Gagal menghapus user");
    }
  };

  const columns = useMemo(
    () => [
      {
        id: "no",
        header: "NO",
        // Mengambil pagination langsung dari table state agar columns tidak perlu dependency [pagination]
        cell: ({ row, table }) => {
          const { pageIndex, pageSize } = table.getState().pagination;
          return (
            <span className="text-slate-600 text-xxs font-semibold">
              {pageIndex * pageSize + row.index + 1}
            </span>
          );
        },
      },
      {
        accessorKey: "full_name",
        header: "NAMA",
        cell: ({ getValue }) => (
          <span className="text-gray-600 uppercase text-xxs">{getValue()}</span>
        ),
      },
      {
        accessorKey: "email",
        header: "EMAIL",
        cell: ({ getValue }) => (
          <span className="text-gray-600 text-xxs">{getValue()}</span>
        ),
      },
      {
        accessorKey: "username",
        header: "USERNAME",
        cell: ({ getValue }) => (
          <span className="text-gray-600 text-xxs">{getValue() || "-"}</span>
        ),
      },
      {
        id: "role",
        header: "ROLE",
        cell: ({ row }) => (
          <span className="text-slate-600 text-xxs">
            {row.original.role?.role_name || "-"}
          </span>
        ),
      },
      {
        accessorKey: "is_active",
        header: "STATUS",
        cell: ({ getValue }) => (
          <span
            className={`px-1.5 py-0.5 rounded-sm text-[10px] text-xxs text-white inline-block text-center ${
              getValue() ? "bg-emerald-500" : "bg-rose-500"
            }`}
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
              onClick={() => console.log("Setting modules", row.original)}
              className="p-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-600 hover:text-white transition-all"
            >
              <Settings size={12} />
            </button>
            <button
              onClick={() => handleEdit(row.original)}
              className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-600 hover:text-white transition-all"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => handleDelete(row.original)}
              className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-600 hover:text-white transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ),
      },
    ],
    [], // Dependency kosong: columns hanya dibuat 1x saat mount
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    manualPagination: true,
    rowCount: totalCount,
    getCoreRowModel: getCoreRowModel(),
  });
  // 1. Efek Debounce Search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // 2. Efek Fetch Data (Hanya SATU trigger)
  useEffect(() => {
    let isMounted = true;
    fetchUsers(isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchUsers]);

  if (loading) return <LoadingDots />;
  return (
    <div className="p-4 space-y-4 bg-slate-50 min-h-screen text-xxs">
      <AppHead title="User Management" />

      <div className="flex items-center gap-2 text-slate-700 border-b border-slate-200 pb-2">
        <Users size={18} className="text-slate-600" />
        <p className="text-xs font-bold uppercase tracking-tight">
          User Management
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center justify-between">
        <button
          onClick={() => {
            setSelectedUser(null);
            setOpenModal(true);
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-gokucekBlue text-white rounded text-xxs font-bold"
        >
          <PlusSquare size={12} /> Tambah
        </button>

        <div className="relative flex items-center">
          <input
            className="border border-slate-300 rounded px-3 py-1.5 w-60 text-xxs focus:ring-1 focus:ring-blue-400 outline-none bg-white pr-8"
            placeholder="Search name / email / username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Munculkan tombol hanya jika ada teks */}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
              type="button"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border-t-2 border-blue-500 rounded-sm shadow-sm overflow-hidden relative">
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
              {table.getRowModel().rows.length > 0
                ? table.getRowModel().rows.map((row) => (
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
                  ))
                : !loading && (
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

        <div className="border-t border-slate-100 bg-white">
          <TablePagination table={table} />
        </div>
      </div>

      <UserForm
        open={openModal}
        initialData={selectedUser}
        onClose={() => setOpenModal(false)}
        onSuccess={() => fetchUsers()}
      />
    </div>
  );
}
