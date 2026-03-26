import React, { useMemo, useEffect, useState, useCallback } from "react";

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
import Eye from "lucide-react/dist/esm/icons/eye";
import Filter from "lucide-react/dist/esm/icons/filter";

import TableGeneric from "../../components/TableGeneric";
import TablePagination from "../../components/TablePagination";
import ResponsiveDataView from "../../components/common/ResponsiveDataView";
import AppHead from "../../components/common/AppHead";
import EmployeeService from "../../services/EmployeeService";
import OutletService from "../../services/OutletService";
import EmployeeForm from "./EmployeeForm";
import EmployeeDetail from "./EmployeeDetail";

const triggerToast = (message, type) =>
  window.dispatchEvent(
    new CustomEvent("global-toast", { detail: { message, type } })
  );

export default function EmployeesList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // ── Search — pola CustomerList (submit manual, bukan debounce) ─────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  // ── Filter — pola identik CustomerList ────────────────────────────────────
  const [filterStatus, setFilterStatus] = useState(""); // "" | "true" | "false"
  const [filterOutlet, setFilterOutlet] = useState(""); // outlet_id atau ""
  const [outlets, setOutlets] = useState([]);

  // ── Modal ─────────────────────────────────────────────────────────────────
  const [detailOpen, setDetailOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // ── Load outlets untuk dropdown filter ────────────────────────────────────
  useEffect(() => {
    OutletService.getAllOutletsTransaction?.()
      .then((res) => setOutlets(res.data?.data || []))
      .catch(() => {});
  }, []);

  // ── Fetch — pola identik CustomerList ─────────────────────────────────────
  const fetchEmployees = useCallback(
    async (isMounted = true) => {
      setLoading(true);
      try {
        const res = await EmployeeService.getEmployees({
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
          keyword: activeSearch,
          is_active: filterStatus,
          outlet_id: filterOutlet,
        });

        if (isMounted) {
          const d = res.data;
          setData(d?.data || []);
          setTotalCount(Number(d?.meta?.total || 0));

          if (d?.stats) {
            setStats(d.stats);
          } else {
            const all = d?.data || [];
            setStats({
              total: Number(d?.meta?.total || all.length),
              active: all.filter((e) => e.is_active).length,
              inactive: all.filter((e) => !e.is_active).length,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        triggerToast("Gagal memuat data karyawan.", "error");
      } finally {
        if (isMounted) setLoading(false);
      }
    },
    [
      pagination.pageIndex,
      pagination.pageSize,
      activeSearch,
      filterStatus,
      filterOutlet,
    ]
  );

  useEffect(() => {
    let isMounted = true;
    fetchEmployees(isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchEmployees]);

  // ── Handlers — pola identik CustomerList ──────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearch(searchTerm);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const handleReset = () => {
    setSearchTerm("");
    setActiveSearch("");
    setFilterStatus("");
    setFilterOutlet("");
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const handleOpenDetail = (emp) => {
    setSelectedEmployee(emp);
    setDetailOpen(true);
  };
  const handleOpenForm = (emp = null) => {
    setSelectedEmployee(emp);
    setOpenModal(true);
  };
  const handleCloseForm = () => {
    setOpenModal(false);
    setSelectedEmployee(null);
  };

  const handleDelete = async (employee) => {
    const setuju = await showConfirm(
      `Hapus karyawan ${employee.full_name}?`,
      "Konfirmasi Hapus",
      "warning",
      { confirmText: "Ya, Hapus", cancelText: "Batal" }
    );
    if (!setuju) return;

    try {
      const res = await EmployeeService.deleteEmployee(employee.id);

      setData((prev) => prev.filter((item) => item.id !== employee.id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      setStats((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        active: employee.is_active ? Math.max(0, prev.active - 1) : prev.active,
        inactive: !employee.is_active
          ? Math.max(0, prev.inactive - 1)
          : prev.inactive,
      }));

      if (data.length === 1 && pagination.pageIndex > 0) {
        setPagination((p) => ({ ...p, pageIndex: p.pageIndex - 1 }));
      }

      await showConfirm(
        res.data?.message || "Karyawan berhasil dihapus.",
        "Berhasil",
        "success"
      );
    } catch (err) {
      showConfirm(
        err.response?.data?.message || "Gagal menghapus karyawan.",
        "Gagal",
        "error"
      );
    }
  };

  // ── Columns ───────────────────────────────────────────────────────────────
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
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
            text-[9px] font-bold uppercase border
            ${
              isActive
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : "bg-rose-50   text-rose-600   border-rose-100"
            }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full
              ${isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
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
              title="Detail"
              onClick={() => handleOpenDetail(row.original)}
              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
            >
              <Eye size={14} />
            </button>
            <button
              title="Edit"
              onClick={() => handleOpenForm(row.original)}
              className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
            >
              <Pencil size={14} />
            </button>
            <button
              title="Hapus"
              onClick={() => handleDelete(row.original)}
              className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const mobilePagination = {
    options: { state: { pagination } },
    setPageSize: (s) =>
      setPagination((p) => ({ ...p, pageSize: s, pageIndex: 0 })),
    setPageIndex: (i) => setPagination((p) => ({ ...p, pageIndex: i })),
    previousPage: () =>
      setPagination((p) => ({ ...p, pageIndex: p.pageIndex - 1 })),
    nextPage: () =>
      setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 })),
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="px-2 py-4 md:p-6 space-y-4 bg-slate-50/50 min-h-screen pb-28 md:pb-6">
      <AppHead title="Manajemen Karyawan" />

      {/* ── Page Header ── */}
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
          onClick={() => handleOpenForm(null)}
          className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white
            rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg uppercase"
        >
          <UserPlus size={18} /> Tambah Karyawan
        </button>
      </div>

      {/* ── Stats strip — pola identik CustomerList ── */}
      <div className="grid grid-cols-3 gap-3 px-1">
        {[
          {
            label: "Total Karyawan",
            value: stats.total,
            color: "text-slate-800",
            bg: "bg-white",
          },
          {
            label: "Aktif",
            value: stats.active,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Nonaktif",
            value: stats.inactive,
            color: "text-rose-600",
            bg: "bg-rose-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`${s.bg} border border-slate-100 rounded-2xl px-4 py-3`}
          >
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              {s.label}
            </p>
            <p className={`text-xl font-black leading-none ${s.color}`}>
              {s.value.toLocaleString("id-ID")}
            </p>
          </div>
        ))}
      </div>

      {/* ── Filter + Search — layout identik CustomerList ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 px-1">
        {/* Filter status */}
        <div
          className="bg-white px-3 rounded-2xl border border-slate-100 shadow-sm
          flex items-center h-[46px] w-fit"
        >
          <div className="pr-2 text-slate-400 border-r border-slate-100 mr-2 flex-shrink-0">
            <Filter size={14} />
          </div>
          <div className="flex flex-col">
            <label className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              className="bg-transparent text-[11px] font-bold text-slate-700 outline-none
                cursor-pointer min-w-[90px]"
            >
              <option value="">Semua</option>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>
        </div>

        {/* Filter outlet — hanya muncul jika ada data (pola CustomerList gender filter) */}
        {outlets.length > 0 && (
          <div
            className="bg-white px-3 rounded-2xl border border-slate-100 shadow-sm
            flex items-center h-[46px] w-fit"
          >
            <div className="pr-2 text-slate-400 border-r border-slate-100 mr-2 flex-shrink-0">
              <Building size={14} />
            </div>
            <div className="flex flex-col">
              <label className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">
                Outlet
              </label>
              <select
                value={filterOutlet}
                onChange={(e) => {
                  setFilterOutlet(e.target.value);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
                className="bg-transparent text-[11px] font-bold text-slate-700 outline-none
                  cursor-pointer min-w-[100px]"
              >
                <option value="">Semua</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Search — layout & tombol CARI identik CustomerList */}
        <div
          className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm
          flex-1 md:max-w-sm h-[46px] flex items-center"
        >
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-1.5 w-full"
          >
            <div className="relative flex-1 group">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400
                  group-focus-within:text-emerald-600 transition-colors"
              />
              <input
                className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-100
                  rounded-lg text-[11px] outline-none focus:bg-white
                  focus:border-emerald-500/50 transition-all placeholder:text-slate-400"
                placeholder="Cari nama, NIK, atau jabatan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {(searchTerm || filterStatus || filterOutlet) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="absolute right-2 top-1/2 -translate-y-1/2
                    text-slate-300 hover:text-slate-500 transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* ✅ Tombol CARI emerald — identik CustomerList */}
            <button
              type="submit"
              className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800
                text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0"
            >
              <Search size={13} className="md:hidden" />
              <span className="hidden md:block">CARI</span>
            </button>
          </form>
        </div>
      </div>

      {/* ── Data view ── */}
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
              <div className="space-y-0.5 flex-1 min-w-0">
                <h3 className="text-[11px] font-black text-slate-800 uppercase leading-tight truncate">
                  {employee.full_name}
                </h3>
                <span
                  className="text-[7px] font-mono font-bold text-emerald-600
                  bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100 uppercase"
                >
                  NIK: {employee.employee_code}
                </span>
              </div>
              <div
                className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase
                border shrink-0
                ${
                  employee.is_active
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-rose-50   text-rose-600   border-rose-100"
                }`}
              >
                {employee.is_active ? "Aktif" : "Nonaktif"}
              </div>
            </div>

            <div className="space-y-1.5 py-2 border-y border-slate-50 text-[10px] text-slate-600">
              <div className="flex items-center gap-2">
                <FileText size={11} className="text-slate-300 flex-shrink-0" />
                <p className="font-semibold">{employee.job_title || "-"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Building size={11} className="text-slate-300 flex-shrink-0" />
                <p>{employee.outlet?.name || "Pusat"}</p>
              </div>
              {employee.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={11} className="text-slate-300 flex-shrink-0" />
                  <p>{employee.phone}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleOpenDetail(employee)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2
                  bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase
                  border border-blue-100 active:scale-95 transition-all"
              >
                <Eye size={11} /> Detail
              </button>
              <button
                onClick={() => handleOpenForm(employee)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5
                  bg-slate-50 text-slate-600 rounded-lg text-[9px] font-black uppercase
                  border border-slate-100 active:scale-95 transition-all"
              >
                <Pencil size={10} /> Edit
              </button>
              <button
                onClick={() => handleDelete(employee)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5
                  bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase
                  border border-rose-100 active:scale-95 transition-all"
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

      {/* Pagination mobile */}
      <div className="md:hidden mt-4">
        <TablePagination table={mobilePagination} totalEntries={totalCount} />
      </div>

      {/* FAB mobile */}
      <button
        onClick={() => handleOpenForm(null)}
        className="md:hidden fixed bottom-28 right-6 w-12 h-12 bg-emerald-600 text-white
          rounded-full shadow-2xl flex items-center justify-center z-40
          active:scale-90 border-4 border-white transition-all"
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
                  : item
              )
            );
          } else {
            setData((prev) =>
              [dataEmployee, ...prev].slice(0, pagination.pageSize)
            );
            setTotalCount((prev) => prev + 1);
            setStats((prev) => ({
              ...prev,
              total: prev.total + 1,
              active: prev.active + 1,
            }));
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }
          handleCloseForm();
        }}
      />

      <EmployeeDetail
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        data={selectedEmployee}
      />
    </div>
  );
}
