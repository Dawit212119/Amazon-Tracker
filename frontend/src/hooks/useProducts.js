import { useState, useEffect, useRef } from "react";
import { productService } from "../services/api";

export const useProducts = (limit = 50, autoRefresh = false) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refreshIntervalRef = useRef(null);

  const fetchProducts = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await productService.getAll(limit);
      setProducts(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    // Auto-refresh every 3 seconds if enabled
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchProducts(false); // Don't show loading spinner on auto-refresh
      }, 3000);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [limit, autoRefresh]);

  return {
    products,
    loading,
    error,
    refetch: () => fetchProducts(true),
  };
};
