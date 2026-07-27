// modules/product/services/product.api.js
import api from "../../../api/axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const getProductsAPI = () =>
  api.get(`${BASE_URL}/api/products`);

export const createProductAPI = (formData) =>
  api.post(`${BASE_URL}/api/products`, formData);

export const updateProductAPI = (id, formData) =>
  api.put(`${BASE_URL}/api/products/${id}`, formData);

export const deleteProductAPI = (id) =>
  api.delete(`${BASE_URL}/api/products/${id}`);