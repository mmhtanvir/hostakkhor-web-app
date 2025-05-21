import { useState, useEffect } from "react";
import { X, MicIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AudioDialog } from "@/components/post/AudioDialog";
import { processAndUploadAudio, processAndUploadRecordedAudio, deleteFile } from "@/actions/actions";
import { Button } from "@/components/ui/button";

interface AudioUploaderProps {
  audioFiles: Array<{ filename: string; url: string }>;
  onAudioAdd: (newAudioFiles: Array<{ filename: string; url: string }>) => void;
  onAudioRemove: (index: number) => void;
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
  isEditMode?: boolean;
}

export const AudioUploader = ({
  audioFiles,
  onAudioAdd,
  onAudioRemove,
  isUploading,
  setIsUploading,
  isEditMode = false,
}: AudioUploaderProps) => {
  const [showAudioDialog, setShowAudioDialog] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);

  // Listen for custom event to open audio dialog
  useEffect(() => {
    const handleOpenAudioDialog = () => {
      setShowAudioDialog(true);
    };

    // Add event listener
    document.addEventListener('open-audio-dialog', handleOpenAudioDialog);
    
    // Clean up
    return () => {
      document.removeEventListener('open-audio-dialog', handleOpenAudioDialog);
    };
  }, []);

  const handleAudioFileSelect = async (files: FileList) => {
    if (!files || files.length === 0) {
      return;
    }

    if (audioFiles.length + files.length > 2) {
      toast({
        title: "Maximum audio files exceeded",
        description: "You can only add up to 2 audio files in total",
        variant: "destructive",
      });
      return;
    }

    const invalidFiles = Array.from(files).filter(file => !file.type.startsWith('audio/'));
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file type",
        description: "Please select only audio files",
        variant: "destructive",
      });
      return;
    }

    try {
      // Process and upload audio files
      const uploadedAudioFiles = await processAndUploadAudio(files, setIsUploading);
      
      // Update state with new audio files
      onAudioAdd(uploadedAudioFiles);
      
      // Close dialog
      setShowAudioDialog(false);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload one or more audio files. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRecordedAudio = async (audioBlob: Blob) => {
    try {
      // fake delay maker
      // await new Promise(resolve => setTimeout(resolve, 10000));
      // Process and upload recorded audio
      const uploadedFile = await processAndUploadRecordedAudio(audioBlob, setIsUploading);
      
      // Update state with new audio file
      onAudioAdd([uploadedFile]);
      
      // Close dialogs
      setShowRecorder(false);
      setShowAudioDialog(false);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload audio recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {audioFiles.length > 0 && (
        <div className="space-y-2 mb-4">
          {audioFiles.map((audio, index) => (
            <div key={index} className="relative group bg-gray-50 p-3 rounded-lg">
              <audio controls src={audio.url} className="w-full" />
              <button
                onClick={() => onAudioRemove(index)}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white opacity-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        type="file"
        id="audio-input"
        accept="audio/*"
        multiple
        onChange={(e) => handleAudioFileSelect(e.target.files!)}
        className="hidden"
      />

      <AudioDialog
        showDialog={showAudioDialog}
        onDialogChange={setShowAudioDialog}
        showRecorder={showRecorder}
        onRecorderChange={setShowRecorder}
        onAudioRecorded={handleRecordedAudio}
        isUploading={isUploading}
        setIsUploading={setIsUploading}
        onAudioFileSelect={() => {
          const audioInput = document.getElementById('audio-input') as HTMLInputElement;
          audioInput?.click();
        }}
      />
    </>
  );
};
