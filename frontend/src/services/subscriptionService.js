// src/services/subscriptionService.js
import api from "./api";

export const getSubscriptions = async () => {
  const response = await api.get(`api/my/subscriptions/`);
  return response.data;
};

export const addSubscription = async (planId) => {
  return api.post("api/my/subscriptions/", { plan: planId });
};

export const deleteSubscription = async (id) => {
  return api.delete(`api/my/subscriptions/${id}/`);
};

