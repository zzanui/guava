// src/services/serviceService.js
import api from "./api";

export const getServices = async ({ q, category, minPrice, maxPrice } = {}) => {
  const params = {};
  if (category) params.category = category;
  if (q) params.name = q; // backend filters: name icontains
  if (typeof minPrice === "number") params.price_min = minPrice; // RangeFilter(price)
  if (typeof maxPrice === "number") params.price_max = maxPrice; // RangeFilter(price)
  const response = await api.get("/api/services/", { params });
  return response.data;
};

export const getServiceDetail = async (serviceId) => {
  const response = await api.get(`/api/services/${serviceId}/`);
  return response.data;
};

export const getComparison = async (ids = []) => {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const params = { ids: ids.join(',') };
  const { data } = await api.get('/api/services/compare/', { params });
  return Array.isArray(data) ? data : [];
};