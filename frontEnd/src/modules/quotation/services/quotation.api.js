// modules/quotation/services/quotation.api.js
import api from "../../../api/axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const fetchQuotationsAPI = (params, signal) =>
  api.get(`${BASE_URL}/api/quotations`, {
    params,
    signal,
  });

export const updateQuotationStatusAPI = (id, status) =>
  api.put(`${BASE_URL}/api/quotations/${id}`, { status });

export const deleteQuotationAPI = (id) =>
  api.delete(`${BASE_URL}/api/quotations/${id}`);

export const createOrderFromQuotationAPI = (payload) =>
  api.post(`${BASE_URL}/api/order`, payload);