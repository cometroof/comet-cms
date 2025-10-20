import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ROLES } from "@/pages/users/types";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: number[];
}

/**
 * A component that protects routes based on user authentication and role
 * @param {ReactNode} children - The child components to render if access is granted
 * @param {number[]} allowedRoles - Array of role IDs that are allowed to access this route
 */
const ProtectedRoute = ({
  children,
  allowedRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN],
}: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user doesn't have the required role, redirect to dashboard
  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // If all checks pass, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
