/**
 * AudioContext - Shared audio state across the application
 * Provides global audio player state and controls
 */

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, ReactNode } from 'react'
import { useAudioPlayer } from '@/hooks/use-audio-player'
import type { UseAudioPlayerReturn } from '@/hooks/use-audio-player'

// Context type - use the return type directly from the hook
type AudioContextType = UseAudioPlayerReturn

// Create context with undefined default
const AudioContext = createContext<AudioContextType | undefined>(undefined)

// Provider props
interface AudioProviderProps {
  children: ReactNode
  initialReciterId?: number
}

/**
 * AudioProvider - Wraps the app to provide global audio state
 */
export function AudioProvider({ children, initialReciterId }: AudioProviderProps) {
  const audioPlayer = useAudioPlayer({ initialReciterId })

  return (
    <AudioContext.Provider value={audioPlayer}>
      {children}
    </AudioContext.Provider>
  )
}

/**
 * useAudioContext - Hook to access global audio state
 * Throws error if used outside AudioProvider
 */
export function useAudioContext(): AudioContextType {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudioContext must be used within an AudioProvider')
  }
  return context
}

/**
 * Hook to safely access audio context (returns undefined if outside provider)
 */
export function useAudioContextSafe(): AudioContextType | undefined {
  return useContext(AudioContext)
}
