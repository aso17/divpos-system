import React, { useEffect, useState, useCallback } from "react";

import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Search from "lucide-react/dist/esm/icons/search";
import X from "lucide-react/dist/esm/icons/x";
import Filter from "lucide-react/dist/esm/icons/filter";
import Building from "lucide-react/dist/esm/icons/building";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Download from "lucide-react/dist/esm/icons/download";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Banknote from "lucide-react/dist/esm/icons/banknote";
import Receipt from "lucide-react/dist/esm/icons/receipt";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";

import AppHead from "../../components/common/AppHead";
import ReportService from "../../services/ReportService";

import { useHasAccess } from "../../guards/useHasAccess";

const triggerToast = (message, type) =>
  window.dispatchEvent(
    new CustomEvent("global-toast", { detail: { message, type } })
  );

// ── Helpers ────────────────────────────────────────────────────────────────
const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value ?? 0);

const today = () => new Date().toISOString().slice(0, 10);
const firstDayOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

// ── Status badge ──────────────────────────────────────────────────────────
const PaymentStatusBadge = ({ status }) => {
  const map = {
    PAID: {
      label: "Lunas",
      cls: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    PARTIAL: {
      label: "Sebagian",
      cls: "bg-amber-50 text-amber-600 border-amber-100",
    },
    UNPAID: {
      label: "Belum Bayar",
      cls: "bg-rose-50 text-rose-600 border-rose-100",
    },
  };
  const { label, cls } = map[status] ?? {
    label: status,
    cls: "bg-slate-100 text-slate-500 border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${cls}`}
    >
      {label}
    </span>
  );
};

// ── Main Component ────────────────────────────────────────────────────────
export default function ReportPaymentRecap() {
  const can = useHasAccess();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState({
    total_transactions: 0,
    total_revenue: 0,
    total_paid: 0,
    total_unpaid: 0,
  });
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [outlets, setOutlets] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  // ── Filters ─────────────────────────────────────────────────────────────
  const [filterOutlet, setFilterOutlet] = useState("");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth());
  const [dateTo, setDateTo] = useState(today());
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  // ── Fetch — outlets & payment_methods ikut dari response index ───────────
  const fetchReport = useCallback(
    async (isMounted = true) => {
      setLoading(true);
      try {
        const res = await ReportService.getPaymentRecap({
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
          keyword: activeSearch,
          outlet_id: filterOutlet,
          payment_method_id: filterPaymentMethod,
          payment_status: filterStatus,
          date_from: dateFrom,
          date_to: dateTo,
        });

        if (isMounted) {
          const d = res.data;
          setData(d?.data || []);
          setTotalCount(Number(d?.meta?.total || 0));
          setSummary(
            d?.summary ?? {
              total_transactions: 0,
              total_revenue: 0,
              total_paid: 0,
              total_unpaid: 0,
            }
          );

          // Dropdown hanya di-set saat pertama load (pageIndex 0)
          // agar pilihan filter tidak berubah saat user ganti halaman
          if (pagination.pageIndex === 0) {
            if (d?.outlets) setOutlets(d.outlets);
            if (d?.payment_methods) setPaymentMethods(d.payment_methods);
          }
        }
      } catch (error) {
        console.error("Error fetching payment recap:", error);
        triggerToast("Gagal memuat data laporan.", "error");
      } finally {
        if (isMounted) setLoading(false);
      }
    },
    [
      pagination.pageIndex,
      pagination.pageSize,
      activeSearch,
      filterOutlet,
      filterPaymentMethod,
      filterStatus,
      dateFrom,
      dateTo,
    ]
  );

  useEffect(() => {
    let isMounted = true;
    fetchReport(isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchReport]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearch(searchTerm);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const handleReset = () => {
    setSearchTerm("");
    setActiveSearch("");
    setFilterOutlet("");
    setFilterPaymentMethod("");
    setFilterStatus("");
    setDateFrom(firstDayOfMonth());
    setDateTo(today());
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await ReportService.exportPaymentRecap({
        keyword: activeSearch,
        outlet_id: filterOutlet,
        payment_method_id: filterPaymentMethod,
        payment_status: filterStatus,
        date_from: dateFrom,
        date_to: dateTo,
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `rekap-pembayaran-${dateFrom}-${dateTo}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      triggerToast("Export berhasil!", "success");
    } catch {
      triggerToast("Gagal export laporan.", "error");
    } finally {
      setExportLoading(false);
    }
  };

  const hasActiveFilter =
    filterOutlet ||
    filterPaymentMethod ||
    filterStatus ||
    searchTerm ||
    dateFrom !== firstDayOfMonth() ||
    dateTo !== today();

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="px-2 py-4 md:p-6 space-y-4 bg-slate-50/50 min-h-screen pb-28 md:pb-6">
      <AppHead title="Rekap Pembayaran" />

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2.5">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
            <CreditCard size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-[11px] md:text-sm font-black text-slate-800 uppercase leading-none">
              Rekap Pembayaran
            </h1>
            <p className="hidden md:block text-[10px] text-slate-500 mt-1 font-medium">
              Laporan rekap transaksi dan pembayaran
            </p>
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={exportLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white
            rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg uppercase
            disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Download size={15} />
          <span className="hidden md:inline">
            {exportLoading ? "Mengexport..." : "Export Excel"}
          </span>
        </button>
      </div>

      {/* ── Summary Cards ── */}
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-1">
        {[
          {
            label: "Total Transaksi",
            value: summary.total_transactions.toLocaleString("id-ID"),
            subLabel: "transaksi selesai",
            color: "text-[#3B66AD]", // Biru Muted
            icon: <Receipt size={14} className="text-slate-400" />,
          },
          {
            label: "Total Tagihan",
            value: formatRupiah(summary.total_revenue),
            subLabel: "piutang + bayar",
            color: "text-slate-800", // Hitam/Slate gelap
            icon: <TrendingUp size={14} className="text-slate-400" />,
          },
          {
            label: "Total Terbayar",
            value: formatRupiah(summary.total_paid),
            subLabel: "sudah terbayar",
            color: "text-[#3D7A60]", // Hijau Muted (Emerald gelap)
            icon: <Banknote size={14} className="text-slate-400" />,
          },
          {
            label: "Belum Lunas",
            value: formatRupiah(summary.total_unpaid),
            subLabel: "outstanding",
            color: "text-[#8C6239]", // Cokelat/Amber Muted
            icon: <CreditCard size={14} className="text-slate-400" />,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-[#F9F9F7] border border-slate-100 rounded-2xl px-4 py-3 shadow-sm"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              {s.icon}
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {s.label}
              </p>
            </div>
            <p
              className={`text-base md:text-xl font-black leading-none ${s.color} truncate`}
            >
              {s.value}
            </p>
            <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-tighter italic">
              {s.subLabel}
            </p>
          </div>
        ))}
      </div>
      {/* ── Filters ── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm px-4 py-3 mx-1 space-y-3">
        {/* Date range row */}
        <div className="flex flex-wrap gap-3 items-end">
          {/* Date From */}
          <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
            <label className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1">
              <Calendar size={10} /> Dari Tanggal
            </label>
            <input
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2
                text-[11px] font-bold text-slate-700 outline-none
                focus:border-emerald-500/50 focus:bg-white transition-all"
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
            <label className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1">
              <Calendar size={10} /> Sampai Tanggal
            </label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2
                text-[11px] font-bold text-slate-700 outline-none
                focus:border-emerald-500/50 focus:bg-white transition-all"
            />
          </div>

          {/* Outlet */}
          {outlets.length > 0 && (
            <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
              <label className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1">
                <Building size={10} /> Outlet
              </label>
              <div className="relative">
                <select
                  value={filterOutlet}
                  onChange={(e) => {
                    setFilterOutlet(e.target.value);
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                  }}
                  className="w-full appearance-none bg-slate-50 border border-slate-100 rounded-lg px-3 py-2
                    text-[11px] font-bold text-slate-700 outline-none
                    focus:border-emerald-500/50 focus:bg-white transition-all pr-7"
                >
                  <option value="">Semua Outlet</option>
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
            <label className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1">
              <CreditCard size={10} /> Metode Bayar
            </label>
            <div className="relative">
              <select
                value={filterPaymentMethod}
                onChange={(e) => {
                  setFilterPaymentMethod(e.target.value);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
                className="w-full appearance-none bg-slate-50 border border-slate-100 rounded-lg px-3 py-2
                  text-[11px] font-bold text-slate-700 outline-none
                  focus:border-emerald-500/50 focus:bg-white transition-all pr-7"
              >
                <option value="">Semua Metode</option>
                {paymentMethods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
            <label className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1">
              <Filter size={10} /> Status
            </label>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
                className="w-full appearance-none bg-slate-50 border border-slate-100 rounded-lg px-3 py-2
                  text-[11px] font-bold text-slate-700 outline-none
                  focus:border-emerald-500/50 focus:bg-white transition-all pr-7"
              >
                <option value="">Semua Status</option>
                <option value="PAID">Lunas</option>
                <option value="PARTIAL">Sebagian</option>
                <option value="UNPAID">Belum Bayar</option>
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Search row */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-100
                rounded-xl text-[11px] outline-none focus:bg-white
                focus:border-emerald-500/50 transition-all placeholder:text-slate-400"
              placeholder="Cari nomor invoice atau nama pelanggan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleReset}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white
              text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            <Search size={13} className="md:hidden" />
            <span className="hidden md:inline">CARI</span>
          </button>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={handleReset}
              className="hidden md:flex px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600
                text-xs font-bold rounded-xl transition-colors items-center gap-1.5"
            >
              <X size={12} /> Reset
            </button>
          )}
        </form>
      </div>

      {/* ── Data Table — scrollable horizontal di mobile & desktop ── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm mx-1 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-xs font-medium">
              <span className="animate-pulse">Memuat data...</span>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <Receipt size={28} className="text-slate-200" />
              <p className="text-xs font-medium">
                Belum ada data pembayaran pada periode ini
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {[
                    { label: "No", cls: "w-8 text-center" },
                    { label: "Invoice", cls: "min-w-[120px]" },
                    { label: "Pelanggan", cls: "min-w-[120px]" },
                    { label: "Cabang", cls: "min-w-[90px]" },
                    { label: "Total", cls: "min-w-[100px] text-right" },
                    { label: "Terbayar", cls: "min-w-[100px] text-right" },
                    { label: "Sisa", cls: "min-w-[100px] text-right" },
                    { label: "Metode", cls: "min-w-[80px]" },
                    { label: "Status", cls: "min-w-[80px]" },
                  ].map((h) => (
                    <th
                      key={h.label}
                      className={`px-3 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest ${h.cls}`}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((trx, index) => (
                  <tr
                    key={trx.id}
                    className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-3 py-2.5 text-center">
                      <span className="text-slate-400 text-[10px] font-medium">
                        {pagination.pageIndex * pagination.pageSize + index + 1}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="text-[10px] font-black font-mono text-slate-800 uppercase">
                        {trx.invoice_no}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        {new Date(trx.order_date).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="text-[10px] font-semibold text-slate-700 truncate max-w-[120px]">
                        {trx.customer_name || "Umum"}
                      </p>
                      {trx.customer_phone && (
                        <p className="text-[9px] text-slate-400">
                          {trx.customer_phone}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[10px] text-slate-500">
                        {trx.outlet_name || "-"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="text-[10px] font-bold text-slate-700">
                        {formatRupiah(trx.grand_total)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="text-[10px] font-bold text-emerald-600">
                        {formatRupiah(trx.total_paid)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span
                        className={`text-[10px] font-bold ${
                          (trx.remaining ?? trx.grand_total - trx.total_paid) >
                          0
                            ? "text-rose-500"
                            : "text-slate-300"
                        }`}
                      >
                        {formatRupiah(
                          trx.remaining ??
                            Math.max(0, trx.grand_total - trx.total_paid)
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[10px] text-slate-500">
                        {trx.payment_method_name || "-"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <PaymentStatusBadge status={trx.payment_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination inline di bawah tabel */}
        {!loading && data.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between gap-4">
            <p className="text-[10px] text-slate-400 font-medium shrink-0">
              {pagination.pageIndex * pagination.pageSize + 1}–
              {Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                totalCount
              )}{" "}
              dari {totalCount.toLocaleString("id-ID")} data
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  setPagination((p) => ({ ...p, pageIndex: p.pageIndex - 1 }))
                }
                disabled={pagination.pageIndex === 0}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600
                  hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ‹ Prev
              </button>
              <span className="text-[10px] font-bold text-slate-600 px-2">
                {pagination.pageIndex + 1} /{" "}
                {Math.ceil(totalCount / pagination.pageSize) || 1}
              </span>
              <button
                onClick={() =>
                  setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))
                }
                disabled={
                  (pagination.pageIndex + 1) * pagination.pageSize >= totalCount
                }
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600
                  hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
