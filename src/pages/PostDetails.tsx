import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPostById, getPageById, deletePost } from "@/actions/actions";
import { IPost } from "./Index";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Calendar, Share2, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import AudioPlayer from "@/components/AudioPlayer";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { ShareModal } from "@/components/ShareModal";

const PostDetails = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  
  const [post, setPost] = useState<IPost | null>(null);
  const [pageDetails, setPageDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isOwnPost, setIsOwnPost] = useState(false);
  const [isShareModalOpen, setShareModalOpen] = useState(false);

  // Effect to scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchPostDetails = async () => {
      if (!postId) return;

      try {
        setIsLoading(true);
        const postData = await getPostById(postId);
        
        if (postData) {
          setPost(postData);
          
          // Check if current user is the author of the post
          if (user && (postData.authorId === user.id)) {
            setIsOwnPost(true);
          }
          
          // If post is associated with a page, fetch page details
          if (postData.pageId) {
            const page = await getPageById(postData.pageId);
            if (page) {
              setPageDetails(page);
              
              // Check if current user is the owner of the page
              if (user && page.authorId === user.id) {
                setIsOwnPost(true);
              }
            }
          }
        } else {
          // Post not found, redirect to home
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching post details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPostDetails();
  }, [postId, navigate, user]);
  
  // Format images for lightbox
  const lightboxSlides = post?.images?.map(src => ({ src })) || [];

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };
  
  // Handle post editing
  const handleEdit = () => {
    if (post) {
      navigate(`/create-post?edit=${post.id}`);
    }
  };
  
  // Handle post deletion
  const handleDelete = async () => {
    if (!post || !post.id) return;
    
    if (confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      try {
        const success = await deletePost(post.id);
        if (success) {
          navigate(-1); // Go back after successful deletion
        }
      } catch (error) {
        console.error("Error deleting post:", error);
        toast.error("Failed to delete post");
      }
    }
  };

  // Post skeleton loader
  const PostSkeleton = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      </div>
      <Skeleton className="h-[300px] w-full rounded-lg" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* <toast.ToastContainer /> */}
      <main className="container py-4 px-4 md:py-8 max-w-4xl mx-auto">
        {/* Back button and action buttons */}
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {isOwnPost && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <PostSkeleton />
        ) : post && (
          <div className="space-y-6">
            <Card className="p-6">
              {/* Author/Page info */}
              <div className="flex items-center justify-between mb-6">
                <div 
                  className="flex items-center space-x-4 cursor-pointer"
                  onClick={() => {
                    if (pageDetails) {
                      navigate(`/page/${post.pageId}`);
                    } else {
                      navigate(`/profile/${post.authorId}`);
                    }
                  }}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage 
                      src={pageDetails ? pageDetails.avatar : post.author.avatar} 
                      alt={pageDetails ? pageDetails.name : post.author.name} 
                    />
                    <AvatarFallback>
                      {pageDetails 
                        ? pageDetails.name.charAt(0).toUpperCase()
                        : post.author.name.charAt(0).toUpperCase()
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-lg font-semibold">
                      {pageDetails ? pageDetails.name : post.author.name}
                    </h2>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>
                        {post.created_at 
                          ? format(new Date(post.created_at), 'dd MMM yyyy')
                          : 'Unknown date'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShareModalOpen(true)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Post content */}
              <div className="space-y-6">
                {post.content && (
                  <div className="text-base whitespace-pre-wrap">
                    {post.content}
                  </div>
                )}
                
                {/* Images */}
                {post.images && post.images.length > 0 && (
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    {post.images.map((image, index) => (
                      <div 
                        key={index} 
                        className="relative cursor-pointer overflow-hidden rounded-lg"
                        onClick={() => openLightbox(index)}
                      >
                        <img 
                          src={image} 
                          alt={`Post image ${index + 1}`} 
                          className="w-full h-auto object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Audio player */}
                {post.audioFiles && post.audioFiles.length > 0 && (
                  <div className="mt-4">
                    <AudioPlayer 
                      audioFiles={post.audioFiles} 
                      postId={post.path || ''} 
                    />
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Share Modal */}
      {post && (
        <ShareModal
          isOpen={isShareModalOpen}
          onOpenChange={setShareModalOpen}
          post={post}
        />
      )}

      {/* Lightbox component */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxSlides}
        index={currentImageIndex}
        plugins={[Zoom, Thumbnails]}
        thumbnails={{
          position: "bottom",
          width: 120,
          height: 80,
          gap: 16,
          vignette: true,
        }}
        zoom={{
          wheelZoomDistanceFactor: 10,
          pinchZoomDistanceFactor: 10,
          doubleClickMaxStops: 2,
          doubleClickDelay: 300,
        }}
      />
    </div>
  );
};

export default PostDetails;
