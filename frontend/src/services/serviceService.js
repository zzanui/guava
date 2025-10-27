// src/services/serviceService.js
import api from "./api";

// 메모리 캐시: 간단한 런타임 캐시로 동일 세션 내 중복 호출 방지
const detailCache = new Map(); // key: serviceId(string) -> detail object

export const getServices = async ({ q, category, categories, minPrice, maxPrice, sort } = {}) => {
  const params = {};
  // 검색어
  if (q) params.q = q;
  // 카테고리: 단일/다중 모두 허용 → 백엔드 'categories'
  const catList = [];
  if (Array.isArray(categories)) catList.push(...categories.map(String).filter(Boolean));
  if (category) catList.push(String(category));
  if (catList.length > 0) params.categories = catList.join(',');
  // 가격 범위: 백엔드 'min_price'/'max_price'
  if (typeof minPrice === "number") params.min_price = minPrice;
  if (typeof maxPrice === "number") params.max_price = maxPrice;
  // 정렬: price/name 만 지원
  if (typeof sort === "string" && sort) {
    let s;
    if (sort === "priceAsc" || sort === "price") s = "price";
    else if (sort === "priceDesc") s = "-price";
    else if (sort === "nameAsc" || sort === "name") s = "name";
    else if (sort === "nameDesc") s = "-name";
    if (s) params.sort = s;
  }
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
  // 백엔드 호환: 숫자만 정규화하고 plan_id/ids 모두 전송 (최대 5개)
  const normalized = ids
    .map((v) => Number(String(v).trim()))
    .filter((n) => Number.isFinite(n))
    .slice(0, 5);
  const joined = normalized.join(",");
  if (!joined) return [];

  const params = { plan_id: joined, ids: joined };
  try {
    const { data } = await api.get("/api/services/compare/", { params });
    return Array.isArray(data) ? data : [];
  } catch (err) {
    // 서버 비교 API가 4xx/5xx로 실패 시 폴백: 개별 상세를 병렬 호출하여 조합
    try {
      const results = await Promise.allSettled(
        normalized.map((id) => api.get(`/api/services/${id}/`).then((r) => r.data))
      );
      const ok = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value);
      return ok;
    } catch (_) {
      throw err;
    }
  }
};