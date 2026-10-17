import api from "../../../api/axios";

export const loginRequest = async (credentials) => {
  const response = await api.post("/api/auth/login", credentials, { skipAuth: true });
  return response.data;
};

export const getCurrentUserRequest = async () => {
  const response = await api.get("/api/auth/me");
  return response.data;
};
