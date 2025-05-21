import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { useAuth } from "@/contexts/AuthContext";
import { IUser } from "@/lib/utils";
import { ImageUploader } from "@/components/post/ImageUploader";
import { AudioUploader } from "@/components/post/AudioUploader";
import { PostContent } from "@/components/post/PostContent";
import { PostActions } from "@/components/post/PostActions";
import { IPost } from "@/pages/Index";
import { getQuarksInstance } from "@/api/quarksInstance";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ImageIcon, MicIcon, Pin } from "lucide-react";
import { getPostById, updatePost, deleteFile, getUserPages, pinPost } from "@/actions/actions";
import { IPage } from "@/pages/CreatePage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import PhotoGallery from "@/components/PhotoGallery";
import { Checkbox } from "@/components/ui/checkbox";

// Get the file server URL based on environment
const FILE_SERVER_URL = import.meta.env.VITE_FILE_SERVER_URL;

const CreatePostPage = () => {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<{ filename: string; url: string }[]>([]);
  const [audioFiles, setAudioFiles] = useState<{ filename: string; url: string }[]>([]);
  const [videos, setVideos] = useState<{ filename: string; url: string }[]>([]);
  const [category, setCategory] = useState("General");
  const [isUploading, setIsUploading] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editPostId, setEditPostId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Track original post data for comparison
  const [originalPost, setOriginalPost] = useState<IPost | null>(null);
  // Track files marked for deletion
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  // Page selection state
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [userPages, setUserPages] = useState<IPage[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  // Pin post state
  const [pinPostChecked, setPinPostChecked] = useState(false);
  
  const { toast } = useToast();
  const { getUserProfile } = useAuth();
  const [ssoUserProfile, setSsoUserProfile] = useState<IUser | null>(null);
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const hasMedia = images.length > 0 || audioFiles.length > 0;

  const handleImageAdd = (newImages: Array<{ filename: string; url: string }>) => {
    // Update state with new images
    setImages(prev => [...prev, ...newImages]);
  };

  const handleImageRemove = (index: number) => {
    const imageToDelete = images[index];
    
    if (isEditMode) {
      // In edit mode, mark for deletion instead of deleting immediately
      setFilesToDelete(prev => [...prev, imageToDelete.filename]);
      setImages(prev => prev.filter((_, i) => i !== index));
      
      toast({
        title: "Success",
        description: "Image removed from post",
      });
    } else {
      // In create mode, delete immediately
      deleteFile(imageToDelete.filename)
        .then(() => {
          const updatedImages = images.filter((_, i) => i !== index);
          setImages(updatedImages);
          
          toast({
            title: "Success",
            description: "Image removed successfully",
          });
        })
        .catch(error => {
          toast({
            title: "Error",
            description: "Failed to remove image. Please try again.",
            variant: "destructive",
          });
        });
    }
  };

  const handleAudioAdd = (newAudioFiles: Array<{ filename: string; url: string }>) => {
    // Update state with new audio files
    setAudioFiles(prev => [...prev, ...newAudioFiles]);
  };

  const handleAudioRemove = (index: number) => {
    const audioToDelete = audioFiles[index];
    
    if (isEditMode) {
      // In edit mode, mark for deletion instead of deleting immediately
      setFilesToDelete(prev => [...prev, audioToDelete.filename]);
      setAudioFiles(prev => prev.filter((_, i) => i !== index));
      
      toast({
        title: "Success",
        description: "Audio file removed from post",
      });
    } else {
      // In create mode, delete immediately
      deleteFile(audioToDelete.filename)
        .then(() => {
          const updatedAudioFiles = audioFiles.filter((_, i) => i !== index);
          setAudioFiles(updatedAudioFiles);
          
          toast({
            title: "Success",
            description: "Audio file removed successfully",
          });
        })
        .catch(error => {
          toast({
            title: "Error",
            description: "Failed to remove audio file. Please try again.",
            variant: "destructive",
          });
        });
    }
  };

  // Check if we're in edit mode and load post data
  useEffect(() => {
    const editParam = searchParams.get('edit');
    if (editParam) {
      setIsEditMode(true);
      setEditPostId(editParam);
      loadPostData(editParam);
    }
    
    // Check if pageId is in URL query
    const pageIdParam = searchParams.get('pageId');
    if (pageIdParam) {
      setSelectedPageId(pageIdParam);
    }
  }, [searchParams]);

  // Fetch user's pages when component mounts
  useEffect(() => {
    const fetchUserPages = async () => {
      if (!user?.id) return;
      
      setLoadingPages(true);
      try {
        const pages = await getUserPages(user.id);
        setUserPages(pages);
      } catch (error) {
        console.error('Error fetching user pages:', error);
        toast({
          title: "Error",
          description: "Failed to load your pages. You can still create a post without selecting a page.",
          variant: "destructive",
        });
      } finally {
        setLoadingPages(false);
      }
    };

    fetchUserPages();
  }, [user?.id]);

  const loadPostData = async (postId: string) => {
    setIsLoading(true);
    try {
      const post = await getPostById(postId);
      if (post) {
        // Store original post for comparison
        setOriginalPost(post);
        
        // Set content
        setContent(post.content || "");
        
        // Set visibility
        setVisibility(post.visibility || "public");
        
        // Set category
        if (post.category) {
          setCategory(post.category);
        }
        
        // Set page ID if present
        if (post.pageId) {
          setSelectedPageId(post.pageId);
        }
        
        // Set pinned status
        if (post.pinned) {
          setPinPostChecked(post.pinned);
        }
        
        // Set images
        if (post.images && post.images.length > 0) {
          const formattedImages = post.images.map(url => {
            const filename = url.split('/').pop() || "";
            return { filename, url };
          });
          setImages(formattedImages);
        }
        
        // Set audio files
        if (post.audioFiles && post.audioFiles.length > 0) {
          const formattedAudioFiles = post.audioFiles.map(url => {
            const filename = url.split('/').pop() || "";
            return { filename, url };
          });
          setAudioFiles(formattedAudioFiles);
        }
        
        // Set videos (if any)
        if (post.videos && post.videos.length > 0) {
          const formattedVideos = post.videos.map(url => {
            const filename = url.split('/').pop() || "";
            return { filename, url };
          });
          setVideos(formattedVideos);
        }
      } else {
        toast({
          title: "Post not found",
          description: "The post you're trying to edit could not be found",
          variant: "destructive",
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Error loading post data:', error);
      toast({
        title: "Error",
        description: "Failed to load post data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validatePost = (): boolean => {
    if (images.length === 0 && audioFiles.length === 0) {
      toast({
        title: "Media required",
        description: "Please add at least one image or audio file to create a post",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validatePost()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (isEditMode && editPostId) {
        // Delete files that were marked for deletion
        if (filesToDelete.length > 0) {
          const deletePromises = filesToDelete.map(filename => deleteFile(filename));
          await Promise.all(deletePromises);
        }
        
        // Update existing post
        const updatedPostData: Partial<IPost> = {
          content,
          images: images.map(img => img.url),
          audioFiles: audioFiles.map(audio => audio.url),
          videos: videos.map(video => video.url),
          category,
          visibility,
          pageId: selectedPageId || undefined,
          authorId: user?.id,
          pinned: pinPostChecked,
          author: {
            id: user?.id,
            name: user?.name,
            avatar: user?.profileImageUrl,
            role: ""
          },
        };

        const success = await updatePost(editPostId, updatedPostData);
        
        if (success) {
          toast({
            title: "Post updated",
            description: "Your post has been updated successfully",
          });
          navigate("/");
        }
      } else {
        // Create new post
        const newPost: IPost = {
          authorId: user?.id,
          author: {
            id: user?.id,
            name: user?.name,
            avatar: user?.profileImageUrl,
            role: ""
          },
          content,
          images: images.map(img => img.url),
          audioFiles: audioFiles.map(audio => audio.url),
          videos: videos.map(video => video.url),
          category,
          likes: 0,
          comments: 0,
          likedBy: [],
          visibility,
          pinned: pinPostChecked,
          created_at: Date.now(),
          pageId: selectedPageId || undefined
        };

        // Save to database
        const postsCollection = getQuarksInstance().collection<IPost>('posts');
        const newPostRef = await postsCollection.add(newPost);

        // If pin is checked, call pinPost function to handle unpinning other posts
        if (pinPostChecked && newPostRef.id) {
          await pinPost(newPostRef.id);
        }

        toast({
          title: "Post created",
          description: "Your post has been created successfully",
        });
        
        // Navigate back to home page
        navigate("/");
      }
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'create'} post. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isEditMode && originalPost) {
      // Check if there are any changes that would be lost
      const hasChanges = 
        content !== (originalPost.content || "") ||
        images.length !== (originalPost.images?.length || 0) ||
        audioFiles.length !== (originalPost.audioFiles?.length || 0) ||
        videos.length !== (originalPost.videos?.length || 0) ||
        filesToDelete.length > 0;

      if (hasChanges) {
        if (window.confirm("Changes you made will not be saved.")) {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    } else {
      // For create mode, check if there are any uploads that would be lost
      const hasUploads = images.length > 0 || audioFiles.length > 0 || videos.length > 0 || content.trim() !== "";
      
      if (hasUploads) {
        if (window.confirm("Changes you made will not be saved.")) {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    }
  };

  const getUserProfileData = async () => {
    const data = await getUserProfile();
    setSsoUserProfile(data);
  };

  useEffect(() => {
    if(ssoUserProfile === null) {
      getUserProfileData();
    }
  }, [ssoUserProfile, user]);

  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 sm:px-6 pt-8 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2" 
              onClick={handleCancel}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold ml-2 sm:ml-4">
              {isEditMode ? "Edit Post" : "Create a Post"}
            </h1>
          </div>
          
          {/* Post Creation Form */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Card className="w-full p-4 sm:p-6 mb-8">
              <div className="space-y-4 sm:space-y-6">
                {/* Page Selection */}
                {userPages.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="page-select">Post to Page (Optional)</Label>
                    <Select
                      value={selectedPageId || "none"}
                      onValueChange={(value) => setSelectedPageId(value === "none" ? null : value)}
                    >
                      <SelectTrigger id="page-select" className="w-full">
                        <SelectValue placeholder="Select a page (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Personal Post</SelectItem>
                        {userPages.map((page) => (
                          <SelectItem key={page.id} value={page.id}>
                            {page.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <PostContent
                  content={content}
                  onChange={setContent}
                  onFocus={() => {}}
                  overridePlaceholder="Share your thoughts..."
                />
                
                <ImageUploader
                  images={images}
                  onImageAdd={handleImageAdd}
                  onImageRemove={handleImageRemove}
                  isUploading={isUploading}
                  setIsUploading={setIsUploading}
                />
                
                <AudioUploader
                  audioFiles={audioFiles}
                  onAudioAdd={handleAudioAdd}
                  onAudioRemove={handleAudioRemove}
                  isUploading={isUploading}
                  setIsUploading={setIsUploading}
                  isEditMode={isEditMode}
                />
                
                {isUploading && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                    <span className="text-sm font-medium">Uploading media...</span>
                  </div>
                )}
                
                <div className="flex flex-col sm:justify-between gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => {
                        const fileInput = document.getElementById('image-input') as HTMLInputElement;
                        if (fileInput) fileInput.click();
                      }}
                      disabled={isUploading || isSubmitting}
                      className="h-16 flex flex-col gap-1"
                    >
                      <ImageIcon className="h-5 w-5" />
                      <span>Add Image</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => {
                        const audioUploader = document.querySelector('input#audio-input') as HTMLInputElement;
                        if (audioUploader) {
                          // Find the AudioUploader component and trigger its dialog
                          const event = new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                          });
                          // Dispatch a custom event that AudioUploader will listen for
                          document.dispatchEvent(new CustomEvent('open-audio-dialog'));
                        }
                      }}
                      disabled={isUploading || isSubmitting}
                      className="h-16 flex flex-col gap-1"
                    >
                      <MicIcon className="h-5 w-5" />
                      <span>Add Audio</span>
                    </Button>
                  </div>
                  
                  {hasMedia && (
                    <>
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox 
                          id="pin-post" 
                          className="h-6 w-6"
                          checked={pinPostChecked} 
                          onCheckedChange={(checked) => setPinPostChecked(checked === true)}
                        />
                        <div className="grid gap-1 leading-none">
                          <label
                            htmlFor="pin-post"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                          >
                            {/* <Pin className="h-4 w-4" /> */}
                            Pin this post to your profile
                          </label>
                          <p className="text-sm text-muted-foreground">
                            Pinned posts appear at the profile frame
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Button 
                          variant="outline"
                          onClick={handleCancel}
                          disabled={isSubmitting}
                          className="h-12"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSubmit} 
                          disabled={isUploading || isSubmitting}
                          className="h-12"
                        >
                          {isSubmitting ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Post" : "Create Post")}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Recently Created Posts */}
          {user && (
            <div className="mt-32">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Your Recent Posts</h2>
                  <p className="text-muted-foreground text-sm mb-6">View and manage your recent posts</p>
                </div>
              </div>
              <PhotoGallery 
                authorId={user?.id}
                showHeading={false}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CreatePostPage;
