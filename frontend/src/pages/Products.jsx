import { useState, useEffect } from "react";
import { useProducts } from "../hooks/useProducts";
import ProductCard from "../components/ProductCard";
import RefreshButton from "../components/RefreshButton";

const Products = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState({ min: "", max: "" });
  const [ratingFilter, setRatingFilter] = useState({ min: "" });
  const { products, loading, error, refetch } = useProducts(
    100,
    true,
    searchTerm
  ); // Enable auto-refresh

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.asin.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPrice =
      (!priceFilter.min || product.price >= parseFloat(priceFilter.min)) &&
      (!priceFilter.max || product.price <= parseFloat(priceFilter.max));

    const matchesRating =
      !ratingFilter.min ||
      !product.rating ||
      product.rating >= parseFloat(ratingFilter.min);

    return matchesSearch && matchesPrice && matchesRating;
  });

  if (loading && products.length === 0) {
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
        <RefreshButton onRefresh={refetch} searchTerm={searchTerm} />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Title or ASIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {filteredProducts.length} of {products.length} products
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-500 text-lg">
            No products found matching your filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
