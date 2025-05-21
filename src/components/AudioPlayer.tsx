import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAudioContext } from "@/contexts/AudioContext";
import { nanoid } from "nanoid";
import { usePinnedPostTheme } from "@/contexts/PinnedPostThemeContext";

interface AudioPlayerProps {
  audioUrl?: string;
  audioFiles?: string[];
  postId?: string; // Add postId to identify the player
}

const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const AudioPlayer = ({ audioUrl, audioFiles = [], postId = "" }: AudioPlayerProps) => {
  // Use all audio files if available, otherwise use the single audioUrl
  const allAudioFiles = audioFiles.length > 0 ? audioFiles : (audioUrl ? [audioUrl] : []);
  const hasMultipleAudios = allAudioFiles.length > 1;
  
  // Generate a unique ID for this player instance if not provided
  const playerIdRef = useRef<string>(postId || `player-${nanoid(6)}`);
  const playerId = playerIdRef.current;
  
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // Get the global audio context to manage which player is active
  const { activePlayerId, setActivePlayerId } = useAudioContext();

  // Get the current audio URL
  const currentAudioUrl = allAudioFiles[currentAudioIndex];
  
  // Check if this player is the active one
  const isActivePlayer = activePlayerId === playerId;

  // Get theme from context or use provided theme prop
  const { theme: contextTheme, themeStyles } = usePinnedPostTheme();

  // Reset player state when changing audio files
  useEffect(() => {
    setCurrentTime(0);
    
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      
      // Auto-play when switching tracks using navigation buttons
      if (isPlaying) {
        audioRef.current.play()
          .catch(err => console.error("Failed to auto-play:", err));
      }
    }
  }, [currentAudioIndex]);
  
  // Stop playing when another player becomes active
  useEffect(() => {
    if (isPlaying && !isActivePlayer) {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [activePlayerId, isPlaying, isActivePlayer]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (hasMultipleAudios && currentAudioIndex < allAudioFiles.length - 1) {
        // Auto-play next audio when current one ends
        setCurrentAudioIndex(prev => prev + 1);
        setIsPlaying(true);
        setTimeout(() => {
          if (audioRef.current) audioRef.current.play();
        }, 100);
      } else {
        setIsPlaying(false);
        setActivePlayerId(null);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentAudioIndex, hasMultipleAudios, allAudioFiles.length, setActivePlayerId]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setActivePlayerId(null);
    } else {
      // Set this player as the active player
      setActivePlayerId(playerId);
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(err => {
          console.error("Failed to play:", err);
          setIsPlaying(false);
          setActivePlayerId(null);
        });
    }
  };

  const handleProgressBarClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressBarRef.current) return;

    const progressBar = progressBarRef.current;
    const rect = progressBar.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;
    const percentage = x / width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  const playPreviousAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentAudioIndex > 0) {
      setCurrentAudioIndex(prev => prev - 1);
      // Auto-play will be handled in the useEffect that watches currentAudioIndex
      if (!isPlaying) {
        setIsPlaying(true);
        setActivePlayerId(playerId);
      }
    }
  };
  
  const playNextAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentAudioIndex < allAudioFiles.length - 1) {
      setCurrentAudioIndex(prev => prev + 1);
      // Auto-play will be handled in the useEffect that watches currentAudioIndex
      if (!isPlaying) {
        setIsPlaying(true);
        setActivePlayerId(playerId);
      }
    }
  };

  // If no audio files, don't render the player
  if (allAudioFiles.length === 0) return null;

  return (
    <div className="rounded-lg p-1 w-full" style={{
      backgroundColor: `var(--player-bg, ${contextTheme == 'default' ? 'rgba(0, 0, 0, 0.6))' : '#a5611d'}`,
      backdropFilter: 'blur(8px)',
      border: '1px solid var(--player-border, transparent)',
      boxShadow: 'var(--player-shadow, none)'
    }}>
      <audio ref={audioRef} src={currentAudioUrl} preload="metadata" />
      
      <div className="flex items-center gap-1">
        {/* Previous Button (only for multiple audios) */}
        {hasMultipleAudios && (
          <button
            onClick={playPreviousAudio}
            disabled={currentAudioIndex === 0}
            className={cn(
              "flex items-center justify-center h-6 w-6 rounded-full transition-colors",
              currentAudioIndex === 0 
                ? "opacity-40 cursor-not-allowed" 
                : "hover:opacity-80"
            )}
            style={{
              backgroundColor: 'var(--player-button-bg, rgba(255, 255, 255, 0.1))',
              color: 'var(--player-text, white)'
            }}
          >
            <SkipBack className="h-3 w-3" />
          </button>
        )}
        
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          className="flex items-center justify-center h-6 w-6 rounded-full transition-colors hover:opacity-80"
          style={{
            backgroundColor: 'var(--player-button-bg, rgba(255, 255, 255, 0.1))',
            color: 'var(--player-text, white)'
          }}
        >
          {isPlaying ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3 ml-0.5" />
          )}
        </button>
        
        {/* Next Button (only for multiple audios) */}
        {hasMultipleAudios && (
          <button
            onClick={playNextAudio}
            disabled={currentAudioIndex === allAudioFiles.length - 1}
            className={cn(
              "flex items-center justify-center h-6 w-6 rounded-full transition-colors",
              currentAudioIndex === allAudioFiles.length - 1 
                ? "opacity-40 cursor-not-allowed" 
                : "hover:opacity-80"
            )}
            style={{
              backgroundColor: 'var(--player-button-bg, rgba(255, 255, 255, 0.1))',
              color: 'var(--player-text, white)'
            }}
          >
            <SkipForward className="h-3 w-3" />
          </button>
        )}

        {/* Audio Counter (only for multiple audios) */}
        {hasMultipleAudios && (
          <div className="text-[10px] font-medium" style={{ color: 'var(--player-text, rgba(255, 255, 255, 0.8))' }}>
            {currentAudioIndex + 1}/{allAudioFiles.length}
          </div>
        )}

        {/* Time Display */}
        <div className="text-[10px] font-medium min-w-[60px]" style={{ color: 'var(--player-text, rgba(255, 255, 255, 0.8))' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Progress Bar */}
        <div
          ref={progressBarRef}
          className="flex-1 h-1 rounded-full cursor-pointer overflow-hidden"
          style={{ backgroundColor: 'var(--player-button-bg, rgba(255, 255, 255, 0.2))' }}
          onClick={handleProgressBarClick}
        >
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{ 
              width: `${(currentTime / duration) * 100 || 0}%`,
              backgroundColor: 'var(--player-progress, rgba(255, 255, 255, 0.8))'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
