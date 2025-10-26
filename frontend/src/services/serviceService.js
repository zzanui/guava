// src/services/serviceService.js
import api from "./api";

// 메모리 캐시: 간단한 런타임 캐시로 동일 세션 내 중복 호출 방지
const detailCache = new Map(); // key: serviceId(string) -> detail object

export const getServices = async ({ q, category, minPrice, maxPrice } = {}) => {
  const params = {};
  if (category) params.category = category;
  if (q) params.name = q; // backend filters: name icontains
  if (typeof minPrice === "number") params.price_min = minPrice;
  if (typeof maxPrice === "number") params.price_max = maxPrice;
  const response = await api.get("/api/services/", { params });
  return response.data;
};

export const getServiceDetail = async (serviceId) => {
  const key = String(serviceId);
  if (detailCache.has(key)) return detailCache.get(key);
  try {
    const response = await api.get(`/api/services/${serviceId}/`);
    const data = response.data;
    detailCache.set(key, data);
    return data;
  } catch (error) {
    // 상세 조회 실패 시 리스트 + 플랜 조합 폴백
    const [servicesResp, plansResp] = await Promise.all([
      api.get("/api/services/"),
      api.get(`/api/services/${serviceId}/plans/`),
    ]);
    const services = Array.isArray(servicesResp?.data) ? servicesResp.data : [];
    const service = services.find((s) => String(s?.id) === String(serviceId)) || null;
    const plans = Array.isArray(plansResp?.data) ? plansResp.data : [];
    const data = {
      id: service?.id ?? (Number.isNaN(Number(serviceId)) ? serviceId : Number(serviceId)),
      name: service?.name ?? "",
      category: service?.category ?? null,
      logo_url: service?.logo_url ?? null,
      official_link: service?.official_link ?? null,
      plans,
    };
    detailCache.set(key, data);
    return data;
  }
};

export const getComparison = async (ids = []) => {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const params = { ids: ids.join(",") };
  const { data } = await api.get("/api/services/compare/", { params });
  return Array.isArray(data) ? data : [];
};