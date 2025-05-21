import { Music, Mic, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AudioRecorder } from "@/components/AudioRecorder";

interface AudioDialogProps {
  showDialog: boolean;
  onDialogChange: (show: boolean) => void;
  showRecorder: boolean;
  onRecorderChange: (show: boolean) => void;
  onAudioRecorded: (audioBlob: Blob) => Promise<void>;
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
  onAudioFileSelect: () => void;
}

export const AudioDialog = ({
  showDialog,
  onDialogChange,
  showRecorder,
  onRecorderChange,
  onAudioRecorded,
  isUploading,
  setIsUploading,
  onAudioFileSelect,
}: AudioDialogProps) => {
  return (
    <Dialog open={showDialog} onOpenChange={isUploading ? undefined : onDialogChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Audio</DialogTitle>
        </DialogHeader>
        {isUploading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Uploading audio...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {showRecorder ? (
              <AudioRecorder
                onSave={onAudioRecorded}
                onCancel={() => {
                  onRecorderChange(false);
                  onDialogChange(false);
                }}
              />
            ) : (
              <div className="flex flex-col gap-2">
                <Button onClick={() => onRecorderChange(true)} className="gap-2">
                  <Mic className="w-4 h-4" />
                  Record Audio
                </Button>
                <div className="relative">
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={onAudioFileSelect}
                  >
                    <Music className="w-4 h-4" />
                    Upload Audio File
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
