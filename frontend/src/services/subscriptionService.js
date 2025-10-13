// src/services/subscriptionService.js
import api from "./api";

export const getSubscriptions = async () => {
  const response = await api.get(`/my/subscriptions/`);
  return response.data;
};

export const addSubscription = async (planId) => {
  return api.post("/my/subscriptions/", { plan_id: planId });
};

export const deleteSubscription = async (id) => {
  return api.delete(`/my/subscriptions/${id}/`);
};