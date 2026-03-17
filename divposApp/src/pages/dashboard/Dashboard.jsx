import { useState, useEffect } from "react";
import LoadingDots from "../../components/common/LoadingDots";
import AppHead from "../../components/common/AppHead";

import LayoutDashboard from "lucide-react/dist/esm/icons/layout-dashboard";
import Users from "lucide-react/dist/esm/icons/users";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import ShoppingCart from "lucide-react/dist/esm/icons/shopping-cart";
import Receipt from "lucide-react/dist/esm/icons/receipt";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import TrendingDown from "lucide-react/dist/esm/icons/trending-down";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Clock from "lucide-react/dist/esm/icons/clock";

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
  Filler,
);

// ─── Chart tooltip shared config ─────────────────────────────────────────────

const TOOLTIP = {
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
  callbacks: {
    label: (ctx) => ` Rp ${Number(ctx.raw).toLocaleString("id-ID")}`,
  },
};

// ─── Static mock data ─────────────────────────────────────────────────────────
// Ganti dengan data dari API / React Query sesuai kebutuhan

const WEEKLY_SALES = {
  labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
  data: [120000, 150000, 90000, 200000, 170000, 220000, 250000],
};

const RECENT_TX = [
  {
    invoice: "INV-00123",
    customer: "Andi Wijaya",
    total: 45000,
    status: "PENDING",
    time: "10:32",
  },
  {
    invoice: "INV-00122",
    customer: "Sari Dewi",
    total: 75000,
    status: "DONE",
    time: "10:15",
  },
  {
    invoice: "INV-00121",
    customer: "Budi Santoso",
    total: 120000,
    status: "DONE",
    time: "09:50",
  },
  {
    invoice: "INV-00120",
    customer: "Rina Susanti",
    total: 60000,
    status: "PROCESS",
    time: "09:22",
  },
  {
    invoice: "INV-00119",
    customer: "Tono Haryadi",
    total: 200000,
    status: "CANCELLED",
    time: "09:00",
  },
];

const STATUS_MAP = {
  DONE: { label: "Selesai", cls: "bg-emerald-100 text-emerald-700" },
  PROCESS: { label: "Proses", cls: "bg-blue-100    text-blue-700" },
  PENDING: { label: "Pending", cls: "bg-amber-100   text-amber-700" },
  CANCELLED: { label: "Batal", cls: "bg-red-100     text-red-600" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtRp = (n) =>
  n >= 1_000_000
    ? `Rp ${(n / 1_000_000).toFixed(1)}jt`
    : `Rp ${n.toLocaleString("id-ID")}`;

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * StatCard — compact KPI card with icon, value, label, optional delta badge.
 * Accent color drives the top bar and icon background.
 */
function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  accentBar,
  delta,
  deltaUp,
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-shadow duration-200">
      {/* top accent */}
      <div
        className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl ${accentBar}`}
      />

      <div className="flex-1 min-w-0 pr-3">
        <p className="text-[10px] text-gray-400 font-semibold tracking-widest uppercase mb-1.5">
          {label}
        </p>
        <p className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight leading-none truncate">
          {value}
        </p>
        {delta !== undefined && (
          <div
            className={`flex items-center gap-1 mt-2 text-[11px] font-semibold ${deltaUp ? "text-emerald-600" : "text-red-500"}`}
          >
            {deltaUp ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{delta}</span>
            <span className="text-gray-400 font-normal">vs kemarin</span>
          </div>
        )}
      </div>

      <div
        className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} transition-transform duration-200 group-hover:scale-110`}
      >
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </div>
  );
}

/**
 * SectionHeader — consistent card header with optional action link.
 */
function SectionHeader({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm md:text-base font-bold text-gray-800">{title}</h2>
      {action && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 text-xs text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
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
  const [activePeriod, setActivePeriod] = useState("Minggu Ini");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const loadTimer = setTimeout(() => setLoading(false), 800);
    const clockTimer = setInterval(() => setNow(new Date()), 60_000);
    return () => {
      clearTimeout(loadTimer);
      clearInterval(clockTimer);
    };
  }, []);

  if (loading) return <LoadingDots />;

  // ── Chart data ──────────────────────────────────────────────────────────────

  const lineData = {
    labels: WEEKLY_SALES.labels,
    datasets: [
      {
        data: WEEKLY_SALES.data,
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
      tooltip: TOOLTIP,
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
          callback: (v) => fmtRp(v),
        },
      },
    },
  };

  const barData = {
    labels: WEEKLY_SALES.labels,
    datasets: [
      {
        label: "Transaksi",
        data: [14, 18, 11, 23, 20, 27, 31],
        backgroundColor: WEEKLY_SALES.data.map((_, i) =>
          i === 6 ? "#059669" : "#a7f3d0",
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
        ...TOOLTIP,
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

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHead title="Dashboard" />

      <div className="max-w-screen-xl mx-auto p-4 md:p-6 space-y-5 md:space-y-6">
        {/* ── Page Header ───────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm shadow-emerald-200 flex-shrink-0">
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

          {/* Period selector + clock */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-white border border-gray-100 rounded-xl p-1 shadow-sm gap-0.5">
              {["Hari Ini", "Minggu Ini", "Bulan Ini"].map((p) => (
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

            <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white border border-gray-100 px-3 py-2 rounded-xl shadow-sm">
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

        {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            label="Pelanggan"
            value="1.245"
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            accentBar="bg-blue-500"
            delta="+34"
            deltaUp={true}
          />
          <StatCard
            label="Transaksi"
            value="87"
            icon={Receipt}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            accentBar="bg-purple-500"
            delta="+12"
            deltaUp={true}
          />
          <StatCard
            label="Revenue Hari Ini"
            value="Rp 2.45jt"
            icon={Wallet}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            accentBar="bg-emerald-500"
            delta="+8.3%"
            deltaUp={true}
          />
          <StatCard
            label="Pending Orders"
            value="12"
            icon={ShoppingCart}
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
            accentBar="bg-orange-400"
            delta="-3"
            deltaUp={false}
          />
        </div>

        {/* ── KPI Highlight Strip ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Antrian Aktif",
              value: "12",
              unit: "order",
              bg: "bg-blue-50",
              border: "border-blue-100",
              color: "text-blue-600",
            },
            {
              label: "Menunggu Pickup",
              value: "27",
              unit: "item",
              bg: "bg-amber-50",
              border: "border-amber-100",
              color: "text-amber-600",
            },
            {
              label: "Belum Lunas",
              value: "9",
              unit: "invoice",
              bg: "bg-red-50",
              border: "border-red-100",
              color: "text-red-500",
            },
            {
              label: "Rating Hari Ini",
              value: "4.8",
              unit: "/ 5.0",
              bg: "bg-emerald-50",
              border: "border-emerald-100",
              color: "text-emerald-600",
            },
          ].map((k) => (
            <div
              key={k.label}
              className={`${k.bg} ${k.border} border rounded-2xl px-4 py-3`}
            >
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-1">
                {k.label}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl md:text-3xl font-bold leading-none ${k.color}`}
                >
                  {k.value}
                </span>
                <span className="text-xs text-gray-400">{k.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Charts row: Line (wide) + Bar ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Line chart — takes 2/3 on desktop, full on mobile */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
            <SectionHeader title="Penjualan 7 Hari Terakhir" action="Detail" />
            <div className="h-[220px] md:h-[280px]">
              <Line data={lineData} options={lineOptions} />
            </div>
          </div>

          {/* Bar chart — 1/3 on desktop, full on mobile */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
            <SectionHeader title="Volume Transaksi" />
            <div className="h-[220px] md:h-[280px]">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>

        {/* ── Recent Transactions ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
          <SectionHeader title="Transaksi Terbaru" action="Lihat Semua" />

          {/* Mobile: card list */}
          <div className="md:hidden space-y-2">
            {RECENT_TX.map((tx) => {
              const s = STATUS_MAP[tx.status] ?? STATUS_MAP.PENDING;
              return (
                <div
                  key={tx.invoice}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
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
                      {fmtRp(tx.total)}
                    </p>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${s.cls}`}
                    >
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Invoice", "Pelanggan", "Total", "Status", "Jam"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left pb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest pr-4 last:pr-0 last:text-right"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {RECENT_TX.map((tx) => {
                  const s = STATUS_MAP[tx.status] ?? STATUS_MAP.PENDING;
                  return (
                    <tr
                      key={tx.invoice}
                      className="hover:bg-emerald-50/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 pr-4">
                        <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                          {tx.invoice}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-medium text-gray-700">
                        {tx.customer}
                      </td>
                      <td className="py-3 pr-4 font-bold text-gray-800 tabular-nums">
                        {fmtRp(tx.total)}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${s.cls}`}
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
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-[10px] text-gray-300 pt-1 pb-3">
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
