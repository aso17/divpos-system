import React, { useEffect, useState, useCallback } from "react";
import Search from "lucide-react/dist/esm/icons/search";
import Building from "lucide-react/dist/esm/icons/building";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Download from "lucide-react/dist/esm/icons/download";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Filter from "lucide-react/dist/esm/icons/filter";

import AppHead from "../../components/common/AppHead";
import ReportService from "../../services/ReportService";

// ── Helpers ────────────────────────────────────────────────────────────────
const triggerToast = (message, type) =>
  window.dispatchEvent(
    new CustomEvent("global-toast", { detail: { message, type } })
  );

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

// ── Status Badge ──────────────────────────────────────────────────────────
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

export default function RevenueReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [summary, setSummary] = useState({
    total_transactions: 0,
    total_grand_total: 0,
    total_paid: 0,
    total_outstanding: 0,
    avg_per_transaction: 0,
  });

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
  const [outlets, setOutlets] = useState([]);

  const [filterOutlet, setFilterOutlet] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth());
  const [dateTo, setDateTo] = useState(today());
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const fetchReport = useCallback(
    async (isMounted = true) => {
      setLoading(true);
      try {
        const res = await ReportService.getRevenueAnalysis({
          page: pagination.pageIndex + 1,
          per_page: pagination.pageSize,
          search: activeSearch,
          outlet_id: filterOutlet,
          payment_status: filterStatus,
          date_from: dateFrom,
          date_to: dateTo,
        });

        if (isMounted) {
          const result = res.data;
          setData(result.transactions?.data || []);
          setTotalCount(result.transactions?.meta?.total || 0);

          if (result.summary) {
            setSummary({
              total_transactions: result.summary.total_transactions ?? 0,
              total_grand_total: result.summary.total_grand_total ?? 0,
              total_paid: result.summary.total_paid ?? 0,
              total_outstanding: result.summary.total_outstanding ?? 0,
              avg_per_transaction: result.summary.avg_per_transaction ?? 0,
            });
          }

          if (pagination.pageIndex === 0 && result.outlets) {
            setOutlets(result.outlets);
          }
        }
      } catch (error) {
        console.error("Error:", error);
        triggerToast("Gagal memuat laporan", "error");
      } finally {
        if (isMounted) setLoading(false);
      }
    },
    [
      pagination.pageIndex,
      pagination.pageSize,
      activeSearch,
      filterOutlet,
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

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearch(searchTerm);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  return (
    <div className="px-2 py-4 md:p-6 space-y-4 bg-slate-50/50 min-h-screen pb-28 md:pb-6">
      <AppHead title="Laporan Pendapatan" />

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
            <TrendingUp size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-[11px] md:text-sm font-black text-slate-800 uppercase leading-none">
              Laporan Pendapatan
            </h1>
            <p className="hidden md:block text-[10px] text-slate-500 mt-1 font-medium italic uppercase">
              Real-time Revenue Analysis
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg uppercase">
          <Download size={15} />
          <span className="hidden md:inline">Export Excel</span>
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-1">
        <div className="bg-[#F9F9F7] border border-slate-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
            Total Transaksi
          </p>
          <p className="text-xl md:text-2xl font-black text-[#3B66AD] mt-1 leading-none">
            {summary.total_transactions.toLocaleString("id-ID")}
          </p>
          <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase italic">
            transaksi selesai
          </p>
        </div>
        <div className="bg-[#F9F9F7] border border-slate-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
            Total Pendapatan
          </p>
          <p className="text-xl md:text-2xl font-black text-[#3D7A60] mt-1 leading-none">
            {formatRupiah(summary.total_paid)}
          </p>
          <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase italic">
            sudah terbayar
          </p>
        </div>
        <div className="bg-[#F9F9F7] border border-slate-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
            Belum Lunas
          </p>
          <p className="text-xl md:text-2xl font-black text-[#8C6239] mt-1 leading-none">
            {formatRupiah(summary.total_outstanding)}
          </p>
          <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase italic">
            outstanding
          </p>
        </div>
        <div className="bg-[#F9F9F7] border border-slate-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
            Rata-rata/TRX
          </p>
          <p className="text-xl md:text-2xl font-black text-slate-800 mt-1 leading-none">
            {formatRupiah(summary.avg_per_transaction)}
          </p>
          <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase italic">
            per transaksi
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm px-4 py-3 mx-1 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
            <label className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1">
              <Calendar size={10} /> Dari
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[11px] font-bold outline-none"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
            <label className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1">
              <Calendar size={10} /> Sampai
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[11px] font-bold outline-none"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
            <label className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1">
              <Building size={10} /> Outlet
            </label>
            <select
              value={filterOutlet}
              onChange={(e) => setFilterOutlet(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[11px] font-bold outline-none"
            >
              <option value="">Semua Outlet</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
            <label className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1">
              <Filter size={10} /> Status Bayar
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[11px] font-bold outline-none"
            >
              <option value="">Semua Status</option>
              <option value="PAID">Lunas</option>
              <option value="PARTIAL">Sebagian</option>
              <option value="UNPAID">Belum Bayar</option>
            </select>
          </div>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] outline-none"
              placeholder="Cari invoice atau pelanggan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md uppercase"
          >
            Cari
          </button>
        </form>
      </div>

      {/* ── Table Section ── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm mx-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase text-center w-8">
                  #
                </th>
                <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase text-left">
                  Invoice & Tanggal
                </th>
                <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase text-left">
                  Outlet
                </th>
                <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase text-left">
                  Pelanggan
                </th>
                <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase text-left">
                  Layanan
                </th>
                <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase text-left text-slate-500">
                  Kasir
                </th>
                <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase text-right">
                  Grand Total
                </th>
                <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase text-right text-orange-600 italic">
                  DP
                </th>
                <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase text-right text-emerald-600">
                  Terbayar
                </th>
                <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase text-center">
                  Metode
                </th>
                <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase text-center">
                  Status
                </th>
                <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase text-center">
                  Status Bayar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td
                    colSpan="12"
                    className="py-12 text-center text-[10px] text-slate-400 font-bold uppercase animate-pulse"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan="12"
                    className="py-12 text-center text-[10px] text-slate-400 font-bold uppercase"
                  >
                    Data tidak ditemukan
                  </td>
                </tr>
              ) : (
                data.map((trx, index) => (
                  <tr
                    key={trx.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-3 py-3 text-center text-[10px] text-slate-400 font-bold">
                      {pagination.pageIndex * pagination.pageSize + index + 1}
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-[10px] font-black text-slate-800 uppercase leading-tight">
                        {trx.invoice_no}
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium">
                        {trx.order_date_label}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-[10px] text-slate-600 font-bold uppercase whitespace-nowrap">
                      {trx.outlet_name}
                    </td>
                    <td className="px-3 py-3 text-[10px] font-bold text-slate-700 uppercase">
                      {trx.customer_name || "General"}
                    </td>
                    <td className="px-3 py-3 max-w-[150px]">
                      <p className="text-[9px] text-slate-600 font-bold italic truncate">
                        {trx.details_count > 0
                          ? `${trx.details_count} Layanan`
                          : "-"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-[10px] font-black text-slate-500 uppercase">
                      {trx.created_by_name || "-"}
                    </td>
                    <td className="px-3 py-3 text-right text-[10px] font-black text-slate-800 whitespace-nowrap">
                      {formatRupiah(trx.grand_total)}
                    </td>
                    <td className="px-3 py-3 text-right text-[10px] font-bold text-orange-600 italic whitespace-nowrap">
                      {formatRupiah(trx.dp_amount)}
                    </td>
                    <td className="px-3 py-3 text-right text-[10px] font-black text-emerald-600 whitespace-nowrap">
                      {formatRupiah(trx.total_paid)}
                    </td>
                    <td className="px-3 py-3 text-center text-[9px] font-bold text-slate-500 uppercase">
                      {trx.payment_method_name || "-"}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-slate-100 text-slate-500 border border-slate-200 uppercase whitespace-nowrap">
                        {trx.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <PaymentStatusBadge status={trx.payment_status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {!loading && data.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">
              Hal {pagination.pageIndex + 1} dari{" "}
              {Math.ceil(totalCount / pagination.pageSize)}
            </p>
            <div className="flex gap-1.5">
              <button
                disabled={pagination.pageIndex === 0}
                onClick={() =>
                  setPagination((p) => ({ ...p, pageIndex: p.pageIndex - 1 }))
                }
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition-colors"
              >
                ‹ Prev
              </button>
              <button
                disabled={
                  (pagination.pageIndex + 1) * pagination.pageSize >= totalCount
                }
                onClick={() =>
                  setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))
                }
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-40 transition-colors"
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
