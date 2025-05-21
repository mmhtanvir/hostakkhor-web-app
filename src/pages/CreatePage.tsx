import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/use-toast";
import AvatarUpload from "@/components/AvatarUpload";
import { createPage, updatePage, getPageById } from "@/actions/actions";
import PageGallery from "@/components/PageGallery";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export interface IPage {
  id: string;
  created_at?: number;
  name: string;
  authorId: string;
  avatar: string;
  members: string[];
  bio?: string;
}

const CreatePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();
  const [avatar, setAvatar] = useState<{ filename: string; url: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const loadPage = async (pageId: string) => {
    try {
      const page = await getPageById(pageId);
      console.log("Loaded page:", page);
      
      if (page) {
        setFormData({
          name: page.name,
          bio: page.bio || "",
        });
        
        if (page.avatar) {
          console.log("Setting avatar from page:", page.avatar);
          setAvatar({
            filename: page.avatar.split('/').pop() || '',
            url: page.avatar
          });
        } else {
          console.log("No avatar found in page data");
        }
      }
    } catch (error) {
      console.error("Error loading page:", error);
      toast({
        title: "Error",
        description: "Failed to load page details",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (id) {
      setIsEditing(true);
      loadPage(id);
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a page",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Page name required",
        description: "Please provide a name for your page",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing && id) {
        // Update existing page
        await updatePage(id, {
          name: formData.name,
          avatar: avatar?.url || "",
          bio: formData.bio,
        });
        
        navigate(`/page/${id}`);
      } else {
        // Create new page
        const pageData = {
          name: formData.name,
          authorId: user.id,
          avatar: avatar?.url || "",
          members: [user.id],
          bio: formData.bio,
        };

        const newPageId = await createPage(pageData);
        navigate(`/page/${newPageId}`);
      }
    } catch (error) {
      console.error("Error creating/updating page:", error);
      toast({
        title: "Error",
        description: "Failed to save page. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 sm:px-6 py-8">
        <div className="flex items-center mb-6 max-w-3xl mx-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2" 
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold ml-2 sm:ml-4">
            {isEditing ? "Edit Page" : "Create a Page"}
          </h1>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Form Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{isEditing ? "Edit Page Details" : "Page Details"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Upload - Moved to top and centered */}
                <div className="flex justify-center mb-4">
                  <AvatarUpload
                    initialAvatar={avatar}
                    onAvatarChange={setAvatar}
                    className="mb-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Page Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter page name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">About (Bio)</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell people about this page..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                        {isEditing ? "Updating..." : "Creating..."}
                      </span>
                    ) : (
                      isEditing ? "Update Page" : "Create Page"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Recently Created Pages Section - Now vertical */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Recently Created Pages</h2>
                <p className="text-muted-foreground text-sm">View and manage your recently created pages</p>
              </div>
            </div>
            {user ? (
              <PageGallery 
                authorId={user.id} 
                limit={6} 
                showAlphabeticNav={false} 
              />
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">Sign in to see your pages</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;
