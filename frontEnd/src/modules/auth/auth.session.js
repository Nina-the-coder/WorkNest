export const SESSION_EXPIRED_EVENT = "worknest:session-expired";

export const readToken = () => localStorage.getItem("token");

export const storeSession = (token, user) => {
  localStorage.setItem("token", token);
  if (user) localStorage.setItem("user", JSON.stringify(user));
  else localStorage.removeItem("user");
};

export const clearStoredSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
};
