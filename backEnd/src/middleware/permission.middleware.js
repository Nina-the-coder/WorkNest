/**
 * Permission-based Authorization Middleware
 * Checks if authenticated user has required permission
 * Must be used AFTER verifyToken middleware (req.user must exist)
 */

const AppError = require("../utils/AppError");
const { getPermissionsForRole } = require("../utils/rolePermissions");

/**
 * Middleware factory to require specific permissions
 * @param {...string} requiredPermissions - One or more permissions required
 * @returns {Function} Express middleware
 *
 * @example
 * router.get("/customers", requirePermission(PERMISSIONS.CUSTOMER_READ), controller);
 * router.post("/customers", requirePermission(PERMISSIONS.CUSTOMER_CREATE), controller);
 */
const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    // Verify user exists (should be set by verifyToken middleware)
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Get user's permissions based on role
    const userPermissions = req.user.permissions || [];

    // Check if user has at least one of the required permissions
    const hasRequiredPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasRequiredPermission) {
      return res.status(403).json({
        message: "Insufficient permissions for this action",
        requiredPermissions,
      });
    }

    next();
  };
};

module.exports = { requirePermission };
