import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: () => void;
  logout: () => void;
  setToken: (token: string) => void;
  getUserProfile: () => Promise<ISsoUser | null>;
}

export interface ISsoUser {
  id: string
  name?: string
  email: string
  profileImageUrl: string | null
  createdAt: string
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Initialize authentication state from localStorage
    const storedToken = localStorage.getItem("auth_token");
    return !!storedToken;
  });
  const [token, setToken] = useState<string | null>(() => {
    // Initialize token from localStorage
    return localStorage.getItem("auth_token");
  });

  // Add effect to handle localStorage changes
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken && !isAuthenticated) {
      setToken(storedToken);
      setIsAuthenticated(true);
    } else if (!storedToken && isAuthenticated) {
      setToken(null);
      setIsAuthenticated(false);
    }
  }, [isAuthenticated]);
  
  // Listen for storage events to sync auth state across components
  useEffect(() => {
    const handleStorageChange = () => {
      const storedToken = localStorage.getItem("auth_token");
      if (storedToken && !isAuthenticated) {
        setToken(storedToken);
        setIsAuthenticated(true);
      } else if (!storedToken && isAuthenticated) {
        setToken(null);
        setIsAuthenticated(false);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isAuthenticated]);

  const login = () => {
    const ssoUrl = import.meta.env.VITE_SSO_SERVER_URL;
    const clientId = import.meta.env.VITE_CLIENT_ID;
    const redirectUrl = import.meta.env.VITE_REDIRECT_URL;

    const loginUrl = `${ssoUrl}/login?token=${clientId}&redirect_url=${redirectUrl}`;
    
    const link = document.createElement('a');
    link.href = loginUrl;
    // link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
};

  const logout = () => {
    // if(!window.confirm("Are you sure you want to logout?")) return;
    localStorage.clear();
    setToken(null);
    setIsAuthenticated(false);
    
    // reload the page after 1.5 seconds
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  // get user profile data
  const getUserProfile = async (): Promise<ISsoUser | null> => {
    const ssoUrl = import.meta.env.VITE_SSO_SERVER_URL;
    try {
      const response = await fetch(`${ssoUrl}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const json = await response.json();
      console.log("user from sso:", json);
      return json;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  const handleSetToken = (newToken: string) => {
    localStorage.setItem("auth_token", newToken);
    setToken(newToken);
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        token,
        login,
        logout,
        setToken: handleSetToken,
        getUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
