import { useCallback, useEffect, useRef, useState } from "react";
import { AuthContext } from "./auth.context";
import { getCurrentUserRequest, loginRequest } from "./services/auth.api";
import { clearStoredSession, readToken, SESSION_EXPIRED_EVENT, storeSession } from "./auth.session";
import { normalizeSessionUser } from "./auth.util";

const anonymousSession = { user: null, status: "anonymous", error: null };

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState({ user: null, status: "loading", error: null });
  // Logout, account switches and newer checks invalidate earlier responses.
  const requestVersion = useRef(0);

  const logout = useCallback(() => {
    requestVersion.current += 1;
    clearStoredSession();
    setSession(anonymousSession);
  }, []);

  const refreshSession = useCallback(async ({ background = false } = {}) => {
    const version = ++requestVersion.current;
    const token = readToken();
    if (!token) {
      localStorage.removeItem("user");
      setSession(anonymousSession);
      return null;
    }
    if (!background) setSession({ user: null, status: "loading", error: null });

    try {
      const response = await getCurrentUserRequest();
      if (version !== requestVersion.current || token !== readToken()) return null;
      const user = normalizeSessionUser(response.user);
      storeSession(token, user);
      setSession({ user, status: "authenticated", error: null });
      return user;
    } catch (error) {
      if (version !== requestVersion.current || token !== readToken()) return null;
      if (error.response?.status === 401) {
        logout();
        return null;
      }
      // A network/server failure is not proof that the token expired.
      setSession({ user: null, status: "error", error: "We couldn't verify your session. Please try again." });
      return null;
    }
  }, [logout]);

  const login = useCallback(async (credentials) => {
    const version = ++requestVersion.current;
    const response = await loginRequest(credentials);
    if (version !== requestVersion.current) return null;
    if (typeof response.token !== "string" || !response.token) {
      throw new Error("Unable to sign in. Please try again.");
    }
    storeSession(response.token, null);
    return refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const expireSession = () => {
      requestVersion.current += 1;
      setSession(anonymousSession);
    };
    const syncStorage = (event) => {
      if (event.key === "token" || event.key === "user" || event.key === null) {
        void refreshSession();
      }
    };
    const recheckOnFocus = () => {
      if (readToken() && document.visibilityState !== "hidden") {
        void refreshSession({ background: true });
      }
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, expireSession);
    window.addEventListener("storage", syncStorage);
    window.addEventListener("focus", recheckOnFocus);
    void refreshSession();
    return () => {
      requestVersion.current += 1;
      window.removeEventListener(SESSION_EXPIRED_EVENT, expireSession);
      window.removeEventListener("storage", syncStorage);
      window.removeEventListener("focus", recheckOnFocus);
    };
  }, [refreshSession]);

  return (
    <AuthContext.Provider value={{ ...session, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};
