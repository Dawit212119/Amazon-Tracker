import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { productService } from "../services/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Trends = () => {
  const [products, setProducts] = useState([]); // All tracked products for dropdown
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedAsin, setSelectedAsin] = useState("");
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Fetch all tracked products for the dropdown
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const allProducts = await productService.getAllProducts(100);
        setProducts(allProducts);
      } catch (err) {
        console.error("Error fetching all products:", err);
      }
    };

    // Fetch on mount
    fetchAllProducts();

    // Auto-refresh every 5 seconds to get newly scraped products
    const interval = setInterval(() => {
      fetchAllProducts();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await productService.searchProducts(query);
      setSearchResults(results);
      setShowResults(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleEnterKey = async () => {
    const trimmedInput = searchInput.trim();

    if (!trimmedInput) {
      setError("Please enter an ASIN or product name");
      return;
    }

    // Check if input is a valid ASIN (10 alphanumeric characters)
    const asinPattern = /^[A-Z0-9]{10}$/i;

    if (asinPattern.test(trimmedInput)) {
      // Direct ASIN entry - fetch product directly
      await fetchProductDataForAsin(trimmedInput.toUpperCase());
      setShowResults(false);
      return;
    }

    // If we have search results, use the first one
    if (searchResults.length > 0) {
      const product = searchResults[0];
      await fetchProductDataForAsin(product.asin);
      setSearchInput(product.title);
      setShowResults(false);
      setSearchResults([]);
      return;
    }

    // If no results but input is long enough, search first then use first result
    if (trimmedInput.length >= 2) {
      setSearchLoading(true);
      try {
        const results = await productService.searchProducts(trimmedInput);
        setSearchResults(results);
        setSearchLoading(false);

        if (results.length > 0) {
          // Use first search result
          const product = results[0];
          await fetchProductDataForAsin(product.asin);
          setSearchInput(product.title);
          setShowResults(false);
          setSearchResults([]);
        } else {
          setError(
            `No product found matching "${trimmedInput}". Try searching by ASIN or product name.`
          );
        }
      } catch (err) {
        setError(err.message || "Failed to search products");
        setSearchLoading(false);
      }
    } else {
      setError("Please enter at least 2 characters or a valid ASIN");
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchInput.trim().length >= 2) {
      const timer = setTimeout(() => {
        handleSearch(searchInput.trim());
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchInput]);

  useEffect(() => {
    if (selectedAsin) {
      fetchProductData();
    }
  }, [selectedAsin]);

  const fetchProductData = async () => {
    if (!selectedAsin) return;
    setLoading(true);
    setError(null);
    try {
      const data = await productService.getByAsin(selectedAsin);
      setProductData(data);
    } catch (err) {
      setError(err.message || `Product not found: ${selectedAsin}`);
      setProductData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductDataForAsin = async (asin) => {
    if (!asin) return;
    setLoading(true);
    setError(null);
    setSelectedAsin(asin); // Set ASIN first
    try {
      const data = await productService.getByAsin(asin);
      setProductData(data);
    } catch (err) {
      setError(err.message || `Product not found: ${asin}`);
      setProductData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = () => {
    if (
      !productData ||
      !productData.history ||
      productData.history.length === 0
    ) {
      return null;
    }

    const history = [...productData.history].reverse(); // Oldest first
    const labels = history.map((item) =>
      new Date(item.timestamp).toLocaleDateString()
    );
    const prices = history.map((item) => parseFloat(item.price));
    const ratings = productData.history
      .filter((item) => item.rating)
      .map((item) => parseFloat(item.rating));

    return {
      labels,
      datasets: [
        {
          label: "Price ($)",
          data: prices,
          borderColor: "rgb(99, 102, 241)",
          backgroundColor: "rgba(99, 102, 241, 0.1)",
          tension: 0.3,
          yAxisID: "y",
        },
        {
          label: "Rating",
          data: ratings.length > 0 ? ratings : [],
          borderColor: "rgb(251, 191, 36)",
          backgroundColor: "rgba(251, 191, 36, 0.1)",
          tension: 0.3,
          yAxisID: "y1",
          hidden: ratings.length === 0,
        },
      ],
    };
  };

  const chartData = formatChartData();

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: productData
          ? `Price & Rating Trend: ${productData.title.substring(0, 50)}...`
          : "Select a product to view trends",
      },
    },
    scales: {
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: {
          display: true,
          text: "Price ($)",
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        title: {
          display: true,
          text: "Rating",
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">
        Price & Rating Trends
      </h2>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-lg shadow-md relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Product by ASIN or Name
        </label>
        <div className="relative">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setError(null);
              }}
              placeholder="Enter ASIN (e.g., B013HD3INW) or product name..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowResults(true);
                }
              }}
              onBlur={() => {
                // Delay hiding results to allow clicking
                setTimeout(() => setShowResults(false), 200);
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleEnterKey();
                }
              }}
            />
            <button
              onClick={handleEnterKey}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              View Trends
            </button>
          </div>
          {searchLoading && (
            <div className="absolute right-20 top-2.5 text-gray-400 text-sm">
              Searching...
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((product) => (
              <div
                key={product.id}
                onClick={async () => {
                  setSelectedAsin(product.asin);
                  setSearchInput(product.title);
                  setShowResults(false);
                  setSearchResults([]);
                  // Ensure product data is fetched
                  await fetchProductDataForAsin(product.asin);
                }}
                onMouseDown={(e) => {
                  // Prevent input blur when clicking
                  e.preventDefault();
                }}
                className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900">
                  {product.title.substring(0, 70)}
                  {product.title.length > 70 ? "..." : ""}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  ASIN: {product.asin} • ${parseFloat(product.price).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}

        {showResults &&
          searchResults.length === 0 &&
          searchInput.length >= 2 &&
          !searchLoading && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-center text-gray-500">
              No products found matching "{searchInput}"
            </div>
          )}

        {/* Quick Select from Existing Products */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Or Select from Recent Products
          </label>
          <select
            value={selectedAsin}
            onChange={async (e) => {
              const asin = e.target.value;
              setSelectedAsin(asin);
              if (asin) {
                const product = products.find((p) => p.asin === asin);
                if (product) {
                  setSearchInput(product.title);
                }
                // Fetch product data when selected from dropdown
                await fetchProductDataForAsin(asin);
              } else {
                setProductData(null);
                setSearchInput("");
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Select a product --</option>
            {products.map((product) => (
              <option key={product.id} value={product.asin}>
                {product.title.substring(0, 60)}... ({product.asin})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-xl text-gray-500">Loading trend data...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {!loading && !error && chartData && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Line data={chartData} options={chartOptions} />
          <div className="mt-4 text-sm text-gray-600">
            <p>
              <strong>Current Price:</strong>{" "}
              {productData.price
                ? `$${parseFloat(productData.price).toFixed(2)}`
                : "N/A"}
            </p>
            <p>
              <strong>Current Rating:</strong>{" "}
              {productData.rating
                ? `${parseFloat(productData.rating).toFixed(1)} / 5.0`
                : "N/A"}
            </p>
            <p>
              <strong>Data Points:</strong> {productData.history.length}
            </p>
          </div>
        </div>
      )}

      {!loading && !error && !chartData && selectedAsin && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            No historical data available for this product yet.
          </p>
        </div>
      )}

      {!selectedAsin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            Search for a product by ASIN or name, or select from the dropdown
            above to view its price and rating trends.
          </p>
          <p className="text-sm text-blue-600 mt-2">
            💡 Tip: You can search by ASIN (like "B013HD3INW") or type part of
            the product name.
          </p>
        </div>
      )}
    </div>
  );
};

export default Trends;
