import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login, isAuthenticated, setToken, getUserProfile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div 
      className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background"
      style={{
        ...(theme.authBackgroundImage && {
          backgroundImage: `url(${theme.authBackgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'bottom',
          backgroundRepeat: 'no-repeat'
        })
      }}
    >
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] px-6 sm:px-2">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to {theme.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Click below to sign in to your account
          </p>
        </div>
        <div className="flex flex-col space-y-4">
          <Button onClick={login} className="w-full">
            Sign In
          </Button>
          {/* <Button onClick={handleSkipLogin} variant="outline" className="w-full">
            Skip Login
          </Button> */}
        </div>
      </div>
    </div>
  );
}
