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
        cell: ({ getValue }) => {
          const isActive = getValue();
          return (
            <div className="flex items-center">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                  isActive
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    : "bg-rose-50 text-rose-600 border border-rose-100"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                  }`}
                />
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-center text-xxs">ACTION</div>,
        cell: ({ row }) => (
          <div className="flex gap-1 justify-center">
            <button
              onClick={() => handleViewDetail(row.original)}
              className="p-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-600 hover:text-white transition-all"
            >
              <Eye size={12} />
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
    [],
  );

  useEffect(() => {
    let isMounted = true;
    fetchUsers(isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchUsers]);

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
          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white rounded bg-gokucekBlue text-xxs font-bold uppercase"
        >
          <PlusSquare size={12} /> Tambah
        </button>

        <form onSubmit={handleSearch} className="flex items-center">
          <div className="relative">
            <input
              className="border border-slate-300 rounded-l px-3 py-1.5 w-60 text-xxs focus:ring-1 focus:ring-blue-400 outline-none bg-white pr-8"
              placeholder="Search name / email / username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-emerald-700 text-white px-3 py-1.5 rounded-r hover:bg-emerald-800 bg-gokucekBlue transition-colors text-xxs font-bold flex items-center gap-1"
          >
            <Search size={12} strokeWidth={3} />
            CARI
          </button>
        </form>
      </div>

      <div className="bg-white border-t-2 border-blue-500 rounded-sm shadow-sm overflow-hidden relative min-h-[420px] flex flex-col">
        <div className="overflow-x-auto grow relative">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
              <LoadingDots overlay />
            </div>
          )}

          <table className="w-full">
            <thead className="bg-white border-b border-slate-100 text-slate-500 uppercase sticky top-0 z-10">
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
                      className="hover:bg-blue-50 transition-colors cursor-default group"
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

              {/* PERBAIKAN: Menjaga tinggi tabel saat loading awal */}
              {loading && data.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="py-40"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 bg-white">
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
