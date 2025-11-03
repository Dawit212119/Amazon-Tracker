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
      if (!searchTerm || searchTerm.trim().length === 0) {
        setProducts([]);
        setLoading(false);
        setError(null);
        return;
      }
      if (showLoading) setLoading(true);
      const data = await productService.getAll(limit, searchTerm);
      setProducts((prev) => (replace ? data : reconcileByAsin(prev, data)));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length === 0) {
      setProducts([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (!disableAuto) {
      fetchProducts(true, true);
    }

    if (
      !disableAuto &&
      autoRefresh &&
      searchTerm &&
      searchTerm.trim().length > 0
    ) {
      refreshIntervalRef.current = setInterval(() => {
        fetchProducts(false, false);
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
    refetch: () => fetchProducts(true, true),
  };
};
