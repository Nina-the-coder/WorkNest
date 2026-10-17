import { useContext } from "react";
import { AuthContext } from "./auth.context";

export const useAuth = () => {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth requires AuthProvider");
  return auth;
};
