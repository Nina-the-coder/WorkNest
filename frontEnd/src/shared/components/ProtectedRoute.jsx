import { Navigate } from "react-router-dom";
import { useAuth } from "../../modules/auth/useAuth";
import SessionFeedback from "../../modules/auth/SessionFeedback";

const ProtectedRoute = ({ children, allowedRoles, requiredPermissions }) => {
  const { user, status, error, refreshSession, logout } = useAuth();

  if (status === "loading" || status === "error") {
    return <SessionFeedback error={error} onRetry={refreshSession} onLogout={logout} />;
  }

  // Not authenticated: redirect to login
  if (status !== "authenticated" || !user) {
    return <Navigate to="/" replace />;
  }

  // Check role if specified
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check permissions if specified
  if (requiredPermissions) {
    const userPermissions = user.permissions || [];
    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
    if (!hasAllPermissions) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
