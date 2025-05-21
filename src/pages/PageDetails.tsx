import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { IPage } from "./CreatePage";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { 
  Pencil, 
  Trash2, 
  ArrowLeft, 
  CalendarIcon, 
  Link as LinkIcon,
  Copy,
  Check,
  Share2
} from "lucide-react";
import PhotoGallery from "@/components/PhotoGallery";
import { Toaster } from "sonner";
import { getPageById, deletePage } from "@/actions/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ShareModal } from "@/components/ShareModal";

const PageDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState<IPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const { user } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAuthor = user && page && user.id === page.authorId;
  const pageUrl = window.location.href;

  useEffect(() => {
    const fetchPage = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const pageData = await getPageById(id);
        
        if (pageData) {
          setPage(pageData);
        }
      } catch (error) {
        console.error("Error fetching page:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPage();
  }, [id]);

  const handleDeletePage = async () => {
    if (!id) return;
    
    try {
      setIsDeleting(true);
      const success = await deletePage(id);
      
      if (success) {
        // Navigate to home page after successful deletion
        navigate('/');
      }
    } catch (error) {
      console.error("Error deleting page:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    toast({
      title: "Link copied to clipboard",
      description: "You can now paste it anywhere",
    });
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Profile skeleton loader
  const PageSkeleton = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-3 flex-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2">
          <Skeleton className="h-64 w-full" />
        </div>
        <div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container py-4 px-4 md:py-8 max-w-6xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <PageSkeleton />
        </main>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container py-4 px-4 md:py-8 max-w-6xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex flex-col items-center justify-center h-64">
            <h2 className="text-2xl font-bold">Page not found</h2>
            <p className="text-muted-foreground mt-2">The page you're looking for doesn't exist or has been removed.</p>
            <Button className="mt-4" asChild>
              <Link to="/">Go Home</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />
      <main className="container py-4 px-4 md:py-8 max-w-6xl mx-auto">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left column - Page info */}
          <div className="md:col-span-1 space-y-6">
            <Card className="p-6">
              <div className="flex flex-col">
                {/* Avatar */}
                <Avatar className="h-24 w-24 mb-4 ml-2">
                  <AvatarImage src={page.avatar} alt={page.name} />
                  <AvatarFallback>
                    {page.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <h1 className="text-xl font-bold mb-2 ml-2">{page.name}</h1>
                
                {/* Info section */}
                <div className="mt-1 space-y-4 ml-2">
                  <div className="flex items-center text-sm">
                    <CalendarIcon className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>Created {page.created_at ? format(new Date(page.created_at), 'dd MMM yyyy') : 'Unknown'}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="w-full mt-4 space-y-2">
                  {/* Copy link button */}
                  <Button
                    variant="ghost"
                    onClick={handleCopyLink}
                    className="flex items-center justify-start w-full p-2"
                  >
                    {copied ? <Check className="h-4 w-4 mr-3" /> : <Copy className="h-4 w-4 mr-3" />}
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>

                  {/* Share button */}
                  <Button
                    variant="ghost"
                    onClick={() => setShareModalOpen(true)}
                    className="flex items-center justify-start w-full p-2"
                  >
                    <Share2 className="h-4 w-4 mr-3" />
                    Share Page
                  </Button>

                  
                  <ShareModal 
                    url={pageUrl}
                    isOpen={isShareModalOpen}
                    onOpenChange={setShareModalOpen}
                  />

                  {isAuthor && (
                    <>
                      <Button
                        variant="ghost"
                        className="flex items-center justify-start w-full p-2"
                        asChild
                      >
                        <Link to={`/page/${id}/edit`}>
                          <Pencil className="h-4 w-4 mr-3" />
                          Edit Page
                        </Link>
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            className="flex items-center justify-start w-full p-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-3" />
                            Delete Page
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the page
                              and all posts associated with it.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleDeletePage}
                              disabled={isDeleting}
                            >
                              {isDeleting ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Right column - Content */}
          <div className="md:col-span-3 space-y-6">
            {/* About section */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">About</h2>
              <p className="text-muted-foreground">
                {page.bio ? page.bio : "No description available."}
              </p>
            </Card>

            {/* Posts section */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Posts</h2>
                {isAuthor && (
                  <Button asChild size="sm">
                    <Link to={`/create-post?pageId=${id}`}>Create Post</Link>
                  </Button>
                )}
              </div>
              
              {/* Display posts */}
              <PhotoGallery 
                pageId={id} 
                showHeading={false} 
                showFilter={true} 
                largeGridItems={true}
              />
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PageDetails;
