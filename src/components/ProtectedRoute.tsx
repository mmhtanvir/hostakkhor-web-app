import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Save the current location to redirect back after login
    const currentPath = location.pathname + location.search + location.hash;
    sessionStorage.setItem('redirectAfterLogin', currentPath);
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
};
