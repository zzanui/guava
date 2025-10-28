// src/services/subscriptionService.js
import api from "./api";

export const getSubscriptions = async () => {
  const response = await api.get(`/api/my/subscriptions/`);
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
  // 백엔드가 null을 허용하더라도, 빈 값은 공백 문자열로 정규화
  if (custom_memo !== undefined) payload.custom_memo = custom_memo ?? "";
  if (typeof price_override === "number") payload.price_override = price_override;
  return api.post(`/api/my/subscriptions/`, payload);
};

export const deleteSubscription = async (id) => {
  return api.delete(`/api/my/subscriptions/${id}/`);
};
