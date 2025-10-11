// src/services/serviceService.js
import api from "./api";

export const getServices = async (category) => {
  const response = await api.get("/services/", {
    params: { category },
  });
  return response.data;
};

export const getServiceDetail = async (serviceId) => {
  const response = await api.get(`/services/${serviceId}/`);
  return response.data;
};