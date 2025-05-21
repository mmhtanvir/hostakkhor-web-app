import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Header } from "./components/Header";
import Index from "./pages/Index";
import CreatePage from "./pages/CreatePage";
import PageDetails from "./pages/PageDetails";
import ProfilePage from "./pages/ProfilePage";
import EditProfile from "./pages/EditProfile";
import CreatePostPage from "./pages/CreatePostPage";
import PostDetails from "./pages/PostDetails";
import { cn } from "@/lib/utils";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import { VersionProvider } from "./contexts/VersionContext";
import { AudioProvider } from "./contexts/AudioContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/auth/Login";
import Callback from "./pages/auth/Callback";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PinnedPostThemeProvider } from "./contexts/PinnedPostThemeContext";
import { useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isMessagesPage = location.pathname.startsWith("/messages");
  const { setToken } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isPublic = params.get('preview') === 'true';

    if (isPublic && !localStorage.getItem('user')) {
      const publicUser = {
        "email": "public@hostakkhor.com",
        "path": "hostakkhor_users_1739202323423-BuElQW-g786YQ",
        "profileImageUrl": "https://files.hostakkhor.com/files/compressed-0ad2797f-compressed-529f2639-86dd.png",
        "name": "Hostakkhor",
        "created_at": 1739202323000,
        "id": "1739202323423-BuElQW-g786YQ",
        "updated_at": 1739202323000
      };
      localStorage.setItem('user', JSON.stringify(publicUser));
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2FhMWYxOTY1YTlhMjFhNWQ5OGQ0ODciLCJpYXQiOjE3MzkyMDIzMjksImV4cCI6MTc3MDczODMyOX0.qwlwLJqMkkWC1JWnG9xUabxSctDyDhZqUiIQXH9Z_iA';
      localStorage.setItem('auth_token', token);
      setToken(token); // Properly update auth context
    }
  }, [location.search, setToken]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <div className={cn(
        "flex-1",
        isMessagesPage ? "md:pt-16" : "pt-16"
      )}>
        <Routes>
          {/* Auth routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/callback" element={<Callback />} />

          {/* Protected routes */}
          <Route path="/" element={<Index />} />
          <Route path="/profile/:id" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/create-post" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
          <Route path="/create-page" element={<ProtectedRoute><CreatePage /></ProtectedRoute>} />
          <Route path="/page/:id/edit" element={<ProtectedRoute><CreatePage /></ProtectedRoute>} />
          <Route path="/page/:id" element={<ProtectedRoute><PageDetails /></ProtectedRoute>} />
          <Route path="/post/:postId" element={<ProtectedRoute><PostDetails /></ProtectedRoute>} />
          <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <VersionProvider>
          <AdminAuthProvider>
            <PinnedPostThemeProvider>
              <AudioProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <AppContent />
                  </BrowserRouter>
                </TooltipProvider>
              </AudioProvider>
            </PinnedPostThemeProvider>
          </AdminAuthProvider>
        </VersionProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;