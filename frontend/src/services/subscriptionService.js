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
    startDate,
    nextPaymentDate,
    memo = "",
    priceOverride,
  } = {}
) => {
  const now = new Date();
  const start = startDate ? new Date(startDate) : now;
  const next = nextPaymentDate
    ? new Date(nextPaymentDate)
    : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  const payload = {
    plan: planId,
    start_date: toISODate(start),
    next_payment_date: toISODate(next),
    custom_memo: memo,
  };
  if (typeof priceOverride === "number") payload.price_override = priceOverride;
  return api.post(`/api/my/subscriptions/`, payload);
};

export const deleteSubscription = async (id) => {
  return api.delete(`/api/my/subscriptions/${id}/`);
};
