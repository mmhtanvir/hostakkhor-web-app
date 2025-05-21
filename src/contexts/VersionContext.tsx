import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

interface VersionContextType {
  checkVersion: () => boolean;
  storeCurrentVersion: () => void;
}

const VersionContext = createContext<VersionContextType | null>(null);

export const VersionProvider = ({ children }: { children: React.ReactNode }) => {
  const { logout } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Get the current app version from environment variable
  const currentAppVersion = import.meta.env.VITE_APP_VERSION || "1.0.0";
  
  // Function to check if the stored version matches the current version
  const checkVersion = (): boolean => {
    const storedVersion = localStorage.getItem("app_version");
    
    // If no version is stored or versions don't match, return false
    if (!storedVersion || storedVersion !== currentAppVersion) {
      return false;
    }
    
    return true;
  };
  
  // Function to store the current version in localStorage
  const storeCurrentVersion = () => {
    localStorage.setItem("app_version", currentAppVersion);
  };
  
  // Check version on app initialization
  useEffect(() => {
    // Skip version check if we're on the callback page
    const isCallbackPage = window.location.pathname.includes('/auth/callback');
    
    if (isCallbackPage) {
      setIsInitializing(false);
      return;
    }
    
    const isVersionValid = checkVersion();
    
    // If version is invalid, log the user out
    if (!isVersionValid && localStorage.getItem("auth_token")) {
      console.log("App version changed or not found. Logging out...");
      logout();
    }
    
    setIsInitializing(false);
  }, [logout]);
  
  return (
    <VersionContext.Provider
      value={{
        checkVersion,
        storeCurrentVersion
      }}
    >
      {children}
    </VersionContext.Provider>
  );
};

export const useVersion = () => {
  const context = useContext(VersionContext);
  if (!context) {
    throw new Error("useVersion must be used within a VersionProvider");
  }
  return context;
};
