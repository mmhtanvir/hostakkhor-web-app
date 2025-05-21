import { useState, useEffect } from "react";
import { Pin, Calendar, Share2, Headphones, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import AudioPlayer from "./AudioPlayer";
import { cn } from "@/lib/utils";
import { fetchAllPosts, TransformedPost, getUserByUserId } from "@/actions/actions";
import { useUser } from "@/hooks/useUser";
import { IUser } from "@/lib/utils";
import { usePinnedPostTheme, THEMES } from "@/contexts/PinnedPostThemeContext";
import AvatarPlaceholderImage from '@/assets/avatar placceholder.png';

interface Author {
  role: string;
  avatar: string;
  name: string;
  id: string;
}

interface ApiResponse {
  id: string;
  path: string;
  author: Author;
  authorId: string;
  updated_at: number;
  audioFiles?: string[];
  communityId?: any;
  created_at: number;
  community?: any;
  images?: string[];
  description?: string;
}

const PLACEHOLDER_IMAGE = 'https://placehold.co/600x600/ffffff/ffffff?text=No+Image';

// Theme configurations are now imported from PinnedPostThemeContext

interface PinnedPostProps {
  userId?: string;
  theme?: 'default' | 'golden';
  onThemeChange?: (theme: 'default' | 'golden') => void;
}

const PinnedPost = ({ userId, theme, onThemeChange }: PinnedPostProps) => {
  const [imageLoaded, setImageLoaded] = useState(false); 
  const [pinnedPost, setPinnedPost] = useState<TransformedPost | null>(null);
  const [profileUser, setProfileUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { theme: contextTheme, setTheme, themeStyles } = usePinnedPostTheme();
  
  // Use theme from props if provided, otherwise use context theme
  const currentTheme = theme || contextTheme;

  // Update context theme when prop changes
  useEffect(() => {
    if (theme && theme !== contextTheme) {
      setTheme(theme);
    }
  }, [theme, contextTheme, setTheme]);

  // Notify parent component when theme changes
  useEffect(() => {
    if (onThemeChange && profileUser) {
      onThemeChange(currentTheme);
    }
  }, [currentTheme, onThemeChange, profileUser]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Use the provided userId or the current user's id
        const targetUserId = userId || user?.id;

        if (!targetUserId) {
          throw new Error('No user ID available');
        }

        // Fetch user profile information
        const userProfile = await getUserByUserId(targetUserId);
        if (userProfile) {
          setProfileUser(userProfile);
          // Set the theme based on props first, then user preference, default to 'default' if not set
          const themeToUse = theme || userProfile.pinnedPostTheme || 'default';
          setTheme(themeToUse);
        }

        // Fetch all posts for the user
        const result = await fetchAllPosts("public", undefined, "", targetUserId);

        // Find the pinned post
        const pinnedPost = result.posts.find(post => post.pinned);

        if (pinnedPost) {
          setPinnedPost(pinnedPost);
        } else {
          // No pinned post found
          setPinnedPost(null);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, user?.id]);

  if (loading) {
    return <div className="animate-pulse bg-muted rounded-2xl h-[400px]"></div>;
  }

  // if (error) {
  //   return <div className="bg-destructive/10 text-destructive p-4 rounded-2xl">Failed to load data</div>;
  // }

  if(!loading && !user) {
    return null;
  }

  const image = pinnedPost?.images?.length ? pinnedPost.images[0] : PLACEHOLDER_IMAGE;
  const audioUrl = pinnedPost?.audioFiles?.length ? pinnedPost.audioFiles[0] : '';
  // Format date using current time if not available
  const postDate = new Date(Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // themeStyles are now provided by the context

  return (
    <div className={themeStyles.container}>
      {/* Header with Pin and Date */}
      <div className={themeStyles.header}>
        <div className="flex items-center gap-2 text-sm">
          <Pin className={contextTheme === 'golden' ? "h-4 w-4 text-amber-600" : "h-4 w-4 text-primary"} />
          <span className="font-medium">Pinned Post</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <time>{postDate}</time>
        </div>
      </div>

      {/* Main Content Grid */}
      <div
        className={themeStyles.content}
        style={{
          backgroundImage: `url(${themeStyles.backgroundImage})`,
          backgroundBlendMode: 'multiply',
          backgroundSize: 'cover',
          opacity: contextTheme === 'default' ? 0.9 : 0.8
        }}
      >
        {/* User Profile Section - LEFT */}
        <div className={themeStyles.leftSection}>
          {/* User Avatar */}
          <Avatar className={themeStyles.avatar} style={{backgroundImage: `url(${AvatarPlaceholderImage})`, backgroundSize: 'cover'}}>
            <AvatarImage
              src={profileUser?.profileImageUrl || pinnedPost?.avatar}
              alt={profileUser?.name || pinnedPost?.name}
            />
          </Avatar>

          {/* User Info */}
          <div className={contextTheme === 'golden' ? "space-y-3 text-center w-[260px] bg-[#fde2c5] p-2 rounded-lg" : "space-y-3 text-center w-full"}>
            
            <h3 className={contextTheme === 'golden' ? "text-2xl font-bold text-[#a15608]" : "text-2xl font-bold"}>
              {profileUser?.name || pinnedPost?.name}
            </h3>
            <p className={contextTheme === 'golden' ? "text-sm font-semibold leading-relaxed text-[#a15608]" : "text-sm leading-relaxed"}>
              {profileUser?.bio || 'No bio available'}
            </p>
          </div>
        </div>

        {/* Pinned Post Content - RIGHT */}
        <div className={themeStyles.rightSection}>
          {
            pinnedPost ? (
              <div className="space-y-4">
                {/* <p className={currentTheme === 'golden' ? "text-sm leading-relaxed text-amber-900" : "text-sm leading-relaxed"}>
                  {pinnedPost.content}
                </p> */}

                {/* Image Section */}
                {pinnedPost.images?.length ? (
                  <div className={themeStyles.imageContainer}>
                    <img
                      src={pinnedPost.images[0]}
                      alt={pinnedPost.name}
                      className={cn(
                        themeStyles?.image,
                        imageLoaded ? "opacity-100" : "opacity-0"
                      )}
                      onLoad={() => setImageLoaded(true)}
                    />
                    {!imageLoaded && (
                      <div className="absolute inset-0 bg-muted animate-pulse rounded-lg" />
                    )}
                  </div>
                ) : null}

                {/* Audio Section */}
                {pinnedPost.audioFiles?.length ? (
                  <div className="mt-4">
                    <AudioPlayer audioUrl={pinnedPost.audioFiles[0]} />
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px]">
                <div className="bg-muted/90 rounded-lg p-8 text-center w-full">
                <Pin className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No pinned post available</p>
                <Button 
                  variant="outline" 
                  className="mt-4 flex items-center gap-2 mx-auto"
                  onClick={() => window.location.href = `/create-post`}
                >
                  <Pin className="h-4 w-4" />
                  Create a post to pin
                </Button>
              </div>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
};

export default PinnedPost;
