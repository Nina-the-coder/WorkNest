import api from "../../../api/axios";

export const getTasksAPI = () => api.get("/api/tasks");
export const getTaskAPI = (id) => api.get(`/api/tasks/${encodeURIComponent(id)}`);
export const getEmployeesAPI = () => api.get("/api/employees");
export const createTaskAPI = (data) => api.post("/api/tasks", data);
export const updateTaskAPI = (id, data) => api.put(`/api/tasks/${encodeURIComponent(id)}`, data);
export const updateTaskStatusAPI = (id, status) =>
  api.patch(`/api/tasks/${encodeURIComponent(id)}/status`, { status });
export const deleteTaskAPI = (id) => api.delete(`/api/tasks/${encodeURIComponent(id)}`);
