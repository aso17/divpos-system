import { useMemo, useEffect, useState, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Eye,
  Pencil,
  Trash2,
  PlusSquare,
  Users,
  Settings,
  X,
  Search,
} from "lucide-react";
import LoadingDots from "../../components/common/LoadingDots";
import TablePagination from "../../components/TablePagination";
import AppHead from "../../components/common/AppHead";
import UsersService from "../../services/UsersService";
import UserForm from "./UserForm";
import UserDetail from "./UserDetail";

export default function UsersList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);

  const fetchUsers = useCallback(
    async (isMounted = true) => {
      setLoading(true);
      try {
        const res = await UsersService.getUsers({
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
          keyword: activeSearch,
        });

        if (isMounted) {
          setData(res.data?.data || res.data || []);
          setTotalCount(Number(res.data.meta?.total || 0));
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    },
    [pagination.pageIndex, pagination.pageSize, activeSearch],
  );

  useEffect(() => {
    let isMounted = true;
    fetchUsers(isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearch(searchTerm);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const handleResetSearch = () => {
    setSearchTerm("");
    setActiveSearch("");
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setOpenModal(true);
  };

  const handleViewDetail = (user) => {
    setSelectedUser(user);
    setOpenDetail(true);
  };

  const handleDelete = async (user) => {
    const setuju = await showConfirm(
      `Apakah anda yakin ingin menghapus ${user.full_name}?`,
      "Konfirmasi Hapus",
      "warning",
      { confirmText: "Ya, Hapus", cancelText: "Batal" },
    );

    if (!setuju) return;

    try {
      const res = await UsersService.deleteUser(user.id);
      const successMsg =
        res.data?.message || "Data user telah berhasil dihapus.";
      await showConfirm(successMsg, "Hapus Berhasil", "success");
      setData((prevData) => prevData.filter((item) => item.id !== user.id));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Terjadi kesalahan server";
      showConfirm(errorMsg, "Gagal Hapus", "error");
    }
  };

  const columns = useMemo(
    () => [
      {
        id: "no",
        header: "NO",
        cell: ({ row, table }) => {
          const { pageIndex, pageSize } = table.getState().pagination;
          return (
            <span className="text-slate-400 font-medium text-[10px]">
              {pageIndex * pageSize + row.index + 1}
            </span>
          );
        },
      },
      {
        accessorKey: "full_name",
        header: "NAMA PENGGUNA",
        cell: ({ row }) => (
          <div className="flex flex-col py-1">
            <span className="text-slate-800 font-bold text-xs uppercase tracking-tight">
              {row.original.full_name}
            </span>
            <span className="text-emerald-600 font-mono text-[9px] font-bold">
              @{row.original.username || "no-username"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: "KONTAK / EMAIL",
        cell: ({ getValue }) => (
          <span className="text-slate-500 font-medium text-[10px]">
            {getValue()}
          </span>
        ),
      },
      {
        id: "role",
        header: "ROLE / AKSES",
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-bold uppercase tracking-wider border border-slate-200">
            {row.original.role?.role_name || "GUEST"}
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
                className={`w-1.5 h-1.5 rounded-full ${
                  isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                }`}
              />
              {isActive ? "Active" : "Inactive"}
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
              onClick={() => handleViewDetail(row.original)}
              className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-800 hover:text-white transition-all shadow-sm"
            >
              <Eye size={14} />
            </button>
            <button
              onClick={() => handleEdit(row.original)}
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
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    manualPagination: true,
    autoResetPageIndex: false,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    rowCount: totalCount,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      <AppHead title="User Management" />

      {/* Header Page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
            <Users size={24} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">
              User Management
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Kelola kredensial dan hak akses pengguna sistem
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedUser(null);
            setOpenModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 uppercase"
        >
          <PlusSquare size={18} /> Tambah User
        </button>
      </div>

      {/* Filter & Search */}
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
              placeholder="Cari nama, email, atau username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-rose-500"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-slate-800 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-700 transition-all shadow-md"
          >
            CARI
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
                      className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-left"
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
                      className="hover:bg-emerald-50/30 transition-colors cursor-default group"
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
                        Belum ada data pengguna yang tersedia
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

      <UserForm
        open={openModal}
        initialData={selectedUser}
        onClose={() => setOpenModal(false)}
        onSuccess={(datauser) => {
          if (selectedUser) {
            setData((prevUsers) =>
              prevUsers.map((u) => (u.id === datauser.id ? datauser : u)),
            );
          } else {
            setData((prevUsers) => [datauser, ...prevUsers]);
            setTotalCount((prev) => prev + 1);
          }
        }}
      />

      <UserDetail
        open={openDetail}
        user={selectedUser}
        onClose={() => setOpenDetail(false)}
      />
    </div>
  );
}
