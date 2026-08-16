/**
 * Frontend Permission Utilities
 * Helpers for checking permissions on the frontend
 * Reads from user object stored in localStorage
 */

/**
 * Get current user from localStorage
 * @returns {Object|null} User object with permissions array
 */
export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    return null;
  }
};

/**
 * Check if current user has a specific permission
 * @param {string} permission - Permission to check
 * @returns {boolean} True if user has permission
 */
export const hasPermission = (permission) => {
  const user = getCurrentUser();
  if (!user || !user.permissions) return false;
  return user.permissions.includes(permission);
};

/**
 * Check if current user has ANY of the provided permissions
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} True if user has at least one permission
 */
export const hasAnyPermission = (permissions) => {
  const user = getCurrentUser();
  if (!user || !user.permissions) return false;
  return permissions.some((permission) =>
    user.permissions.includes(permission),
  );
};

/**
 * Check if current user has ALL of the provided permissions
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} True if user has all permissions
 */
export const hasAllPermissions = (permissions) => {
  const user = getCurrentUser();
  if (!user || !user.permissions) return false;
  return permissions.every((permission) =>
    user.permissions.includes(permission),
  );
};

/**
 * Get user's role
 * @returns {string|null} User role or null
 */
export const getUserRole = () => {
  const user = getCurrentUser();
  return user ? user.role : null;
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if token and user exist
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  const user = getCurrentUser();
  return !!(token && user);
};
