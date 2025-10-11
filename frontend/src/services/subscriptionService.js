// src/services/subscriptionService.js
import api from "./api";

export const getSubscriptions = async (userId) => {
  const response = await api.get(`/subscriptions/`, {
    params: { user: userId },
  });
  return response.data;
};

export const addSubscription = async (planId) => {
  return api.post("/subscriptions/", { plan_id: planId });
};

export const deleteSubscription = async (id) => {
  return api.delete(`/subscriptions/${id}/`);
};