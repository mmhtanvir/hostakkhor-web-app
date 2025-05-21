import { X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { processAndUploadImages } from "@/actions/actions";

interface ImageUploaderProps {
  images: Array<{ filename: string; url: string }>;
  onImageAdd: (newImages: Array<{ filename: string; url: string }>) => void;
  onImageRemove: (index: number) => void;
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
}

export const ImageUploader = ({
  images,
  onImageAdd,
  onImageRemove,
  isUploading,
  setIsUploading,
}: ImageUploaderProps) => {
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    console.log('ImageUploader - Selected files:', files?.length);
    
    if (!files || files.length === 0) {
      console.log('ImageUploader - No files selected');
      return;
    }

    if (images.length + files.length > 10) {
      toast({
        title: "Maximum images exceeded",
        description: "You can only add up to 10 images in total",
        variant: "destructive",
      });
      return;
    }

    const invalidFiles = Array.from(files).filter(
      (file) => !file.type.startsWith("image/")
    );
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file type",
        description: "Please select only image files",
        variant: "destructive",
      });
      return;
    }

    try {
      // Process and upload images
      const uploadedImages = await processAndUploadImages(files, setIsUploading);
      
      // Update state with new images
      onImageAdd(uploadedImages);
    } catch (error) {
      console.error('Error processing images:', error);
      toast({
        title: "Error processing images",
        description: "There was an error processing your images. Please try again.",
        variant: "destructive",
      });
    } finally {
      event.target.value = "";
    }
  };

  return (
    <>
      <input
        type="file"
        id="image-input"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image.url}
                alt={`Post image ${index + 1}`}
                className="w-full h-40 object-cover rounded-lg"
              />
              <button
                onClick={() => onImageRemove(index)}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white opacity-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
