import { useState, useRef } from "react";
import { useProducts } from "../hooks/useProducts";
import ProductCard from "../components/ProductCard";
import RefreshButton from "../components/RefreshButton";

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState({ min: "", max: "" });
  const [ratingFilter, setRatingFilter] = useState({ min: "" });
  // Debounce functionality commented out to avoid multiple requests to Amazon's anti-bot system
  // const [debouncedSearch, setDebouncedSearch] = useState("");
  const [scrapeMsg, setScrapeMsg] = useState("");
  const [scraping, setScraping] = useState(false);
  const pollRef = useRef(null);

  // Debounce search term commented out - see above comment
  // useEffect(() => {
  //   const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
  //   return () => clearTimeout(t);
  // }, [searchTerm]);

  const { products, loading, error, refetch } = useProducts(
    100,
    true,
    searchTerm // Use searchTerm directly, no debounce
  ); // Server-side search

  const filteredProducts = products.filter((product) => {
    const matchesPrice =
      (!priceFilter.min || product.price >= parseFloat(priceFilter.min)) &&
      (!priceFilter.max || product.price <= parseFloat(priceFilter.max));

    const matchesRating =
      !ratingFilter.min ||
      !product.rating ||
      product.rating >= parseFloat(ratingFilter.min);

    // Server already applied searchTerm; we only apply price/rating filters client-side
    return matchesPrice && matchesRating;
  });

  if (loading && searchTerm && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-500">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading products: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold text-gray-900">All Products</h2>
        <RefreshButton onRefresh={refetch} />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Title or ASIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={async () => {
                  const kw = (searchTerm || "").trim();
                  if (!kw) {
                    setScrapeMsg("Enter a search term to scrape.");
                    return;
                  }
                  try {
                    setScraping(true);
                    setScrapeMsg("Starting scrape...");
                    const { productService } = await import("../services/api");
                    const res = await productService.triggerRefresh(kw);
                    if (res.jobId) {
                      setScrapeMsg("Scraping... This may take a moment.");
                      if (pollRef.current) clearInterval(pollRef.current);
                      pollRef.current = setInterval(async () => {
                        try {
                          const prog = await productService.getProgress(
                            res.jobId
                          );
                          if (prog.currentKeyword) {
                            setScrapeMsg(
                              `Scraping "${prog.currentKeyword}" - Page ${
                                prog.currentPage || 1
                              }... (${prog.productsProcessed || 0} products)`
                            );
                          }
                          if (prog.productsProcessed > 0) {
                            refetch();
                          }
                          if (prog.completed) {
                            clearInterval(pollRef.current);
                            setScraping(false);
                            setScrapeMsg(
                              prog.status === "completed"
                                ? `Completed: ${
                                    prog.productsProcessed || 0
                                  } products.`
                                : `Failed: ${prog.error || "Unknown error"}`
                            );
                            refetch();
                            setTimeout(() => setScrapeMsg(""), 4000);
                          }
                        } catch (e) {
                          clearInterval(pollRef.current);
                          setScraping(false);
                        }
                      }, 2000);
                    } else {
                      setScraping(false);
                      setScrapeMsg(res.message || "Scrape started");
                      setTimeout(() => setScrapeMsg(""), 3000);
                    }
                  } catch (e) {
                    setScraping(false);
                    setScrapeMsg("Failed to start scraping.");
                  }
                }}
                disabled={scraping}
                className={`px-4 py-2 rounded-md text-white ${
                  scraping
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {scraping ? "Scraping..." : "Search & Scrape"}
              </button>
            </div>
            {scrapeMsg && (
              <p className="mt-2 text-sm text-gray-600">{scrapeMsg}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Price
            </label>
            <input
              type="number"
              placeholder="$0"
              value={priceFilter.min}
              onChange={(e) =>
                setPriceFilter({ ...priceFilter, min: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Price
            </label>
            <input
              type="number"
              placeholder="$1000"
              value={priceFilter.max}
              onChange={(e) =>
                setPriceFilter({ ...priceFilter, max: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Rating
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              placeholder="0.0"
              value={ratingFilter.min}
              onChange={(e) =>
                setRatingFilter({ ...ratingFilter, min: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Empty search hint */}
      {(!searchTerm || searchTerm.trim().length === 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            Start by typing a product name or ASIN above to load results.
          </p>
        </div>
      )}

      {/* Results count */}
      {searchTerm && (
        <div className="text-sm text-gray-600">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      )}

      {/* Product Grid */}
      {searchTerm && filteredProducts.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-500 text-lg">
            No products found matching your filters.
          </p>
        </div>
      ) : (
        searchTerm && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default Products;
