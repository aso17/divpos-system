import React, { useMemo, useEffect, useState, useCallback } from "react";
// import { useNavigate } from "react-router-dom"; // useNavigate tidak diperlukan jika pakai modal

// --- IMPORT ICON SPESIFIK ---
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import PlusSquare from "lucide-react/dist/esm/icons/plus-square";
import UserPlus from "lucide-react/dist/esm/icons/user-plus";
import Users from "lucide-react/dist/esm/icons/users";
import X from "lucide-react/dist/esm/icons/x";
import Search from "lucide-react/dist/esm/icons/search";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Building from "lucide-react/dist/esm/icons/building";
import Phone from "lucide-react/dist/esm/icons/phone";

// --- IMPORT COMPONENTS & SERVICES ---
import TableGeneric from "../../components/TableGeneric";
import TablePagination from "../../components/TablePagination";
import ResponsiveDataView from "../../components/common/ResponsiveDataView";
import AppHead from "../../components/common/AppHead";
import EmployeeService from "../../services/EmployeeService";
import EmployeeForm from "./EmployeeForm"; // Modal Form Diimport

export default function EmployeesList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // --- STATE UNTUK MODAL ---
  const [openModal, setOpenModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const fetchEmployees = useCallback(
    async (isMounted = true) => {
      setLoading(true);
      try {
        const res = await EmployeeService.getEmployees({
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
          keyword: activeSearch,
        });
        // console.log("Fetched employees:", res.data);
        if (isMounted) {
          setData(res.data?.data || []);
          setTotalCount(Number(res.data?.meta?.total || 0));
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    },
    [pagination.pageIndex, pagination.pageSize, activeSearch],
  );

  useEffect(() => {
    let isMounted = true;
    fetchEmployees(isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchEmployees]);

  // --- HANDLER MODAL ---
  const handleOpenForm = (employee = null) => {
    setSelectedEmployee(employee); // Set data kalau edit, null kalau tambah
    setOpenModal(true);
  };

  const handleCloseForm = () => {
    setOpenModal(false);
    setSelectedEmployee(null);
  };

  // -------------------------

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

  const handleDelete = async (employee) => {
    const setuju = await showConfirm(
      `Apakah anda yakin ingin menghapus karyawan ${employee.full_name}?`,
      "Konfirmasi Hapus",
      "warning",
      { confirmText: "Ya, Hapus", cancelText: "Batal" },
    );

    if (!setuju) return;

    try {
      const res = await EmployeeService.deleteEmployee(employee.id);
      setData((prevEmployees) =>
        prevEmployees.filter((item) => item.id !== employee.id),
      );
      // -------------------------

      const successMsg =
        res.data?.message || "Data karyawan telah berhasil dihapus.";
      await showConfirm(successMsg, "Hapus Berhasil", "success");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Gagal menghapus karyawan";
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
        header: "KARYAWAN",
        cell: ({ row }) => (
          <div className="flex flex-col py-1">
            <span className="text-slate-800 font-bold text-xxs uppercase tracking-tight">
              {row.original.full_name}
            </span>
            <span className="text-emerald-600 font-mono text-[9px] font-bold">
              NIK: {row.original.employee_code}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "job_title",
        header: "JABATAN",
        cell: ({ getValue }) => (
          <span className="text-slate-700 font-medium text-[10px]">
            {getValue() || "-"}
          </span>
        ),
      },
      {
        accessorKey: "outlet.name",
        header: "CABANG",
        cell: ({ getValue }) => (
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
            <Building size={12} className="text-slate-400" />
            {getValue() || "Pusat"}
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
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase border ${
                isActive
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : "bg-rose-50 text-rose-600 border-rose-100"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
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
              title="Edit Karyawan"
              onClick={() => handleOpenForm(row.original)} // Buka modal mode edit
              className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
            >
              <Pencil size={14} />
            </button>
            <button
              title="Hapus Karyawan"
              onClick={() => handleDelete(row.original)}
              className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
      },
    ],
    [handleDelete], // Hapus navigate dari dependency
  );

  return (
    <div className="px-2 py-4 md:p-6 space-y-4 bg-slate-50/50 min-h-screen pb-28 md:pb-6">
      <AppHead title="Manajemen Karyawan" />

      {/* Header Page */}
      <div className="flex items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2.5">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
            <Users size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-[11px] md:text-sm font-black text-slate-800 uppercase leading-none">
              Daftar Karyawan
            </h1>
            <p className="hidden md:block text-[10px] text-slate-500 mt-1 font-medium">
              Kelola data staf dan akses sistem karyawan
            </p>
          </div>
        </div>

        <button
          onClick={() => handleOpenForm(null)} // Buka modal mode tambah
          className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg uppercase"
        >
          <UserPlus size={18} /> Tambah Karyawan
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
                placeholder="Cari nama, NIK, atau jabatan..."
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
              className="bg-slate-900 text-white h-[32px] px-3 md:px-4 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-sm"
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
        emptyMessage="Belum ada data karyawan tersedia"
        renderMobileCard={(employee) => (
          <div
            key={employee.id}
            className="bg-white rounded-[1.25rem] p-3 shadow-sm border border-slate-100 space-y-3 mx-1"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-0.5 flex-1">
                <h3 className="text-[11px] font-black text-slate-800 uppercase leading-tight">
                  {employee.full_name}
                </h3>
                <span className="text-[7px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100 uppercase">
                  NIK: {employee.employee_code}
                </span>
              </div>
              <div
                className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase border shrink-0 ${
                  employee.is_active
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-rose-50 text-rose-600 border-rose-100"
                }`}
              >
                {employee.is_active ? "Aktif" : "Nonaktif"}
              </div>
            </div>

            <div className="space-y-2 py-2 border-y border-slate-50 text-[10px] text-slate-600">
              <div className="flex items-center gap-2">
                <FileText size={12} className="text-slate-400" />
                <p className="font-semibold">{employee.job_title || "-"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Building size={12} className="text-slate-400" />
                <p>{employee.outlet?.name || "Pusat"}</p>
              </div>
              {employee.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={12} className="text-slate-400" />
                  <p>{employee.phone}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleOpenForm(employee)} // Buka modal edit di mobile
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[9px] font-black uppercase border border-slate-100 active:scale-95 transition-all"
              >
                <Pencil size={10} /> Edit
              </button>
              <button
                onClick={() => handleDelete(employee)}
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
            emptyMessage="Belum ada data karyawan yang tersedia"
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

      {/* Floating Action Button Mobile */}
      <button
        onClick={() => handleOpenForm(null)} // Buka modal tambah di mobile
        className="md:hidden fixed bottom-28 right-6 w-12 h-12 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 border-4 border-white transition-all"
      >
        <PlusSquare size={20} />
      </button>

      <EmployeeForm
        open={openModal}
        initialData={selectedEmployee}
        onClose={handleCloseForm}
        onSuccess={(dataEmployee) => {
          if (selectedEmployee) {
            setData((prev) =>
              prev.map((item) =>
                String(item.id) === String(dataEmployee.id)
                  ? dataEmployee
                  : item,
              ),
            );
          } else {
            setData((prev) => [dataEmployee, ...prev]);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            setTotalCount((prev) => prev + 1);
          }
          handleCloseForm();
        }}
      />
    </div>
  );
}
