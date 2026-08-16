import api from "../../../api/axios";

export const fetchQuotationsAPI = (params, signal) => api.get("/api/quotations", { params, signal });
export const fetchQuotationAPI = (id) => api.get(`/api/quotations/${id}`);
export const createQuotationAPI = (payload) => api.post("/api/quotations", payload);
export const updateQuotationAPI = (id, payload) => api.put(`/api/quotations/${id}`, payload);
export const submitQuotationAPI = (id) => api.post(`/api/quotations/${id}/submit`);
export const approveQuotationAPI = (id) => api.post(`/api/quotations/${id}/approve`);
export const rejectQuotationAPI = (id, reason) => api.post(`/api/quotations/${id}/reject`, { reason });
export const reopenQuotationAPI = (id) => api.post(`/api/quotations/${id}/reopen`);
export const deleteQuotationAPI = (id) => api.delete(`/api/quotations/${id}`);
