import React, { createContext, useContext, useState } from 'react';

interface AudioContextType {
  activePlayerId: string | null;
  setActivePlayerId: (id: string | null) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);

  return (
    <AudioContext.Provider value={{ activePlayerId, setActivePlayerId }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudioContext() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudioContext must be used within an AudioProvider');
  }
  return context;
}
