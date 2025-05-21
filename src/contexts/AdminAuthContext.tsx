import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { useUser } from "@/hooks/useUser";

interface AdminAuthContextType {
  isAdmin: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const { isAuthenticated } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if the user's email is the admin email
      setIsAdmin(user.email === "admin@hostakkhor.com");
    } else {
      setIsAdmin(false);
    }
  }, [isAuthenticated, user]);

  return (
    <AdminAuthContext.Provider
      value={{
        isAdmin
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};
