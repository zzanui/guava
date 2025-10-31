// src/services/subscriptionService.js
import api from "./api";

export const getSubscriptions = async () => {
  const response = await api.get(`/api/my/subscriptions/`);
  // ✅ 올바른 접근
  console.log('=== 전체 응답 ===');
  console.log(response.data);

  console.log('=== plan_service_category ===');
  console.log(response.data.results[0]?.plan_service_category);  // ← results 추가!
  return response.data;
};

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const addSubscription = async (
  planId,
  {
    price_override,
    start_date,
    next_payment_date,
    custom_memo = "",
  } = {}
) => {
  const payload = { plan: Number(planId) };
  if (start_date) payload.start_date = start_date;
  if (next_payment_date) payload.next_payment_date = next_payment_date;
  // 메모는 항상 문자열로 전송 (null/undefined 방지)
  payload.custom_memo = String(custom_memo ?? "");
  if (typeof price_override === "number") payload.price_override = price_override;
  return api.post(`/api/my/subscriptions/`, payload);
};

export const deleteSubscription = async (id) => {
  return api.delete(`/api/my/subscriptions/${id}/`);
};

export const updateSubscription = async (id, payload) => {
  // payload: { start_date?: string, next_payment_date?: string, custom_memo?: string, price_override?: number }
  return api.patch(`/api/my/subscriptions/${id}/`, payload);
};
