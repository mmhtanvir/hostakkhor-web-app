import { X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface VideoUploaderProps {
  videos: Array<{ filename: string; url: string }>;
  onVideoAdd: (files: FileList) => void;
  onVideoRemove: (index: number) => void;
  isUploading: boolean;
}

export const VideoUploader = ({
  videos,
  onVideoAdd,
  onVideoRemove,
  isUploading,
}: VideoUploaderProps) => {
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    console.log('VideoUploader - Selected files:', files?.length);
    
    if (!files || files.length === 0) {
      console.log('VideoUploader - No files selected');
      return;
    }

    if (videos.length + files.length > 3) {
      toast({
        title: "Maximum videos exceeded",
        description: "You can only add up to 3 videos in total",
        variant: "destructive",
      });
      return;
    }

    const invalidFiles = Array.from(files).filter(
      (file) => !file.type.startsWith("video/")
    );
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file type",
        description: "Please select only video files",
        variant: "destructive",
      });
      return;
    }

    // Check file size (limit to 100MB per file)
    const oversizedFiles = Array.from(files).filter(
      (file) => file.size > 100 * 1024 * 1024
    );
    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: "Video files must be under 100MB",
        variant: "destructive",
      });
      return;
    }

    onVideoAdd(files);
    event.target.value = "";
  };

  return (
    <>
      <input
        type="file"
        id="video-input"
        accept="video/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      {videos.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {videos.map((video, index) => (
            <div key={index} className="relative group">
              <video
                src={video.url}
                className="w-full h-40 object-cover rounded-lg"
                controls
              />
              <button
                onClick={() => onVideoRemove(index)}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white opacity-100"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
