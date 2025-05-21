import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getQuarksInstance } from "@/api/quarksInstance";
import { useUser } from "@/hooks/useUser";
import PinnedPostThemePicker from "@/components/PinnedPostThemePicker";
import { IUser } from "@/lib/utils";
import { IPost } from "./Index";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AvatarPlaceholderImage from "@/assets/avatar placceholder.png";
import {
  CalendarIcon,
  Mail,
  PencilIcon,
  Users,
  BookOpen,
  Image,
  Clock,
  MapPin,
  Link as LinkIcon,
  LogOut,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PhotoGallery from "@/components/PhotoGallery";
import PageGallery from "@/components/PageGallery";
import PinnedPost from "@/components/PinnedPost";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser, clearUser, updateUser } = useUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [profileUser, setProfileUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [pinnedPostTheme, setPinnedPostTheme] = useState<'default' | 'golden'>('default');
  const { toast } = useToast();
  const { isAdmin } = useAdminAuth();

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const usersCollection = getQuarksInstance().collection<IUser>('users');
        const user = await usersCollection.doc(id).get();

        if (user) {
          setProfileUser(user);
          // Set the pinned post theme from user preferences
          setPinnedPostTheme(user.pinnedPostTheme || 'default');
        } else {
          toast({
            title: "User not found",
            variant: "destructive",
          });
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast({
          title: "Error loading profile",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [id, navigate, toast]);

  const handleLogout = () => {
    logout();
    clearUser();
    navigate('/');
  };

  useEffect(() => {
    console.log("Current user:", currentUser);
    console.log("id", id)
  }, [currentUser])

  // Profile skeleton loader
  const ProfileSkeleton = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center md:justify-between">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </Card>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-4 px-4 md:py-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Home
          </Button>

          {/* Edit profile button (only show in desktop screen) */}
          {currentUser?.id === id ? (
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          ) : null}

        </div>

        {isLoading ? (
          <ProfileSkeleton />
        ) : profileUser && (
          <div className="space-y-6">
            {/* Profile info */}
            <Card className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  {/* Avatar */}
                  <Avatar className="h-24 w-24" style={{backgroundImage: `url(${AvatarPlaceholderImage})`, backgroundSize: 'cover'}}>
                    <AvatarImage src={profileUser.profileImageUrl} alt={profileUser.name || 'User'} />
                  </Avatar>

                  <div>
                    <h1 className="text-xl font-bold mb-2">{profileUser.name || 'Anonymous User'}</h1>

                    {/* Contact/Info section */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                        <span>{profileUser.email}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <CalendarIcon className="h-4 w-4 mr-3 text-muted-foreground" />
                        <span>Joined {profileUser.created_at ? format(new Date(profileUser.created_at), 'dd MMM yyyy') : 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  {currentUser?.id === id || isAdmin ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => navigate('/edit-profile?id=' + id)}
                        className="flex items-center"
                      >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>

                    </>
                  ) : null}
                </div>
              </div>
            </Card>

            {/* Content */}
            <div className="space-y-6">
              {/* Content Tabs */}
              <Card className="p-6">
                <Tabs defaultValue="posts" className="w-full" onValueChange={setActiveTab}>
                  <TabsList className="w-full mb-6 grid grid-cols-2">
                    <TabsTrigger value="posts" className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      <span>Posts</span>
                    </TabsTrigger>
                    <TabsTrigger value="pages" className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>Pages</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Posts Tab */}
                  <TabsContent value="posts" className="space-y-6">
                    {/* Pinned Post Section */}
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                          <Image className="h-5 w-5" />
                          Pinned Post
                        </h2>
                        {/* Only show theme picker on own profile */}
                        {currentUser?.id === id && (
                          <PinnedPostThemePicker
                            userId={id || ''}
                            currentTheme={pinnedPostTheme}
                            onThemeChange={setPinnedPostTheme}
                          />
                        )}
                      </div>
                      <PinnedPost
                        userId={id}
                        theme={pinnedPostTheme}
                        onThemeChange={setPinnedPostTheme}
                      />
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Image className="h-5 w-5" />
                        User Posts
                      </h2>
                      <div>
                        <PhotoGallery
                          authorId={id}
                          showHeading={false}
                          showFilter={true}
                          largeGridItems={true}
                          theme={pinnedPostTheme}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Pages Tab */}
                  <TabsContent value="pages" className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        User Pages
                      </h2>
                      <PageGallery authorId={id} />
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Activity Timeline Component
const ActivityTimeline = ({ userId }: { userId: string }) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      setIsLoading(true);
      try {
        // Fetch recent posts
        const postsCollection = getQuarksInstance().collection<IPost>('posts');
        const recentPosts = await postsCollection
          .where('authorId', 'eq', userId)
          .orderBy('created_at', 'desc')
          .limit(5)
          .get();

        // Fetch recent pages
        const pagesCollection = getQuarksInstance().collection('pages');
        const recentPages = await pagesCollection
          .where('authorId', 'eq', userId)
          .orderBy('created_at', 'desc')
          .limit(5)
          .get();

        // Combine and sort activities
        const combinedActivities = [
          ...recentPosts.map(post => ({
            type: 'post',
            id: post.id,
            title: post.content,
            timestamp: post.created_at,
            data: post
          })),
          ...recentPages.map(page => ({
            type: 'page',
            id: page.id,
            title: page.name,
            timestamp: page.created_at,
            data: page
          }))
        ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

        setActivities(combinedActivities);
      } catch (error) {
        console.error('Error fetching activity:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivity();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No recent activity found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activities.map((activity, index) => (
        <div key={`${activity.type}-${activity.id}`} className="relative">
          {index !== activities.length - 1 && (
            <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border" />
          )}

          <div className="flex gap-4">
            <div className="relative z-10">
              {activity.type === 'post' ? (
                <div className="bg-primary/10 p-2 rounded-full">
                  <Image className="h-8 w-8 text-primary" />
                </div>
              ) : (
                <div className="bg-secondary/10 p-2 rounded-full">
                  <BookOpen className="h-8 w-8 text-secondary" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={activity.type === 'post' ? 'default' : 'secondary'}>
                  {activity.type === 'post' ? 'Created Post' : 'Created Page'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {activity.timestamp ? format(new Date(activity.timestamp), 'MMM d, yyyy • h:mm a') : 'Unknown date'}
                </span>
              </div>

              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium">{activity.title || 'Untitled'}</h3>
                  {activity.type === 'post' && activity.data.pageId && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <LinkIcon className="h-3 w-3" />
                      <span>Posted to page</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProfilePage;
