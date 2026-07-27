// modules/task/services/task.api.js
import api from "../../../api/axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const getTasksAPI = () =>
  api.get(`${BASE_URL}/api/tasks`);

export const getEmployeesAPI = () =>
  api.get(`${BASE_URL}/api/employees`);

export const createTaskAPI = (data) =>
  api.post(`${BASE_URL}/api/tasks`, data);

export const updateTaskAPI = (id, data) =>
  api.put(`${BASE_URL}/api/tasks/${id}`, data);

export const deleteTaskAPI = (id) =>
  api.delete(`${BASE_URL}/api/tasks/${id}`);