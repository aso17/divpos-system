import { useState, useEffect } from "react";
import LoadingDots from "../../components/common/LoadingDots";
import AppHead from "../../components/common/AppHead";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulasi fetch data / delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000); // 1 detik delay untuk simulasi loading

    return () => clearTimeout(timer);
  }, []);

  if (loading) return <LoadingDots />;

  return (
    <div>
      <AppHead title="Dashboard" />
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">Total Customers</div>
        <div className="bg-white p-4 rounded shadow">Active Sessions</div>
        <div className="bg-white p-4 rounded shadow">Revenue</div>
      </div>
    </div>
  );
}
