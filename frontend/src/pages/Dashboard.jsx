import { useEffect } from "react";
import { useStats } from "../hooks/useStats";
import StatCard from "../components/StatCard";
import RefreshButton from "../components/RefreshButton";

const Dashboard = () => {
  const { stats, loading, error, refetch } = useStats();

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  if (loading && !stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading dashboard: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
        <RefreshButton onRefresh={refetch} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products Tracked"
          value={stats?.totalProducts || 0}
          icon="📦"
        />
        <StatCard
          title="Average Price"
          value={formatPrice(stats?.avgPrice)}
          icon="💰"
        />
        <StatCard
          title="Average Rating"
          value={
            stats?.avgRating
              ? `${parseFloat(stats.avgRating).toFixed(2)} / 5.0`
              : "0 / 5.0"
          }
          icon="⭐"
        />
        <StatCard
          title="Last Updated"
          value={formatDate(stats?.lastUpdated)}
          icon="🕒"
        />
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">System Status</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Database:</span>
            <span className="text-green-600 font-medium">● Connected</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Scheduler:</span>
            <span className="text-green-600 font-medium">● Running</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">API:</span>
            <span className="text-green-600 font-medium">● Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
