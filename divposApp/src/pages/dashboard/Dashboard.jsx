import { useState, useEffect, useCallback } from "react";
import LoadingDots from "../../components/common/LoadingDots";
import AppHead from "../../components/common/AppHead";
import DashboardService from "../../services/DashboardService";

import LayoutDashboard from "lucide-react/dist/esm/icons/layout-dashboard";
import Users from "lucide-react/dist/esm/icons/users";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import ShoppingCart from "lucide-react/dist/esm/icons/shopping-cart";
import Receipt from "lucide-react/dist/esm/icons/receipt";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import TrendingDown from "lucide-react/dist/esm/icons/trending-down";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Clock from "lucide-react/dist/esm/icons/clock";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
);

// ─── Konstanta ────────────────────────────────────────────────────────────────

const PERIODS = ["Hari Ini", "Minggu Ini", "Bulan Ini"];

// Sync dengan konstanta status di backend:
// PENDING | PROCESS | READY | TAKEN | CANCELED | COMPLETED
const STATUS_MAP = {
  PENDING: { label: "Pending", cls: "bg-amber-100  text-amber-700" },
  PROCESS: { label: "Proses", cls: "bg-blue-100   text-blue-700" },
  READY: { label: "Siap", cls: "bg-purple-100 text-purple-700" },
  TAKEN: { label: "Diambil", cls: "bg-gray-100   text-gray-600" },
  CANCELED: { label: "Batal", cls: "bg-red-100    text-red-600" },
  COMPLETED: { label: "Selesai", cls: "bg-emerald-100 text-emerald-700" },
  // Legacy fallback — jaga kompatibilitas jika ada data lama
  DONE: { label: "Selesai", cls: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Batal", cls: "bg-red-100    text-red-600" },
};

// Map string dari BE → komponen Lucide
const ICON_MAP = {
  users: Users,
  receipt: Receipt,
  wallet: Wallet,
  "shopping-cart": ShoppingCart,
};

// Map accent string dari BE → class Tailwind
const ACCENT_MAP = {
  blue: {
    bar: "bg-blue-500",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  purple: {
    bar: "bg-purple-500",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  emerald: {
    bar: "bg-emerald-500",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  orange: {
    bar: "bg-orange-400",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
  },
};

const KPI_COLOR_MAP = {
  blue: { bg: "bg-blue-50", border: "border-blue-100", color: "text-blue-600" },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-100",
    color: "text-amber-600",
  },
  red: { bg: "bg-red-50", border: "border-red-100", color: "text-red-500" },
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    color: "text-emerald-600",
  },
};

const TOOLTIP_BASE = {
  backgroundColor: "#fff",
  borderColor: "#e5e7eb",
  borderWidth: 1,
  titleColor: "#111827",
  bodyColor: "#6b7280",
  padding: 10,
  cornerRadius: 8,
  titleFont: { size: 12, weight: "600" },
  bodyFont: { size: 11 },
  displayColors: false,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ stat }) {
  const accent = ACCENT_MAP[stat.accent] ?? ACCENT_MAP.blue;
  const Icon = ICON_MAP[stat.icon] ?? Users;

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5
      flex items-center justify-between relative overflow-hidden group
      hover:shadow-md transition-shadow duration-200"
    >
      {/* Accent bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl ${accent.bar}`}
      />

      <div className="flex-1 min-w-0 pr-3">
        <p className="text-[10px] text-gray-400 font-semibold tracking-widest uppercase mb-1.5">
          {stat.label}
        </p>
        <p className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight leading-none truncate">
          {stat.value_fmt}
        </p>
        {stat.delta_fmt && (
          <div
            className={`flex items-center gap-1 mt-2 text-[11px] font-semibold
            ${stat.delta_up ? "text-emerald-600" : "text-red-500"}`}
          >
            {stat.delta_up ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{stat.delta_fmt}</span>
            <span className="text-gray-400 font-normal">vs sebelumnya</span>
          </div>
        )}
      </div>

      <div
        className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center
        flex-shrink-0 ${accent.iconBg}
        transition-transform duration-200 group-hover:scale-110`}
      >
        <Icon className={`w-5 h-5 ${accent.iconColor}`} />
      </div>
    </div>
  );
}

function SectionHeader({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm md:text-base font-bold text-gray-800">{title}</h2>
      {action && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 text-xs text-emerald-600 font-semibold
            hover:text-emerald-700 transition-colors"
        >
          {action} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [activePeriod, setActivePeriod] = useState("Minggu Ini");
  const [now, setNow] = useState(new Date());

  // ── Clock ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // ── Fetch data — pola sama dengan fetchOutlets, fetchCategories, dll. ──────
  const fetchDashboard = useCallback(
    async (isMounted = true) => {
      setLoading(true);
      setError(null);
      try {
        const res = await DashboardService.getDashboard(activePeriod);
        if (isMounted) {
          setData(res.data?.data ?? null);
        }
      } catch (err) {
        console.error("Gagal mengambil data dashboard:", err);
        if (isMounted) setError("Gagal memuat data dashboard.");
      } finally {
        if (isMounted) setLoading(false);
      }
    },
    [activePeriod]
  );

  useEffect(() => {
    let isMounted = true;
    fetchDashboard(isMounted);
    return () => {
      isMounted = false;
    };
  }, [fetchDashboard]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingDots />
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col gap-4">
        <p className="text-sm text-gray-400 font-medium">
          {error ?? "Data tidak tersedia."}
        </p>
        <button
          onClick={() => fetchDashboard()}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white
            rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <RefreshCw size={14} /> Coba Lagi
        </button>
      </div>
    );
  }

  // ── Destructure data dari BE ───────────────────────────────────────────────
  // Semua field sudah diformat di DashboardResource (value_fmt, delta_fmt, dll.)
  const {
    stats = [],
    kpi_strip = [],
    weekly_sales = { labels: [], revenue: [], count: [] },
    recent_transactions = [],
    top_packages = [],
    payment_mix = [],
  } = data;

  // ── Chart configs ─────────────────────────────────────────────────────────
  const lineData = {
    labels: weekly_sales.labels,
    datasets: [
      {
        data: weekly_sales.revenue,
        borderColor: "#059669",
        backgroundColor: "rgba(5,150,105,0.07)",
        tension: 0.45,
        fill: true,
        pointRadius: 5,
        pointBackgroundColor: "#059669",
        pointBorderColor: "#fff",
        pointBorderWidth: 2.5,
        pointHoverRadius: 7,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...TOOLTIP_BASE,
        callbacks: {
          label: (ctx) => ` Rp ${Number(ctx.raw).toLocaleString("id-ID")}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#9ca3af", font: { size: 11 } },
      },
      y: {
        grid: { color: "#f3f4f6", drawBorder: false },
        border: { display: false },
        ticks: {
          color: "#9ca3af",
          font: { size: 11 },
          callback: (v) =>
            v >= 1_000_000
              ? `${(v / 1_000_000).toFixed(1)}jt`
              : `${(v / 1_000).toFixed(0)}rb`,
        },
      },
    },
  };

  const barData = {
    labels: weekly_sales.labels,
    datasets: [
      {
        label: "Transaksi",
        data: weekly_sales.count,
        backgroundColor: weekly_sales.count.map((_, i) =>
          i === weekly_sales.count.length - 1 ? "#059669" : "#a7f3d0"
        ),
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...TOOLTIP_BASE,
        callbacks: { label: (ctx) => ` ${ctx.raw} transaksi` },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#9ca3af", font: { size: 11 } },
      },
      y: {
        grid: { color: "#f3f4f6", drawBorder: false },
        border: { display: false },
        ticks: { color: "#9ca3af", font: { size: 11 }, stepSize: 5 },
        beginAtZero: true,
      },
    },
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHead title="Dashboard" />

      <div className="max-w-screen-xl mx-auto p-4 md:p-6 space-y-5 md:space-y-6">
        {/* ── Page Header ───────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center
              shadow-sm shadow-emerald-200 flex-shrink-0"
            >
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
                Dashboard
              </h1>
              <p className="text-xs text-gray-400">
                Overview performa bisnis hari ini
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Period selector */}
            <div className="flex bg-white border border-gray-100 rounded-xl p-1 shadow-sm gap-0.5">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setActivePeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap
                    ${
                      activePeriod === p
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Clock */}
            <div
              className="flex items-center gap-1.5 text-xs text-gray-400 bg-white
              border border-gray-100 px-3 py-2 rounded-xl shadow-sm"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                {now.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat) => (
            <StatCard key={stat.key} stat={stat} />
          ))}
        </div>

        {/* ── KPI Strip ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpi_strip.map((k) => {
            const c = KPI_COLOR_MAP[k.color] ?? KPI_COLOR_MAP.blue;
            return (
              <div
                key={k.key}
                className={`${c.bg} ${c.border} border rounded-2xl px-4 py-3`}
              >
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-1">
                  {k.label}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-2xl md:text-3xl font-bold leading-none ${c.color}`}
                  >
                    {k.value}
                  </span>
                  <span className="text-xs text-gray-400">{k.unit}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Charts row ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Line chart — 2/3 desktop, full mobile */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
            <SectionHeader title="Penjualan 7 Hari Terakhir" action="Detail" />
            <div className="h-[220px] md:h-[280px]">
              {weekly_sales.labels.length > 0 ? (
                <Line data={lineData} options={lineOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-300">
                  Belum ada data penjualan
                </div>
              )}
            </div>
          </div>

          {/* Bar chart — 1/3 desktop, full mobile */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
            <SectionHeader title="Volume Transaksi" />
            <div className="h-[220px] md:h-[280px]">
              {weekly_sales.count.length > 0 ? (
                <Bar data={barData} options={barOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-300">
                  Belum ada data
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Recent Transactions ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
          <SectionHeader title="Transaksi Terbaru" action="Lihat Semua" />

          {recent_transactions.length === 0 ? (
            <p className="text-sm text-gray-300 text-center py-8">
              Belum ada transaksi
            </p>
          ) : (
            <>
              {/* Mobile */}
              <div className="md:hidden space-y-2">
                {recent_transactions.map((tx) => {
                  const s = STATUS_MAP[tx.status] ?? STATUS_MAP.PENDING;
                  return (
                    <div
                      key={tx.invoice}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className="font-mono text-[11px] font-bold text-emerald-700
                            bg-emerald-50 px-2 py-0.5 rounded-lg"
                          >
                            {tx.invoice}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {tx.time}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-700 truncate">
                          {tx.customer}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3 space-y-1">
                        <p className="text-sm font-bold text-gray-800">
                          {tx.total_fmt}
                        </p>
                        <span
                          className={`inline-block text-[10px] font-bold
                          px-2 py-0.5 rounded-full ${s.cls}`}
                        >
                          {s.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Invoice", "Pelanggan", "Total", "Status", "Jam"].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left pb-3 text-[10px] font-semibold text-gray-400
                            uppercase tracking-widest pr-4 last:pr-0 last:text-right"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recent_transactions.map((tx) => {
                      const s = STATUS_MAP[tx.status] ?? STATUS_MAP.PENDING;
                      return (
                        <tr
                          key={tx.invoice}
                          className="hover:bg-emerald-50/40 transition-colors cursor-pointer"
                        >
                          <td className="py-3 pr-4">
                            <span
                              className="font-mono text-[11px] font-bold text-emerald-700
                              bg-emerald-50 px-2 py-1 rounded-lg"
                            >
                              {tx.invoice}
                            </span>
                          </td>
                          <td className="py-3 pr-4 font-medium text-gray-700">
                            {tx.customer}
                          </td>
                          <td className="py-3 pr-4 font-bold text-gray-800 tabular-nums">
                            {tx.total_fmt}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1
                              rounded-full text-[10px] font-bold ${s.cls}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 flex-shrink-0" />
                              {s.label}
                            </span>
                          </td>
                          <td className="py-3 text-right text-gray-400 tabular-nums text-xs">
                            {tx.time}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* ── Top Packages ─────────────────────────────────────────────── */}
        {top_packages.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
            <SectionHeader title="Paket Terlaris" />
            <div className="space-y-3">
              {top_packages.map((pkg, i) => {
                const maxRevenue = top_packages[0]?.total_revenue ?? 1;
                const pct = (pkg.total_revenue / maxRevenue) * 100;
                return (
                  <div key={pkg.name} className="flex items-center gap-3">
                    <span className="w-5 text-xs font-bold text-gray-400 flex-shrink-0 text-right">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-gray-700 truncate pr-2">
                          {pkg.name}
                        </span>
                        <span className="text-xs font-bold text-gray-800 tabular-nums flex-shrink-0">
                          {pkg.revenue_fmt}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 w-10 text-right tabular-nums">
                      {pkg.tx_count}x
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Payment Mix ───────────────────────────────────────────────── */}
        {payment_mix.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
            <SectionHeader title="Metode Pembayaran" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {payment_mix.map((p) => {
                const totalAll = payment_mix.reduce((s, x) => s + x.total, 0);
                const pct =
                  totalAll > 0 ? Math.round((p.total / totalAll) * 100) : 0;
                return (
                  <div
                    key={p.method}
                    className="bg-gray-50 border border-gray-100 rounded-xl p-3"
                  >
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      {p.method}
                    </p>
                    <p className="text-base font-bold text-gray-800">
                      {p.total_fmt}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div
          className="flex flex-col sm:flex-row sm:justify-between gap-1
          text-[10px] text-gray-300 pt-1 pb-3"
        >
          <span>© 2025 POS Multi-Bisnis · v1.0.0</span>
          <span>
            Diperbarui:{" "}
            {now.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
