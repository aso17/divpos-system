import { useState, useEffect } from "react";
import LoadingDots from "../../components/common/LoadingDots";
import AppHead from "../../components/common/AppHead";

import LayoutDashboard from "lucide-react/dist/esm/icons/layout-dashboard";
import Users from "lucide-react/dist/esm/icons/users";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import ShoppingCart from "lucide-react/dist/esm/icons/shopping-cart";
import Receipt from "lucide-react/dist/esm/icons/receipt";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (loading) return <LoadingDots />;

  const salesData = {
    labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
    datasets: [
      {
        data: [120000, 150000, 90000, 200000, 170000, 220000, 250000],
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.15)",
        tension: 0.45,
        fill: true,
        pointRadius: 4,
      },
    ],
  };

  return (
    <div className="space-y-6 p-5">
      <AppHead title="Dashboard" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-emerald-600" />
          </div>

          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
              Dashboard
            </h1>
            <p className="text-xs text-gray-500">
              Overview performa bisnis hari ini
            </p>
          </div>
        </div>

        <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Updated just now
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase">Customers</p>
            <p className="text-2xl font-semibold mt-1">1,245</p>
          </div>

          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase">Transactions</p>
            <p className="text-2xl font-semibold mt-1">87</p>
          </div>

          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
            <Receipt className="w-5 h-5 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase">Revenue Today</p>
            <p className="text-2xl font-semibold mt-1 text-emerald-600">
              Rp 2.450.000
            </p>
          </div>

          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase">Pending Orders</p>
            <p className="text-2xl font-semibold mt-1 text-orange-500">12</p>
          </div>

          <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm md:text-base">
            Penjualan 7 Hari Terakhir
          </h2>
        </div>

        <div className="h-[280px] md:h-[340px]">
          <Line
            data={salesData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                x: {
                  grid: {
                    display: false,
                  },
                },
                y: {
                  grid: {
                    color: "#f1f5f9",
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="font-semibold mb-4">Transaksi Terbaru</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-left border-b">
                <th className="py-2">Invoice</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              <tr className="border-b hover:bg-slate-50">
                <td className="py-2 font-medium">INV-00123</td>
                <td>Andi</td>
                <td>Rp 45.000</td>
                <td className="text-orange-500 font-medium">Pending</td>
              </tr>

              <tr className="border-b hover:bg-slate-50">
                <td className="py-2 font-medium">INV-00122</td>
                <td>Sari</td>
                <td>Rp 75.000</td>
                <td className="text-emerald-600 font-medium">Paid</td>
              </tr>

              <tr className="hover:bg-slate-50">
                <td className="py-2 font-medium">INV-00121</td>
                <td>Budi</td>
                <td>Rp 120.000</td>
                <td className="text-emerald-600 font-medium">Paid</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
