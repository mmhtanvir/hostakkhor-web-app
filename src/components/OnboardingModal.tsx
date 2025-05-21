import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, ArrowLeft, ArrowRight, Pin } from "lucide-react";
import { getQuarksInstance } from "@/api/quarksInstance";
import { IUser } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import AvatarPlaceholderImage from "@/assets/avatar placceholder.png";
import PinnedPost from "./PinnedPost";
import PinnedPostThemePicker from "./PinnedPostThemePicker";
import { updatePinnedPostTheme } from "@/actions/actions";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const OnboardingModal = ({ isOpen, onClose, userId }: OnboardingModalProps) => {
  const FILE_SERVER_URL = import.meta.env.VITE_FILE_SERVER_URL;
  const navigate = useNavigate();
  const { user, updateUser } = useUser();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileUser, setProfileUser] = useState<IUser | null>(null);
  const [pinnedPostTheme, setPinnedPostTheme] = useState<'default' | 'golden'>('golden');
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    profileImageUrl: "",
  });

  useEffect(() => {
    if (user) {
      setProfileUser(user);
      setFormData({
        name: user.name || "",
        bio: user.bio || "",
        profileImageUrl: user.profileImageUrl || "",
      });
    }
  }, [user]);

  const deleteFile = async (filename: string) => {
    try {
      const response = await fetch(`${FILE_SERVER_URL}/delete/${filename}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }
      console.log("Delete successful");
    } catch (error) {
      console.error("Delete error:", error);
      throw error;
    }
  };

  const handleProfileImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !profileUser?.id) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      if (
        profileUser?.profileImageUrl &&
        profileUser.profileImageUrl.startsWith(FILE_SERVER_URL)
      ) {
        await deleteFile(profileUser?.profileImageUrl.split("/").pop() || "");
      }

      const response = await fetch(`${FILE_SERVER_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload image");

      const { filename } = await response.json();
      const newImageUrl = `${FILE_SERVER_URL}/files/${filename}`;

      // Update form state
      setFormData((prev) => ({
        ...prev,
        profileImageUrl: newImageUrl,
      }));

      // Update user in database
      const updatedProfile = {
        ...profileUser,
        profileImageUrl: newImageUrl,
      };
      await getQuarksInstance()
        .collection<IUser>("users")
        .doc(profileUser.id)
        .update(updatedProfile);

      // Update user context
      updateUser(updatedProfile);

      toast({
        title: "Success",
        description: "Profile image updated successfully",
      });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      toast({
        title: "Error",
        description: "Failed to upload profile image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!profileUser?.id) return;

    setIsLoading(true);
    try {
      const updatedProfile = {
        ...profileUser,
        ...formData,
      };

      // Update user in database
      await getQuarksInstance()
        .collection<IUser>("users")
        .doc(profileUser.id)
        .update(updatedProfile);
      updateUser(updatedProfile);

      // Update pinned post theme
      await updatePinnedPostTheme(profileUser.id, pinnedPostTheme);

      // Move to next step or close modal
      if (step === 1) {
        setStep(2);
      } else {
        onClose();
        navigate(`/`);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (step === 1) {
      setStep(2);
    } else {
      onClose();
      navigate(`/`);
    }
  };

  if (!isOpen || !profileUser) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {step === 1 ? "Complete Your Profile" : "Set Up Your Pinned Post"}
          </h2>
          <div className="text-sm text-muted-foreground">
            Step {step} of 2
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="relative group">
                  <Avatar 
                    className="h-32 w-32 mb-4" 
                    style={{
                      backgroundImage: `url(${AvatarPlaceholderImage})`, 
                      backgroundSize: 'cover'
                    }}
                  >
                    <AvatarImage
                      src={formData.profileImageUrl}
                      alt={formData.name || "User"}
                    />
                  </Avatar>
                  <label
                    htmlFor="profile-image"
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer shadow-md hover:bg-primary/90 transition-colors"
                  >
                    {isUploadingImage ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    ) : (
                      <Camera className="h-8 w-8" />
                    )}
                  </label>
                  <input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfileImageUpload}
                    disabled={isUploadingImage}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Click the camera icon to upload a profile picture
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-lg">Select Pinned Post Theme</h4>

                <PinnedPostThemePicker 
                  userId={profileUser?.id || ''}
                  currentTheme={pinnedPostTheme}
                  onThemeChange={(theme) => {
                    setPinnedPostTheme(theme);
                    // Update user's theme preference
                    if (profileUser?.id) {
                      getQuarksInstance()
                        .collection<IUser>('users')
                        .doc(profileUser.id)
                        .update({ pinnedPostTheme: theme });
                    }
                  }}
                />
              </div>
              
              {/* PinnedPost component */}
              <PinnedPost 
                userId={profileUser?.id} 
                theme={pinnedPostTheme}
                onThemeChange={setPinnedPostTheme}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-between">
          {step === 1 ? (
            <>
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : null}
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleSkip}
                className="flex items-center gap-2"
              >
                Finish
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
