// modules/customer/services/customer.api.js
import api from "../../../api/axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const getCustomersAPI = () =>
  api.get(`${BASE_URL}/api/customers`);

export const createCustomerAPI = (data) =>
  api.post(`${BASE_URL}/api/customers`, data);

export const updateCustomerAPI = (id, data) =>
  api.put(`${BASE_URL}/api/customers/${id}`, data);

export const deleteCustomerAPI = (id) =>
  api.delete(`${BASE_URL}/api/customers/${id}`);