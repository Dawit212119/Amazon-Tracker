import { useState, useEffect } from "react";
import { productService } from "../services/api";
import ProductCard from "../components/ProductCard";
import RefreshButton from "../components/RefreshButton";

const TopDrops = () => {
  const [topChanges, setTopChanges] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("drops");

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 5000);
    return () => clearInterval(interval);
  }, []);

  const reconcileByAsin = (prev, next) => {
    const map = new Map(prev.map((i) => [i.asin, i]));
    return next.map((n) =>
      map.has(n.asin) ? { ...map.get(n.asin), ...n } : n
    );
  };

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const [changesData, alertsData] = await Promise.all([
        productService.getTopChanges(),
        productService.getPriceAlerts(),
      ]);
      setTopChanges((prev) => reconcileByAsin(prev, changesData));
      setAlerts((prev) => reconcileByAsin(prev, alertsData));
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-500">Loading price drops...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading data: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold text-gray-900">
          Price Drops & Alerts
        </h2>
        <RefreshButton onRefresh={fetchData} />
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("drops")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "drops"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Top Price Drops (24h)
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "alerts"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Price Alerts (&gt;5% drop)
          </button>
        </nav>
      </div>

      {activeTab === "drops" && (
        <div>
          {topChanges.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <p className="text-gray-500 text-lg mb-2">
                No price drops or new products in the last 24 hours.
              </p>
              <p className="text-sm text-gray-400">
                Try scraping some products first to see them here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Previous Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topChanges.map((change) => (
                    <tr key={change.asin} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {change.title?.substring(0, 60)}...
                        </div>
                        <div className="text-sm text-gray-500">
                          {change.asin}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {change.is_new_product ? (
                          <span className="text-gray-400 italic">
                            N/A (New)
                          </span>
                        ) : (
                          formatPrice(change.previous_price)
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600">
                        {formatPrice(change.current_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {change.is_new_product ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            🆕 New Product
                          </span>
                        ) : change.percent_change ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            ↓ {parseFloat(change.percent_change).toFixed(2)}%
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "alerts" && (
        <div>
          {alerts.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <p className="text-gray-500 text-lg">
                No price alerts (products with &gt;5% price drop) in the last 24
                hours.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {alerts.map((alert) => (
                <div
                  key={alert.asin}
                  className="bg-white rounded-lg shadow-md p-6 border-2 border-red-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                      ⚠️ Alert
                    </span>
                    <span className="text-sm text-red-600 font-bold">
                      {alert.percent_change?.toFixed(2)}% Drop
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {alert.title}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Previous:</span>
                      <span className="text-sm text-gray-700 line-through">
                        {formatPrice(alert.previous_price)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Current:</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatPrice(alert.current_price)}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <span className="text-xs text-gray-400">
                        ASIN: {alert.asin}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`https://www.amazon.com/dp/${alert.asin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 block w-full text-center bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition-colors"
                  >
                    View on Amazon
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TopDrops;
