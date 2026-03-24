import { useMemo, useEffect, useState, useCallback } from "react";

import Eye from "lucide-react/dist/esm/icons/eye";
import Pencil from "lucide-react/dist/esm/icons/pencil";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import PlusSquare from "lucide-react/dist/esm/icons/plus-square";
import Users from "lucide-react/dist/esm/icons/users";
import Search from "lucide-react/dist/esm/icons/search";
import X from "lucide-react/dist/esm/icons/x";
import Phone from "lucide-react/dist/esm/icons/phone";
import Mail from "lucide-react/dist/esm/icons/mail";
import Star from "lucide-react/dist/esm/icons/star";
import Filter from "lucide-react/dist/esm/icons/filter";

import TableGeneric from "../../components/TableGeneric";
import TablePagination from "../../components/TablePagination";
import ResponsiveDataView from "../../components/common/ResponsiveDataView";
import AppHead from "../../components/common/AppHead";
import CustomerService from "../../services/CustomerService";
import CustomerForm from "./CustomerForm";
import CustomerDetail from "./CustomerDetail";

// ─── Helper ───────────────────────────────────────────────────────────────────
const triggerToast = (message, type) =>
  window.dispatchEvent(
    new CustomEvent("global-toast", { detail: { message, type } })
  );

export default function CustomerList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchCustomers = useCallback(
    async (isMounted = true) => {
      setLoading(true);
      try {
        const res = await CustomerService.getCustomers({
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
          keyword: activeSearch,
          is_active: filterStatus,
          gender: filterGender,
        });

        if (isMounted) {
          const resData = res.data;
          setData(resData?.data?.data || []);
          setTotalCount(Number(resData?.data?.meta?.total || 0));
          setStats(resData?.stats || { total: 0, active: 0, inactive: 0 });
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
        triggerToast("Gagal memuat data pelanggan.", "error");
      } finally {
        if (isMounted) setLoading(false);
      }
    },
    [
      pagination.pageIndex,
      pagination.pageSize,
      activeSearch,
      filterStatus,
      filterGender,
    ]
  );

  useEffect(() => {
    let isMounted = true;
    fetchCustomers(isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchCustomers]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearch(searchTerm);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const handleReset = () => {
    setSearchTerm("");
    setActiveSearch("");
    setFilterStatus("");
    setFilterGender("");
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setOpenModal(true);
  };
  const handleDetail = (customer) => {
    setSelectedCustomer(customer);
    setOpenDetail(true);
  };

  const handleDelete = async (customer) => {
    const setuju = await showConfirm(
      `Hapus pelanggan ${customer.name}?`,
      "Konfirmasi Hapus",
      "warning",
      { confirmText: "Ya, Hapus", cancelText: "Batal" }
    );

    if (!setuju) return;

    try {
      const res = await CustomerService.deleteCustomer(customer.id);

      setData((prev) => prev.filter((c) => c.id !== customer.id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      setStats((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        active: customer.is_active ? Math.max(0, prev.active - 1) : prev.active,
      }));

      if (data.length === 1 && pagination.pageIndex > 0) {
        setPagination((p) => ({ ...p, pageIndex: p.pageIndex - 1 }));
      }

      await showConfirm(
        res.data?.message || "Pelanggan berhasil dihapus.",
        "Berhasil",
        "success"
      );
    } catch (err) {
      showConfirm(
        err.response?.data?.message || "Gagal menghapus pelanggan.",
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
        accessorKey: "name",
        header: "NAMA PELANGGAN",
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex flex-col py-1">
              <span className="text-slate-800 font-bold text-[11px] uppercase tracking-tight">
                {c.name}
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5">
                {c.gender_label !== "-" ? c.gender_label : "—"}
                {" · "}
                <span className="text-emerald-600 font-bold">
                  {c.created_at}
                </span>
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "phone",
        header: "KONTAK",
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-slate-700 font-semibold text-[10px]">
                {c.phone}
              </span>
              {c.email && (
                <span className="text-slate-400 text-[9px] italic truncate max-w-[160px]">
                  {c.email}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "point",
        header: "POIN",
        cell: ({ getValue }) => (
          <div className="flex items-center gap-1.5">
            <Star size={11} className="text-amber-400 fill-amber-400" />
            <span className="text-slate-700 font-bold text-[10px] tabular-nums">
              {Number(getValue()).toLocaleString("id-ID")}
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
              onClick={() => handleDetail(row.original)}
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
    []
  );

  // ── Pagination node untuk mobile/tablet ──────────────────────────────────
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
      <AppHead title="Data Pelanggan" />

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2.5">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
            <Users size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-[11px] md:text-sm font-black text-slate-800 uppercase leading-none">
              Data Pelanggan
            </h1>
            <p className="hidden md:block text-[10px] text-slate-500 mt-1 font-medium">
              Kelola data dan poin loyalitas pelanggan
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedCustomer(null);
            setOpenModal(true);
          }}
          className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white
            rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg uppercase"
        >
          <PlusSquare size={18} /> Tambah Pelanggan
        </button>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-3 gap-3 px-1">
        {[
          {
            label: "Total",
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

      {/* ── Filter + Search ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 px-1">
        {/* Filter status */}
        <div
          className="bg-white px-3 rounded-2xl border border-slate-100 shadow-sm
          flex items-center group h-[46px] w-fit"
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
              className="bg-transparent text-[11px] font-bold text-slate-700 outline-none cursor-pointer min-w-[90px]"
            >
              <option value="">Semua</option>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>
        </div>

        {/* Filter gender */}
        <div
          className="bg-white px-3 rounded-2xl border border-slate-100 shadow-sm
          flex items-center group h-[46px] w-fit"
        >
          <div className="pr-2 text-slate-400 border-r border-slate-100 mr-2 flex-shrink-0">
            <Filter size={14} />
          </div>
          <div className="flex flex-col">
            <label className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">
              Gender
            </label>
            <select
              value={filterGender}
              onChange={(e) => {
                setFilterGender(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              className="bg-transparent text-[11px] font-bold text-slate-700 outline-none cursor-pointer min-w-[90px]"
            >
              <option value="">Semua</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex-1 md:max-w-sm h-[46px] flex items-center">
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
                className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-100 rounded-lg
                  text-[11px] outline-none focus:bg-white focus:border-emerald-500/50 transition-all
                  placeholder:text-slate-400"
                placeholder="Cari nama, HP, atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                >
                  <X size={13} />
                </button>
              )}
            </div>
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

      {/* ── Data View ── */}
      <ResponsiveDataView
        data={data}
        loading={loading}
        emptyMessage="Belum ada data pelanggan tersedia"
        renderMobileCard={(customer) => (
          <div
            key={customer.id}
            className="bg-white rounded-[1.25rem] p-3 shadow-sm border border-slate-100 space-y-3 mx-1"
          >
            {/* Header card */}
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-0.5 flex-1 min-w-0">
                <h3 className="text-[11px] font-black text-slate-800 uppercase leading-tight truncate">
                  {customer.name}
                </h3>
                <span className="text-[8px] text-slate-400 font-medium">
                  {customer.gender_label !== "-" ? customer.gender_label : "—"}
                </span>
              </div>
              <div
                className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase border shrink-0
                ${
                  customer.is_active
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-rose-50   text-rose-600   border-rose-100"
                }`}
              >
                {customer.is_active ? "Aktif" : "Nonaktif"}
              </div>
            </div>

            {/* Info */}
            <div className="space-y-1.5 py-2 border-y border-slate-50">
              <div className="flex items-center gap-2">
                <Phone size={10} className="text-slate-300 flex-shrink-0" />
                <p className="text-[9px] text-slate-700 font-bold">
                  {customer.phone}
                </p>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail size={10} className="text-slate-300 flex-shrink-0" />
                  <p className="text-[9px] text-slate-500 italic truncate">
                    {customer.email}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Star
                  size={10}
                  className="text-amber-400 fill-amber-400 flex-shrink-0"
                />
                <p className="text-[9px] text-slate-600 font-bold">
                  {Number(customer.point).toLocaleString("id-ID")} poin
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleDetail(customer)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5
                  bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase
                  active:scale-95 transition-all"
              >
                <Eye size={10} /> Detail
              </button>
              <button
                onClick={() => handleEdit(customer)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5
                  bg-slate-50 text-slate-600 rounded-lg text-[9px] font-black uppercase
                  border border-slate-100 active:scale-95 transition-all"
              >
                <Pencil size={10} /> Edit
              </button>
              <button
                onClick={() => handleDelete(customer)}
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
            emptyMessage="Belum ada data pelanggan yang tersedia"
          />
        )}
      />

      {/* Pagination mobile */}
      <div className="md:hidden mt-4">
        <TablePagination table={mobilePagination} totalEntries={totalCount} />
      </div>

      {/* FAB mobile */}
      <button
        onClick={() => {
          setSelectedCustomer(null);
          setOpenModal(true);
        }}
        className="md:hidden fixed bottom-28 right-6 w-12 h-12 bg-emerald-600 text-white
          rounded-full shadow-2xl flex items-center justify-center z-40
          active:scale-90 border-4 border-white transition-all"
      >
        <PlusSquare size={20} />
      </button>

      {/* Form Modal */}
      <CustomerForm
        open={openModal}
        initialData={selectedCustomer}
        onClose={() => setOpenModal(false)}
        onSuccess={(newCustomer) => {
          if (selectedCustomer) {
            setData((prev) =>
              prev.map((c) => (c.id === newCustomer.id ? newCustomer : c))
            );
          } else {
            setData((prev) =>
              [newCustomer, ...prev].slice(0, pagination.pageSize)
            );
            setTotalCount((prev) => prev + 1);
            setStats((prev) => ({
              ...prev,
              total: prev.total + 1,
              active: prev.active + 1,
            }));
          }
          setOpenModal(false);
        }}
      />

      {/* Detail Modal */}
      <CustomerDetail
        open={openDetail}
        customer={selectedCustomer}
        onClose={() => setOpenDetail(false)}
      />
    </div>
  );
}
