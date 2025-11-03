import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const productService = {
  getAll: async (limit = 50, search = "") => {
    const q = (search || "").trim();
    if (q.length === 0) {
      return [];
    }
    const url = `/products?limit=${limit}&q=${encodeURIComponent(q)}`;
    const response = await api.get(url);
    return response.data;
  },

  getAllProducts: async (limit = 100) => {
    // Fetch all products without search filter (for dropdowns/lists)
    const response = await api.get(`/products?limit=${limit}`);
    return response.data;
  },

  getByAsin: async (asin) => {
    const response = await api.get(`/products/${asin}`);
    return response.data;
  },

  searchProducts: async (query) => {
    const response = await api.get(
      `/products/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  },

  getStats: async () => {
    const response = await api.get("/stats");
    return response.data;
  },

  getTopChanges: async () => {
    const response = await api.get("/top-changes");
    return response.data;
  },

  getPriceAlerts: async () => {
    const response = await api.get("/products/alerts/price");
    return response.data;
  },

  triggerRefresh: async (keywords = "") => {
    const payload = keywords.trim() ? { keywords: keywords.trim() } : {};
    const response = await api.post("/refresh", payload);
    return response.data;
  },

  getProgress: async (jobId) => {
    const response = await api.get(`/refresh/progress/${jobId}`);
    return response.data;
  },
};

export default api;
