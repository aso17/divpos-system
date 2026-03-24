import { useMemo, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// --- IMPORT ICON SPESIFIK (Tree-shaking) ---
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import PlusSquare from "lucide-react/dist/esm/icons/plus-square";
import Shield from "lucide-react/dist/esm/icons/shield";
import X from "lucide-react/dist/esm/icons/x";
import Search from "lucide-react/dist/esm/icons/search";
import Lock from "lucide-react/dist/esm/icons/lock";
import FileText from "lucide-react/dist/esm/icons/file-text";

// --- IMPORT COMPONENTS & SERVICES ---
import TableGeneric from "../../components/TableGeneric";
import TablePagination from "../../components/TablePagination";
import ResponsiveDataView from "../../components/common/ResponsiveDataView";
import AppHead from "../../components/common/AppHead";
import RolesService from "../../services/RoleService";

import RoleForm from "./RoleForm";

export default function RolesList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [searchTerm, setSearchTerm] = useState("");
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
          setData(res.data?.data || []);
          setTotalCount(Number(res.data?.meta?.total || 0));
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    },
    [pagination.pageIndex, pagination.pageSize, activeSearch]
  );

  useEffect(() => {
    let isMounted = true;
    fetchRoles(isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchRoles]);

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

  const handleDelete = async (role) => {
    const setuju = await showConfirm(
      `Apakah anda yakin ingin menghapus role ${role.role_name}?`,
      "Konfirmasi Hapus",
      "warning",
      { confirmText: "Ya, Hapus", cancelText: "Batal" }
    );

    if (!setuju) return;

    try {
      const res = await RolesService.deleteRole(role.id);

      setData((prev) => prev.filter((r) => r.id !== role.id));

      if (data.length === 1 && pagination.pageIndex > 0) {
        setPagination((prev) => ({
          ...prev,
          pageIndex: prev.pageIndex - 1,
        }));
      }

      setTotalCount((prev) => Math.max(0, prev - 1));

      await showConfirm(
        res.data?.message || "Data role telah berhasil dihapus.",
        "Hapus Berhasil",
        "success"
      );
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
        accessorKey: "role_name",
        header: "NAMA ROLE",
        cell: ({ row }) => (
          <div className="flex flex-col py-1">
            <span className="text-slate-800 font-bold text-xxs uppercase tracking-tight">
              {row.original.role_name}
            </span>
            <span className="text-emerald-600 font-mono text-[9px] font-bold">
              ID: {row.original.code}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "DESKRIPSI HAK AKSES",
        cell: ({ getValue }) => (
          <span className="text-slate-500 italic truncate max-w-[250px] inline-block text-[10px]">
            {getValue() || "Tidak ada deskripsi spesifik"}
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
              title="Setting Permissions"
              onClick={() => {
                const hashedId = row.original.id;
                navigate(`/rolespermission/${hashedId}`, {
                  state: {
                    role_name: row.original.role_name,
                    code: row.original.code,
                  },
                });
              }}
              className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-800 hover:text-white transition-all shadow-sm"
            >
              <Lock size={14} />
            </button>
            <button
              onClick={() => {
                setSelectedRole(row.original);
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
    [navigate]
  );

  return (
    <div className="px-2 py-4 md:p-6 space-y-4 bg-slate-50/50 min-h-screen pb-28 md:pb-6">
      <AppHead title="Role Management" />

      {/* Header Page */}
      <div className="flex items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2.5">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
            <Shield size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-[11px] md:text-sm font-black text-slate-800 uppercase leading-none">
              Role & Permission
            </h1>
            <p className="hidden md:block text-[10px] text-slate-500 mt-1 font-medium">
              Konfigurasi tingkatan akses dan modul aplikasi
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedRole(null);
            setOpenModal(true);
          }}
          className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg uppercase"
        >
          <PlusSquare size={18} /> Tambah Role
        </button>
      </div>

      {/* Filter & Search */}
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
                placeholder="Cari nama role atau kode..."
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
              className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800
                text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0"
            >
              <Search size={14} className="md:hidden" />
              <span className="hidden md:block">CARI</span>
            </button>
          </form>
        </div>
      </div>

      {/* --- RESPONSIVE DATA VIEW --- */}
      <ResponsiveDataView
        data={data}
        loading={loading}
        emptyMessage="Belum ada data role tersedia"
        renderMobileCard={(role) => (
          <div
            key={role.id}
            className="bg-white rounded-[1.25rem] p-3 shadow-sm border border-slate-100 space-y-3 mx-1"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-0.5 flex-1">
                <h3 className="text-[11px] font-black text-slate-800 uppercase leading-tight">
                  {role.role_name}
                </h3>
                <span className="text-[7px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100 uppercase">
                  ID: {role.code}
                </span>
              </div>
              <div
                className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase border shrink-0 ${
                  role.is_active
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-rose-50 text-rose-600 border-rose-100"
                }`}
              >
                {role.is_active ? "Aktif" : "Nonaktif"}
              </div>
            </div>

            <div className="space-y-2 py-2 border-y border-slate-50">
              <div className="flex items-start gap-2">
                <FileText
                  size={10}
                  className="text-slate-300 shrink-0 mt-0.5"
                />
                <p className="text-[9px] text-slate-500 italic">
                  {role.description || "Tidak ada deskripsi spesifik"}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  const hashedId = role.id;
                  navigate(`/rolespermission/${hashedId}`, {
                    state: {
                      role_name: role.role_name,
                      code: role.code,
                    },
                  });
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase active:scale-95 transition-all"
              >
                <Lock size={10} /> Permission
              </button>
              <button
                onClick={() => {
                  setSelectedRole(role);
                  setOpenModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[9px] font-black uppercase border border-slate-100 active:scale-95 transition-all"
              >
                <Pencil size={10} /> Edit
              </button>
              <button
                onClick={() => handleDelete(role)}
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
            loading={loading}
            emptyMessage="Belum ada data role yang tersedia"
          />
        )}
      />

      {/* --- PAGINASI KHUSUS MOBILE --- */}
      <div className="md:hidden mt-4">
        <TablePagination
          table={{
            options: {
              state: {
                pagination: pagination,
              },
            },
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

      <button
        onClick={() => {
          setSelectedRole(null);
          setOpenModal(true);
        }}
        className="md:hidden fixed bottom-28 right-6 w-12 h-12 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 border-4 border-white transition-all"
      >
        <PlusSquare size={20} />
      </button>

      <RoleForm
        open={openModal}
        initialData={selectedRole}
        onClose={() => setOpenModal(false)}
        onSuccess={(newRole) => {
          if (selectedRole) {
            setData((prev) =>
              prev.map((r) => (r.id === newRole.id ? newRole : r))
            );
          } else {
            setData((prev) => {
              const newData = [newRole, ...prev];
              return newData.slice(0, pagination.pageSize);
            });

            setTotalCount((prev) => prev + 1);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }
          setOpenModal(false);
        }}
      />
    </div>
  );
}
