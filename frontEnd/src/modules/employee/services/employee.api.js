// modules/employee/services/employee.api.js
import api from "../../../api/axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const getEmployeesAPI = () => {
  return api.get(`${BASE_URL}/api/employees`);
};

export const createEmployeeAPI = (data) => {
  return api.post(`${BASE_URL}/api/employees`, data);
};

export const updateEmployeeAPI = (id, data, token) => {
  return api.put(`${BASE_URL}/api/employees/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const deleteEmployeeAPI = (id) => {
  return api.delete(`${BASE_URL}/api/employees/${id}`);
};