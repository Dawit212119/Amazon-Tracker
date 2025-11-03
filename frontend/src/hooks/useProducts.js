import { useState, useEffect, useRef } from "react";
import { productService } from "../services/api";

export const useProducts = (
  limit = 50,
  autoRefresh = false,
  searchTerm = "",
  disableAuto = false
) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refreshIntervalRef = useRef(null);

  // Merge new results into existing list to avoid blink (stale-while-revalidate)
  const reconcileByAsin = (previousList, nextList) => {
    const asinToPrev = new Map(previousList.map((p) => [p.asin, p]));
    const merged = nextList.map((next) => {
      const prev = asinToPrev.get(next.asin);
      return prev ? { ...prev, ...next } : next;
    });
    return merged;
  };

  const fetchProducts = async (showLoading = true, replace = false) => {
    try {
      // If no search term, do not fetch; clear list and stop loading
      if (!searchTerm || searchTerm.trim().length === 0) {
        setProducts([]);
        setLoading(false);
        setError(null);
        return;
      }
      if (showLoading) setLoading(true);
      const data = await productService.getAll(limit, searchTerm);
      // Replace products entirely when search term changes (replace=true)
      // Merge products only during auto-refresh for the same search term
      setProducts((prev) => (replace ? data : reconcileByAsin(prev, data)));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    // Clear products immediately when search term changes
    if (!searchTerm || searchTerm.trim().length === 0) {
      setProducts([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (!disableAuto) {
      // Replace products when search term changes (new search)
      fetchProducts(true, true);
    }

    // Auto-refresh every 3 seconds if enabled
    if (
      !disableAuto &&
      autoRefresh &&
      searchTerm &&
      searchTerm.trim().length > 0
    ) {
      refreshIntervalRef.current = setInterval(() => {
        fetchProducts(false, false); // Merge during auto-refresh (same search term)
      }, 3000);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [limit, autoRefresh, searchTerm, disableAuto]);

  return {
    products,
    loading,
    error,
    refetch: () => fetchProducts(true, true), // Replace on manual refetch
  };
};
