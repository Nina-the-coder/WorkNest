export const getHomePath = (role) => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "employee") return "/employee/dashboard";
  return "/unauthorized";
};

// Only validated server identity is cached; cached roles never authorize a route.
export const normalizeSessionUser = (user) => {
  if (!user || typeof user._id !== "string" || !["admin", "employee"].includes(user.role)) {
    throw new Error("Unable to verify your account. Please try again.");
  }
  const safeUser = {
    _id: user._id,
    role: user.role,
    permissions: Array.isArray(user.permissions)
      ? user.permissions.filter((permission) => typeof permission === "string")
      : [],
  };
  for (const field of ["name", "email", "empId", "phone", "status", "createdAt"]) {
    if (typeof user[field] === "string") safeUser[field] = user[field];
  }
  return safeUser;
};
