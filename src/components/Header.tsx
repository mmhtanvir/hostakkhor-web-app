import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import AvatarPlaceholderImage from "@/assets/avatar placceholder.png";

export const Header = () => {
  const { user, clearUser } = useUser();
  const { logout, login, isAuthenticated } = useAuth();
  const { isAdmin } = useAdminAuth();
  const navigate = useNavigate();
  
  // Force re-render when auth state changes
  useEffect(() => {
    const handleStorageChange = () => {
      // This will trigger a re-render
      // No need to do anything, just re-render
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleProfileNavigation = () => {
    if (user?.id) {
      navigate(`/profile/${user.id}`);
    }
  };

  const handleLogout = () => {
    logout();
    // Clear the user data from local state
    clearUser();
    // Navigate to home page
    navigate('/');
  };

  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md z-50 border-b border-border/50">
      {isAdmin && <div className="w-full bg-yellow-200 py-[4px] text-center text-xs font-medium text-yellow-800 shadow-sm">
        ADMIN ACCESS ACTIVATED
      </div>}
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="https://files.hostakkhor.com/download/711dffc3-3e8f-4b55-ad6b-f43a2eed6c2e-hotakkhor-logo.svg" 
              alt="Hostakkhor Logo" 
              className="h-12"
            />
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full border border-primary">
                  <Avatar className="h-8 w-8" style={{backgroundImage: `url(${AvatarPlaceholderImage})`, backgroundSize: 'cover'}}>
                    <AvatarImage src={user.profileImageUrl || ""} alt={user.name || "User"} />
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem 
                  onClick={handleProfileNavigation}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={login} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};