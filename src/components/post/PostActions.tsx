import { Button } from "@/components/ui/button";
import { ImagePlus, Music, Globe, Lock, Video } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostActionsProps {
  onImageAdd: () => void;
  onAudioAdd: () => void;
  onVideoAdd: () => void;
  onSubmit: () => void;
  isUploading: boolean;
  images: { filename: string; url: string }[];
  audioFiles: { filename: string; url: string }[];
  videos: { filename: string; url: string }[];
  showPrivacyDropdown?: boolean;
  visibility?: "public" | "private";
  onVisibilityChange?: (value: "public" | "private") => void;
}

export const PostActions = ({
  onImageAdd,
  onAudioAdd,
  onVideoAdd,
  onSubmit,
  isUploading,
  images,
  audioFiles,
  videos,
  showPrivacyDropdown = false,
  visibility = "public",
  onVisibilityChange,
}: PostActionsProps) => {
  const { theme } = useTheme();

  const hasFiles = images.length > 0 || audioFiles.length > 0 || videos.length > 0;
  const showPostButton = theme?.allowTextBeforeAttachment || hasFiles;

  const handleImageClick = () => {
    console.log('PostActions - Image button clicked');
    onImageAdd();
  };

  return (
    <div className={`flex ${theme?.allowTextBeforeAttachment ? 'flex-row justify-between items-center' : 'flex-col'} gap-2`}>
      <div className={`flex gap-2 ${theme?.allowTextBeforeAttachment ? '' : 'flex-1'}`}>
        <Button
          variant={hasFiles ? "secondary" : theme?.allowTextBeforeAttachment ? "outline" : "default"}
          onClick={handleImageClick}
          className={theme?.allowTextBeforeAttachment ? 'w-10 h-10 p-0' : 'gap-2 flex-1'}
          disabled={isUploading}
          size={theme?.allowTextBeforeAttachment ? "icon" : "default"}
        >
          {isUploading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <ImagePlus className="w-4 h-4" />
          )}
          {!theme?.allowTextBeforeAttachment && (isUploading ? "Uploading..." : "Add Image")}
        </Button>
        <Button
          variant={hasFiles ? "secondary" : theme?.allowTextBeforeAttachment ? "outline" : "default"}
          onClick={onAudioAdd}
          className={theme?.allowTextBeforeAttachment ? 'w-10 h-10 p-0' : 'gap-2 flex-1'}
          disabled={isUploading}
          size={theme?.allowTextBeforeAttachment ? "icon" : "default"}
        >
          {isUploading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Music className="w-4 h-4" />
          )}
          {!theme.allowTextBeforeAttachment && (isUploading ? "Uploading..." : "Add Audio")}
        </Button>
        {
          theme?.allowVideoUpload && (
            <Button
              variant={hasFiles ? "secondary" : theme?.allowTextBeforeAttachment ? "outline" : "default"}
              onClick={onVideoAdd}
              className={theme?.allowTextBeforeAttachment ? 'w-10 h-10 p-0' : 'gap-2 flex-1'}
              disabled={isUploading}
              size={theme?.allowTextBeforeAttachment ? "icon" : "default"}
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Video className="w-4 h-4" />
              )}
              {!theme?.allowTextBeforeAttachment && (isUploading ? "Uploading..." : "Add Video")}
            </Button>
          )
        }
      </div>

      {showPostButton && (
        <div className={`flex items-center gap-2 ${!theme.allowTextBeforeAttachment ? 'w-full justify-between' : ''}`}>
          {theme?.allowTextBeforeAttachment && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={hasFiles ? "secondary" : "outline"}
                  className="w-10 h-10 p-0"
                  size="icon"
                >
                  {visibility === 'private' ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onVisibilityChange('public')}>
                  <Globe className="mr-2 h-4 w-4" />
                  <span>Public</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onVisibilityChange('private')}>
                  <Lock className="mr-2 h-4 w-4" />
                  <span>Private</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {!theme?.allowTextBeforeAttachment && showPrivacyDropdown && onVisibilityChange && (
            <Select value={visibility} onValueChange={onVisibilityChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button
            variant="default"
            onClick={onSubmit}
            className={`gap-2 ${theme?.allowTextBeforeAttachment ? 'min-w-[80px]' : 'min-w-[180px]'}`}
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Post"}
          </Button>
        </div>
      )}
    </div>
  );
};
