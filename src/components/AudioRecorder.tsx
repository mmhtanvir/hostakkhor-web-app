import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Upload, Pause, RedoDot, Disc, Disc2, Loader2 } from "lucide-react";
import { AudioVisualizer } from "./AudioVisualizer";
import { WavEncoder } from "@/utils/WavEncoder";

interface AudioRecorderProps {
  onSave: (audioBlob: Blob) => Promise<void>;
  onCancel: () => void;
}

export const AudioRecorder = ({ onSave, onCancel }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const timerIntervalRef = useRef<number>();
  const wavEncoderRef = useRef<WavEncoder | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup: stop all tracks when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (wavEncoderRef.current) {
        wavEncoderRef.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Initialize WAV encoder
      wavEncoderRef.current = new WavEncoder();
      wavEncoderRef.current.startRecording(stream);

      pausedDurationRef.current = 0;
      setIsRecording(true);
      setIsPaused(false);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Error accessing microphone. Please ensure you have granted microphone permissions.");
    }
  };

  const stopRecording = async () => {
    if (isRecording && wavEncoderRef.current) {
      setIsProcessing(true);
      try {
        const audioBlob = wavEncoderRef.current.stopRecording();
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setRecordedAudio(audioBlob);
      } catch (error) {
        console.error("Error processing audio:", error);
      } finally {
        setIsProcessing(false);
        setIsRecording(false);
        setIsPaused(false);
      }
    }
  };

  const togglePause = () => {
    if (!isRecording) return;
    setIsPaused(!isPaused);
  };

  const handleSave = async () => {
    if (recordedAudio) {
      setIsProcessing(true);
      try {
        await onSave(recordedAudio);
      } catch (error) {
        console.error("Error saving audio:", error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-4">
      {isRecording && streamRef.current && !isPaused && (
        <div className="space-y-2">
          <AudioVisualizer stream={streamRef.current} />
          <div className="flex items-center justify-center space-x-2">
            <span className="relative flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex size-3 rounded-full bg-red-500"></span>
            </span>
            <p className="text-center text-sm text-gray-500">
              Recording
            </p>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Uploading audio...</p>
        </div>
      )}

      {recordedAudio && !isRecording && !isProcessing && (
        <div className="space-y-2">
          <div className="relative">
            <audio
              controls
              src={URL.createObjectURL(recordedAudio)}
              className="w-full"
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-4">
        {!recordedAudio ? (
          <>
            <Button
              variant={isRecording ? "destructive" : "default"}
              size="sm"
              onClick={isRecording ? stopRecording : startRecording}
              className="gap-2"
              disabled={isProcessing}
            >
              {isRecording ? (
                <>
                  <Square className="w-4 h-4" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Start Recording
                </>
              )}
            </Button>
            {isRecording && (
              <Button
                variant="outline"
                size="sm"
                onClick={togglePause}
                className="gap-2"
                disabled={isProcessing}
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4" />
                    Resume Recording
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                )}
              </Button>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              className="gap-2"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Disc className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isProcessing ? 'Uploading...' : 'Upload'}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRecordedAudio(null);
                  setIsRecording(false);
                  setIsPaused(false);
                }}
                disabled={isProcessing}
              >
                <RedoDot className="w-4 h-4 mr-2" />
                Record Again
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
