// src/services/serviceService.js
import api from "./api";

export const getServices = async (params) => {
  try {
    const response = await api.get("/api/services/", {
      params: params,
    });

        console.log("반환된 데이터", response.data)
    return response.data || [];

  } catch (error) {
        console.error("API getServices 에러:", error);
    return [];
  }
};

export const getServiceDetail = async (serviceId) => {
    try {
        const response = await api.get(`/api/services/${serviceId}/`);


        console.log("반환된 데이터", response.data)
        return response.data || [];
    } catch (error) {

        console.error("API getServices 에러:", error);
      return [];
    }
};