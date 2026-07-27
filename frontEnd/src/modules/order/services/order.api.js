// modules/order/services/order.api.js
import api from "../../../api/axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const getOrdersAPI = () =>
  api.get(`${BASE_URL}/api/orders`);

export const deleteOrderAPI = (id) =>
  api.delete(`${BASE_URL}/api/orders/${id}`);

export const updateOrderStatusAPI = (id, status) =>
  api.put(`${BASE_URL}/api/orders/${id}`, { status });

export const downloadOrderAPI = (id, type) => {
  const endpoint =
    type === "csv"
      ? `${BASE_URL}/api/orders/${id}/download-csv`
      : `${BASE_URL}/api/orders/${id}/download-pdf`;

  return api.get(endpoint, { responseType: "blob" });
};