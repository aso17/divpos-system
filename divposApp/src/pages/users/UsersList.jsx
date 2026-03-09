import { useMemo, useEffect, useState, useCallback } from "react";
// Import icon secara spesifik (Tree-shaking)
import Eye from "lucide-react/dist/esm/icons/eye";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import PlusSquare from "lucide-react/dist/esm/icons/plus-square";
import UsersIcon from "lucide-react/dist/esm/icons/users";
import SearchIcon from "lucide-react/dist/esm/icons/search";
import XIcon from "lucide-react/dist/esm/icons/x";
import Mail from "lucide-react/dist/esm/icons/mail";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check";

// Import Komponen Generic dan lainnya
import TableGeneric from "../../components/TableGeneric";
import TablePagination from "../../components/TablePagination"; // <--- PASTIKAN IMPORT INI ADA
import ResponsiveDataView from "../../components/common/ResponsiveDataView";
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

      if (data.length === 1 && pagination.pageIndex > 0) {
        setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex - 1 }));
      } else {
        fetchUsers();
      }

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
            <span className="text-slate-800 font-bold text-xxs uppercase tracking-tight">
              {row.original.full_name}
            </span>
            <span className="text-emerald-600 font-mono text-[9px] font-bold">
              username:{row.original.username || "no-username"}
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
            {row.original.role?.name || "GUEST"}
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
    [handleViewDetail, handleEdit, handleDelete],
  );

  return (
    <div className="px-2 py-4 md:p-6 space-y-4 bg-slate-50/50 min-h-screen pb-28 md:pb-6">
      <AppHead title="User Management" />

      {/* Header Page */}
      <div className="flex items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2.5">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
            <UsersIcon size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-[11px] md:text-sm font-black text-slate-800 uppercase leading-none">
              User Management
            </h1>
            <p className="hidden md:block text-[10px] text-slate-500 mt-1 font-medium">
              Kelola kredensial dan hak akses pengguna sistem
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedUser(null);
            setOpenModal(true);
          }}
          className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg uppercase"
        >
          <PlusSquare size={18} /> Tambah User
        </button>
      </div>

      {/* Filter & Search */}
      <div className="flex justify-start px-1">
        <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm w-full md:w-auto md:min-w-[320px]">
          <form onSubmit={handleSearch} className="flex items-center gap-1.5">
            <div className="relative flex-1 group">
              <SearchIcon
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors"
                size={13}
              />
              <input
                className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] outline-none focus:bg-white focus:border-emerald-500/50 transition-all placeholder:text-slate-400"
                placeholder="Cari nama, email, atau username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                >
                  <XIcon size={14} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="bg-slate-900 text-white h-[32px] px-3 md:px-4 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-sm"
            >
              <SearchIcon size={14} className="md:hidden" />
              <span className="hidden md:block">CARI</span>
            </button>
          </form>
        </div>
      </div>

      <ResponsiveDataView
        data={data}
        loading={loading}
        emptyMessage="Belum ada data pengguna tersedia"
        renderMobileCard={(user) => (
          <div
            key={user.id}
            className="bg-white rounded-[1.25rem] p-3 shadow-sm border border-slate-100 space-y-3 mx-1"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-0.5 flex-1">
                <h3 className="text-[11px] font-black text-slate-800 uppercase leading-tight">
                  {user.full_name}
                </h3>
                <span className="text-[7px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100 uppercase">
                  @{user.username || "no-username"}
                </span>
              </div>
              <div
                className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase border shrink-0 ${
                  user.is_active
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-rose-50 text-rose-600 border-rose-100"
                }`}
              >
                {user.is_active ? "Active" : "Inactive"}
              </div>
            </div>

            <div className="space-y-2 py-2 border-y border-slate-50">
              <div className="flex items-center gap-2">
                <Mail size={10} className="text-slate-300 shrink-0" />
                <p className="text-[9px] text-slate-500 italic truncate">
                  {user.email || "-"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={10} className="text-slate-300 shrink-0" />
                <p className="text-[9px] text-slate-600 font-bold">
                  {user.role?.role_name || "GUEST"}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleViewDetail(user)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase active:scale-95 transition-all"
              >
                <Eye size={10} /> Detail
              </button>
              <button
                onClick={() => handleEdit(user)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[9px] font-black uppercase border border-slate-100 active:scale-95 transition-all"
              >
                <Pencil size={10} /> Edit
              </button>
              <button
                onClick={() => handleDelete(user)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase border border-rose-100 active:scale-95 transition-all"
              >
                <Trash2 size={10} /> Hapus
              </button>
            </div>
          </div>
        )}
        renderDesktopTable={() => (
          <TableGeneric
            data={data}
            columns={columns}
            pagination={pagination}
            setPagination={setPagination}
            totalCount={totalCount}
          />
        )}
      />

      {/* --- PAGINASI KHUSUS MOBILE --- */}
      <div className="md:hidden mt-4">
        <TablePagination
          table={{
            // PERBAIKAN: Struktur disesuaikan dengan
            // table.options.state.pagination
            options: {
              state: {
                pagination: pagination, // state pagination utama
              },
            },
            // Fungsi-fungsi yang dipanggil di komponen harus didefinisikan
            setPageSize: (newSize) =>
              setPagination((p) => ({ ...p, pageSize: newSize, pageIndex: 0 })),
            setPageIndex: (newIndex) =>
              setPagination((p) => ({ ...p, pageIndex: newIndex })),
            previousPage: () =>
              setPagination((p) => ({ ...p, pageIndex: p.pageIndex - 1 })),
            nextPage: () =>
              setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 })),
          }}
          totalEntries={totalCount}
        />
      </div>
      {/* ----------------------------- */}

      {/* Floating Action Button Mobile */}
      <button
        onClick={() => {
          setSelectedUser(null);
          setOpenModal(true);
        }}
        className="md:hidden fixed bottom-28 right-6 w-12 h-12 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 border-4 border-white transition-all"
      >
        <PlusSquare size={20} />
      </button>

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
            setData((prevUsers) => {
              const newData = [datauser, ...prevUsers];
              return newData.slice(0, pagination.pageSize);
            });

            setTotalCount((prev) => prev + 1);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }
          setOpenModal(false);
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
