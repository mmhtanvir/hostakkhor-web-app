import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { createUserIfNotExists, createCommunityIfNotExists, IUser } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { useVersion } from "@/contexts/VersionContext";
import OnboardingModal from "@/components/OnboardingModal";
import { getQuarksInstance } from "@/api/quarksInstance";

export default function Callback() {
  const [searchParams] = useSearchParams();
  const { setToken, getUserProfile, token } = useAuth();
  const navigate = useNavigate();
  const { updateUser, clearUser } = useUser();
  const { storeCurrentVersion } = useVersion();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userId, setUserId] = useState("");

  const getAuthToken = async () => {
    const authToken = searchParams.get("auth_token");
    console.log("authToken:", authToken);
    if (authToken) {
      setToken(authToken);
    }
  };

  const setupUser = async () => {
    // Prevent multiple executions
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Clear any existing user data first to prevent stale data
      clearUser();

      const ssoUserProfile = await getUserProfile();
      console.log("ssoUserProfile:", ssoUserProfile);
      const user = await createUserIfNotExists(ssoUserProfile);
      // await createCommunityIfNotExists();

      // Save user details to localStorage
      updateUser(user);

      // Store the current app version in localStorage
      storeCurrentVersion();

      // Force a refresh of the auth state by explicitly setting the token again
      const currentToken = localStorage.getItem('auth_token');
      if (currentToken) {
        setToken(currentToken); // Re-set the token to trigger auth state update
      }

      // Check if there's a saved redirect path
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      sessionStorage.removeItem('redirectAfterLogin'); // Clean up

      // Check if this is a new user or if they haven't completed onboarding
      const isNewUser = !user.onboardingCompleted;

      // if (isNewUser) {
      // Allways show onboarding modal
      if (true) {
        // Set user ID and show onboarding modal
        setUserId(user.id);
        setShowOnboarding(true);
      } else {
        // If user has completed onboarding, proceed with normal navigation
        window.location.href = redirectPath || `/profile/${user.id}`;
      }
    } catch (error) {
      console.error('Error setting up user:', error);
      navigate("/auth/login", { replace: true });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (token && !isProcessing) {
      setupUser();
    }
  }, [token]);

  // Force re-render of components that depend on auth state
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' || e.key === 'user') {
        // This will trigger a re-render in components that use the auth context
        window.dispatchEvent(new Event('storage'));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    getAuthToken();
  }, []);

  const handleCloseOnboarding = async () => {
    // Mark onboarding as completed in user record
    if (userId) {
      try {
        const usersCollection = getQuarksInstance().collection<IUser>('users');
        await usersCollection.doc(userId).update({
          onboardingCompleted: true
        });

        // Update local user data
        const user = await usersCollection.doc(userId).get();
        if (user) {
          updateUser(user);
        }
      } catch (error) {
        console.error('Error updating onboarding status:', error);
      }
    }

    setShowOnboarding(false);
    // Navigate to profile page
    const redirectPath = sessionStorage.getItem('redirectAfterLogin');
    sessionStorage.removeItem('redirectAfterLogin'); // Clean up
    setTimeout(() => {
      window.location.href = redirectPath || `/`;
    }, 500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      {showOnboarding && userId ? (
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={handleCloseOnboarding}
          userId={userId}
        />
      ) : (
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Logging you in...</h1>
          <p className="text-muted-foreground">Please wait while we set up your account.</p>
        </div>
      )}
    </div>
  );
}
