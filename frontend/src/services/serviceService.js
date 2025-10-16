// src/services/serviceService.js
import api from "./api";

export const getServices = async (params) => {
  try {
    const response = await api.get("/api/services/", {
      params: params,
    });

    // 💡 핵심 수정: response.data.results가 없으면(undefined), 대신 빈 배열([])을 반환
    console.log("반환된 데이터", response.data)
    return response.data || [];

  } catch (error) {
    console.error("API getServices 에러:", error);
    // 에러가 발생했을 때도 빈 배열을 반환하여 앱의 다운을 막습니다.
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
      // 에러가 발생했을 때도 빈 배열을 반환하여 앱의 다운을 막습니다.
      return [];
    }
};