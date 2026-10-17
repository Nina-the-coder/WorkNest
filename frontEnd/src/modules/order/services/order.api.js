import api from "../../../api/axios";

export const getOrdersAPI = () => api.get("/api/orders");
export const getOrderAPI = (id) => api.get(`/api/orders/${encodeURIComponent(id)}`);
export const deleteOrderAPI = (id) => api.delete(`/api/orders/${encodeURIComponent(id)}`);
export const updateOrderStatusAPI = (id, status, expectedStatus, reason) =>
  api.put(`/api/orders/${encodeURIComponent(id)}`, { status, expectedStatus, ...(reason ? { reason } : {}) });
export const downloadOrderAPI = (id, type) =>
  api.get(`/api/orders/${encodeURIComponent(id)}/download-${type === "csv" ? "csv" : "pdf"}`, { responseType: "blob" });
