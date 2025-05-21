import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useUser } from '@/hooks/useUser';
import { getUserByUserId } from '@/actions/actions';

// Theme type
export type PinnedPostThemeType = 'default' | 'golden';

// Import theme background images
import defaultBg from '@/assets/theme-files/default-theme-bg.png';
import goldenBg from '@/assets/theme-files/golden-theme-bg.png';

// Theme configurations
export const THEMES = {
  golden: {
    // PinnedPost styles
    container: "group relative overflow-hidden rounded-2xl bg-[#fbe4cc] shadow-md hover:shadow-lg transition-shadow duration-300 border border-amber-200",
    header: "bg-[#fbe4cc] p-3 flex items-center justify-between border-b border-amber-200",
    content: "p-6 flex flex-col md:flex-row gap-8 bg-[#fbe4cc]",
    leftSection: "md:w-1/2 flex flex-col items-center gap-4",
    rightSection: "md:w-1/2 space-y-4",
    avatar: "h-60 w-60 sm:h-[340px] sm:w-[340px] rounded-full overflow-hidden border-8 border-[#fbe4cc] outline outline-[6px] outline-[#9e5101]",
    imageContainer: "relative overflow-hidden rounded-sm border-[6px] border-[#9e5101]",
    image: "w-full object-cover transition-all duration-700",
    backgroundImage: goldenBg,
    
    // GalleryItem styles
    galleryItem: {
      container: "relative overflow-hidden rounded-lg group transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg",
      header: "hidden",
      imageContainer: "image-blur-wrapper w-full h-full aspect-square relative",
      contentBg: "bg-[#fbe4cc]/90 backdrop-blur-sm",
      avatarRing: "ring-2 ring-amber-600/70",
      textColor: "text-amber-900",
      dropdownHover: "bg-gray-300/50 hover:bg-gray-300/30",
      iconColor: "text-amber-600"
    }
  },
  default: {
    // PinnedPost styles
    container: "group relative overflow-hidden rounded-2xl bg-gradient-to-br from-background via-background to-muted shadow-md hover:shadow-lg transition-shadow duration-300",
    header: "bg-muted/50 p-3 flex items-center justify-between border-b",
    content: "p-6 flex flex-col md:flex-row gap-8",
    leftSection: "md:w-1/2 flex flex-col items-center justify-center gap-4 md:border-r md:pr-6",
    rightSection: "md:w-1/2 space-y-4",
    avatar: "h-40 w-40",
    imageContainer: "relative overflow-hidden rounded-lg",
    image: "w-full object-cover transition-all duration-700",
    backgroundImage: defaultBg,
    
    // GalleryItem styles
    galleryItem: {
      container: "relative overflow-hidden rounded-lg group transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg",
      header: "bg-black/60 backdrop-blur-md",
      imageContainer: "image-blur-wrapper w-full h-full aspect-square pt-[56px] relative",
      contentBg: "bg-black/40 backdrop-blur-sm",
      avatarRing: "ring-2 ring-white/40",
      textColor: "text-white",
      dropdownHover: "hover:bg-white/10",
      iconColor: "text-primary"
    }
  },
};

// Context interface
interface PinnedPostThemeContextType {
  theme: PinnedPostThemeType;
  themeStyles: typeof THEMES.default;
  setTheme: (theme: PinnedPostThemeType) => void;
  updateUserTheme: (userId: string, theme: PinnedPostThemeType) => Promise<void>;
}

// Create context with default values
const PinnedPostThemeContext = createContext<PinnedPostThemeContextType>({
  theme: 'default',
  themeStyles: THEMES.default,
  setTheme: () => {},
  updateUserTheme: async () => {},
});

// Provider props interface
interface PinnedPostThemeProviderProps {
  children: ReactNode;
}

// Provider component
export const PinnedPostThemeProvider: React.FC<PinnedPostThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<PinnedPostThemeType>('default');
  const { user } = useUser();

  // Load user's theme preference on initial load
  useEffect(() => {
    const loadUserTheme = async () => {
      if (user?.id) {
        try {
          const userProfile = await getUserByUserId(user.id);
          if (userProfile && userProfile.pinnedPostTheme) {
            setTheme(userProfile.pinnedPostTheme as PinnedPostThemeType);
          }
        } catch (error) {
          console.error('Error loading user theme preference:', error);
        }
      }
    };

    loadUserTheme();
  }, [user?.id]);

  // Function to update user's theme preference in the database
  const updateUserTheme = async (userId: string, newTheme: PinnedPostThemeType) => {
    try {
      // This would be where you'd update the user's theme preference in the database
      // For now, we'll just update the local state
      setTheme(newTheme);
      
      // In a real implementation, you would call an API to update the user's theme preference
      // Example: await updateUserPreference(userId, { pinnedPostTheme: newTheme });
      
      console.log(`Theme updated to ${newTheme} for user ${userId}`);
    } catch (error) {
      console.error('Error updating user theme preference:', error);
    }
  };

  // Get the current theme styles
  const themeStyles = THEMES[theme];

  // Context value
  const contextValue: PinnedPostThemeContextType = {
    theme,
    themeStyles,
    setTheme,
    updateUserTheme,
  };

  return (
    <PinnedPostThemeContext.Provider value={contextValue}>
      {children}
    </PinnedPostThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const usePinnedPostTheme = () => useContext(PinnedPostThemeContext);
