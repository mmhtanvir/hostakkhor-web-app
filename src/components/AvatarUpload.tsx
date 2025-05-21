import { Camera } from "lucide-react";
import { useState, useEffect } from "react";
import { uploadFile } from "@/actions/actions";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploadProps {
  initialAvatar?: { filename: string; url: string } | null;
  onAvatarChange: (avatar: { filename: string; url: string } | null) => void;
  className?: string;
}

const AvatarUpload = ({ initialAvatar, onAvatarChange, className = "" }: AvatarUploadProps) => {
  const [avatar, setAvatar] = useState<{ filename: string; url: string } | null>(initialAvatar || null);
  const { toast } = useToast();

  // Update avatar when initialAvatar changes
  useEffect(() => {
    if (initialAvatar) {
      setAvatar(initialAvatar);
    }
  }, [initialAvatar]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadedFile = await uploadFile(file);
      if (uploadedFile) {
        setAvatar(uploadedFile);
        onAvatarChange(uploadedFile);
        toast({
          title: "Avatar uploaded successfully",
        });
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error uploading avatar",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
        {avatar?.url ? (
          <img src={avatar.url} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="text-muted-foreground text-4xl">
            <Camera />
          </div>
        )}
      </div>
      <label
        htmlFor="avatar-upload"
        className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer shadow-md hover:bg-primary/90 transition-colors"
      >
        <Camera className="h-4 w-4" />
      </label>
      <input
        id="avatar-upload"
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        className="hidden"
      />
    </div>
  );
};

export default AvatarUpload;
