/**
 * useAudioPlayer - Custom hook for managing Quran audio playback
 * Handles play, pause, seek, next/previous, repeat modes
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import type { PlaybackState, RepeatMode } from '@/types/audio'
import { getValidAudioUrl, formatTime, getAudioPreferences, saveAudioPreferences } from '@/lib/audio-utils'

/* eslint-disable react-hooks/exhaustive-deps */

// Extend HTMLAudioElement to include timeout tracking
interface AudioElementWithTimeout extends HTMLAudioElement {
  _playTimeout: ReturnType<typeof setTimeout> | null
}

export interface AudioPlayerOptions {
  initialReciterId?: number
  totalVerses?: number // Total verses in current surah for auto-continue logic
  onPlay?: (surahNumber: number, ayahNumber: number) => void
  onPause?: () => void
  onError?: (error: Error) => void
  onTimeUpdate?: (currentTime: number, duration: number) => void
}

export interface UseAudioPlayerReturn {
  // State
  playbackState: PlaybackState
  currentSurah: number | null
  currentAyah: number | null
  currentTime: number
  duration: number
  volume: number
  speed: number
  repeatMode: RepeatMode
  repeatCount: number
  currentRepeatIteration: number
  reciterId: number

  // Actions
  play: (surahNumber: number, ayahNumber: number) => Promise<void>
  pause: () => void
  togglePlayPause: () => Promise<void>
  seek: (time: number) => void
  setVolume: (volume: number) => void
  setSpeed: (speed: number) => void
  setRepeatMode: (mode: RepeatMode) => void
  setRepeatCount: (count: number) => void
  setReciterId: (reciterId: number) => void
  playNext: () => Promise<void>
  playPrevious: () => Promise<void>
  stop: () => void

  // Utilities
  formatTime: (seconds: number) => string
  isPlaying: () => boolean
  canPlayNext: (totalVerses?: number) => boolean
  canPlayPrevious: () => boolean

  // Cleanup
  cleanup: () => void
}

export function useAudioPlayer(options: AudioPlayerOptions = {}): UseAudioPlayerReturn {
  const {
    initialReciterId,
    totalVerses: initialTotalVerses,
    onPlay,
    onPause,
    onError,
    onTimeUpdate,
  } = options

  // Load saved preferences
  const savedPrefs = getAudioPreferences()

  // Get valid reciter IDs from AVAILABLE_RECITERS
  const validReciterIds = new Set([7, 4, 3, 5, 9, 6, 10, 11, 2, 12]) // All available reciter IDs

  // Validate and fix reciterId from saved preferences
  const validReciterId = savedPrefs.defaultReciterId && validReciterIds.has(savedPrefs.defaultReciterId)
    ? savedPrefs.defaultReciterId
    : 7 // Default to Alafasy if invalid

  // State
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle')
  const playbackStateRef = useRef<PlaybackState>('idle') // Keep a ref for immediate access in callbacks

  // Sync playbackState ref when state changes
  useEffect(() => {
    playbackStateRef.current = playbackState
  }, [playbackState])
  const [currentSurah, setCurrentSurah] = useState<number | null>(null)
  const [currentAyah, setCurrentAyah] = useState<number | null>(null)
  const [totalVerses] = useState<number>(initialTotalVerses ?? 286)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(savedPrefs.volume)
  const [speed, setSpeedState] = useState(savedPrefs.speed)
  const [repeatMode, setRepeatModeState] = useState<RepeatMode>(savedPrefs.repeatMode)
  const [repeatCount, setRepeatCountState] = useState(savedPrefs.repeatCount)
  const [currentRepeatIteration, setCurrentRepeatIteration] = useState(0)
  const [reciterId, setReciterIdState] = useState(initialReciterId ?? validReciterId)

  // Refs for values that handleEnded needs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentSurahRef = useRef<number | null>(null)
  const currentAyahRef = useRef<number | null>(null)
  const repeatModeRef = useRef<RepeatMode>(repeatMode)
  const repeatCountRef = useRef<number>(repeatCount)
  const totalVersesRef = useRef<number>(totalVerses)
  const currentRepeatIterationRef = useRef<number>(0)
  const speedRef = useRef<number>(speed)
  const volumeRef = useRef<number>(volume)

  // Refs for callback functions (to avoid recreating handlers)
  const onPlayRef = useRef(onPlay)
  const onPauseRef = useRef(onPause)
  const onErrorRef = useRef(onError)
  const onTimeUpdateRef = useRef(onTimeUpdate)
  const durationRef = useRef(duration)

  // Refs for play and stop functions (to avoid circular dependency with handleEnded)
  const playRef = useRef<(surahNumber: number, ayahNumber: number) => Promise<void>>(() => Promise.resolve())
  const stopRef = useRef<() => void>(() => {})

  // Keep refs in sync with state
  useEffect(() => {
    repeatModeRef.current = repeatMode
  }, [repeatMode])

  useEffect(() => {
    repeatCountRef.current = repeatCount
  }, [repeatCount])

  useEffect(() => {
    totalVersesRef.current = totalVerses
  }, [totalVerses])

  useEffect(() => {
    currentRepeatIterationRef.current = currentRepeatIteration
  }, [currentRepeatIteration])

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  useEffect(() => {
    volumeRef.current = volume
  }, [volume])

  useEffect(() => {
    onPlayRef.current = onPlay
  }, [onPlay])

  useEffect(() => {
    onPauseRef.current = onPause
  }, [onPause])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate
  }, [onTimeUpdate])

  useEffect(() => {
    durationRef.current = duration
  }, [duration])

  // Event handlers (declared before useEffect to avoid ESLint errors)
  const handleLoadStart = useCallback(() => {
    setPlaybackState('loading')
  }, [])

  const handleCanPlay = useCallback(() => {
    // Don't change state here - let handlePlay handle the transition to 'playing'
    // This prevents the UI from flickering between loading → idle → playing
  }, [])

  const handlePlay = useCallback(() => {
    console.log('[AudioPlayer] handlePlay fired!', {
      audioPaused: audioRef.current?.paused,
      src: audioRef.current?.src,
      playbackStateRef: playbackStateRef.current
    })

    // Clear the fallback timeout since play event fired
    const timeout = (audioRef.current as AudioElementWithTimeout | null)?._playTimeout
    if (timeout) {
      clearTimeout(timeout)
    }
    if (audioRef.current) {
      ;(audioRef.current as AudioElementWithTimeout)._playTimeout = null
    }

    setPlaybackState('playing')
    playbackStateRef.current = 'playing' // Update ref immediately for synchronous access
    console.log('[AudioPlayer] State set to playing, new ref value:', playbackStateRef.current)

    // Apply speed and volume from refs whenever audio starts playing
    // This ensures they persist across verse changes
    if (audioRef.current) {
      audioRef.current.playbackRate = speedRef.current
      audioRef.current.volume = volumeRef.current
    }

    // Use refs for currentSurah and currentAyah to avoid handler recreation
    const currentSurahNum = currentSurahRef.current
    const currentAyahNum = currentAyahRef.current
    if (currentSurahNum !== null && currentAyahNum !== null) {
      onPlayRef.current?.(currentSurahNum, currentAyahNum)
    }
  }, []) // Empty deps - this handler should never be recreated

  const handlePause = useCallback(() => {
    setPlaybackState('paused')
    playbackStateRef.current = 'paused' // Update ref immediately
    onPauseRef.current?.()
  }, [])

  const handleEnded = useCallback(() => {
    // Read from refs to get current values (avoid stale closures)
    const currentRepeatMode = repeatModeRef.current
    const currentRepeatCount = repeatCountRef.current
    const currentTotalVerses = totalVersesRef.current
    const currentSurahNum = currentSurahRef.current
    const currentAyahNum = currentAyahRef.current
    const iteration = currentRepeatIterationRef.current
    const playFn = playRef.current
    const stopFn = stopRef.current

    // Handle repeat modes
    if (currentRepeatMode === 'ayah') {
      // Repeat current ayah
      if (iteration < currentRepeatCount - 1) {
        const newIteration = iteration + 1
        setCurrentRepeatIteration(newIteration)
        currentRepeatIterationRef.current = newIteration
        audioRef.current?.play()
        return
      } else {
        // Reset iteration count and proceed to next
        setCurrentRepeatIteration(0)
        currentRepeatIterationRef.current = 0
      }
    }

    // Auto-play next ayah (works for all modes including 'none' and 'surah')
    if (currentSurahNum !== null && currentAyahNum !== null) {
      const nextAyah = currentAyahNum + 1

      if (currentRepeatMode === 'surah') {
        // Check if we've reached the end of the surah
        if (nextAyah > currentTotalVerses) {
          // Loop back to first ayah
          playFn(currentSurahNum, 1)
          return
        } else {
          playFn(currentSurahNum, nextAyah)
          return
        }
      } else {
        // For 'none' and 'ayah' mode, just play next if available
        if (nextAyah <= currentTotalVerses) {
          playFn(currentSurahNum, nextAyah)
          return
        } else {
          // Reached end of surah, stop playback
          stopFn()
          return
        }
      }
    }

    // Stop playback if we can't continue
    stopFn()
  }, [])

  const handleError = useCallback((e: Event) => {
    const error = (e.target as HTMLAudioElement).error
    const errorMessage = error ? `Audio error: ${error.message}` : 'Unknown audio error'
    console.error('[AudioPlayer] handleError', { error, errorMessage, src: audioRef.current?.src })
    setPlaybackState('error')
    onErrorRef.current?.(new Error(errorMessage))
  }, [])

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime
      setCurrentTime(time)
      onTimeUpdateRef.current?.(time, durationRef.current)
    }
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }, [])

  // Create audio element once on mount
  // Only recreate if handlers change, NOT when volume/speed change (those have separate effects)
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
      const audio = new Audio()
      audioRef.current = audio

      // Set initial volume and speed from saved preferences
      audio.volume = savedPrefs.volume
      audio.playbackRate = savedPrefs.speed

      // Event listeners
      audio.addEventListener('loadstart', handleLoadStart)
      audio.addEventListener('canplay', handleCanPlay)
      audio.addEventListener('play', handlePlay)
      audio.addEventListener('pause', handlePause)
      audio.addEventListener('ended', handleEnded)
      audio.addEventListener('error', handleError)
      audio.addEventListener('timeupdate', handleTimeUpdate)
      audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    }

    return () => {
      if (audioRef.current) {
        cleanup()
      }
    }
     
  }, [handleLoadStart, handleCanPlay, handlePlay, handlePause, handleEnded, handleError, handleTimeUpdate, handleLoadedMetadata])

  // Update volume when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
    saveAudioPreferences({ volume })
  }, [volume])

  // Update speed when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed
    }
    saveAudioPreferences({ speed })
  }, [speed])

  // Update repeat mode when changed
  useEffect(() => {
    saveAudioPreferences({ repeatMode })
  }, [repeatMode])

  // Update repeat count when changed
  useEffect(() => {
    saveAudioPreferences({ repeatCount })
  }, [repeatCount])

  // Update reciter ID when changed
  useEffect(() => {
    saveAudioPreferences({ defaultReciterId: reciterId })
  }, [reciterId])

  // Play a specific ayah
  const play = useCallback(async (surahNumber: number, ayahNumber: number) => {
    if (!audioRef.current) {
      return
    }

    try {
      console.log('[AudioPlayer] play() called for', { surahNumber, ayahNumber })
      setPlaybackState('loading')
      setCurrentSurah(surahNumber)
      setCurrentAyah(ayahNumber)
      currentSurahRef.current = surahNumber
      currentAyahRef.current = ayahNumber
      setCurrentRepeatIteration(0)
      currentRepeatIterationRef.current = 0

      // Get a valid audio URL (with fallback to Alafasy if reciter doesn't have this surah)
      const url = await getValidAudioUrl(surahNumber, ayahNumber, reciterId)
      console.log('[AudioPlayer] Using URL:', url)
      audioRef.current.src = url

      // Clear any existing fallback timeout from previous play attempts
      const timeout = (audioRef.current as AudioElementWithTimeout)._playTimeout
      if (timeout) {
        clearTimeout(timeout)
      }
      ;(audioRef.current as AudioElementWithTimeout)._playTimeout = null

      // Preserve current speed and volume after loading new audio
      audioRef.current.volume = volume
      audioRef.current.playbackRate = speed

      console.log('[AudioPlayer] Calling audio.play()...')
      await audioRef.current.play()
      console.log('[AudioPlayer] audio.play() succeeded')

      // Fallback: if play() succeeds but handlePlay doesn't fire within 10ms,
      // manually transition to playing state (this handles browsers that don't fire play event)
      const playTimeout = setTimeout(() => {
        if (playbackStateRef.current === 'loading') {
          console.log('[AudioPlayer] Play timeout - manually setting to playing')
          setPlaybackState('playing')
          playbackStateRef.current = 'playing'
        }
      }, 10)

      // Store timeout reference so we can cancel it if handlePlay fires
      ;(audioRef.current as AudioElementWithTimeout)._playTimeout = playTimeout
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to play audio'
      console.error('[AudioPlayer] play() error:', error)
      setPlaybackState('error')
      onError?.(new Error(errorMessage))
    }
  }, [reciterId, volume, speed, onError, onPlay, playbackState])

  // Update play ref
  playRef.current = play

  // Pause playback
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }, [])

  // Toggle play/pause
  const togglePlayPause = useCallback(async () => {
    if (!audioRef.current) return

    if (playbackState === 'playing') {
      pause()
    } else if (currentSurah !== null && currentAyah !== null) {
      // Resume if we have audio loaded
      if (audioRef.current.src && !audioRef.current.ended) {
        try {
          await audioRef.current.play()
        } catch (error) {
          onError?.(error instanceof Error ? error : new Error('Failed to resume playback'))
        }
      } else {
        // Play from current position
        await play(currentSurah, currentAyah)
      }
    }
  }, [playbackState, currentSurah, currentAyah, pause, play, onError])

  // Keyboard shortcut: space bar to toggle play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if space is pressed and not in an input/textarea
      if (e.code === 'Space' &&
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault() // Prevent page scroll
        togglePlayPause()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlayPause])

  // Seek to a specific time
  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(time, duration))
      setCurrentTime(time)
    }
  }, [duration])

  // Set volume
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    setVolumeState(clampedVolume)
  }, [])

  // Set playback speed
  const setSpeed = useCallback((newSpeed: number) => {
    const clampedSpeed = Math.max(0.5, Math.min(2, newSpeed))
    setSpeedState(clampedSpeed)
  }, [])

  // Set repeat mode
  const setRepeatMode = useCallback((mode: RepeatMode) => {
    setRepeatModeState(mode)
    setCurrentRepeatIteration(0)
  }, [])

  // Set repeat count
  const setRepeatCount = useCallback((count: number) => {
    const clampedCount = Math.max(1, Math.min(10, count))
    setRepeatCountState(clampedCount)
  }, [])

  // Set reciter ID
  const setReciterId = useCallback((newReciterId: number) => {
    setReciterIdState(newReciterId)
  }, [])

  // Play next ayah
  const playNext = useCallback(async (totalVerses?: number) => {
    if (currentAyah === null || currentSurah === null) return

    const nextAyah = totalVerses && currentAyah < totalVerses ? currentAyah + 1 : null

    if (nextAyah !== null) {
      await play(currentSurah, nextAyah)
    } else if (repeatMode === 'surah') {
      // Loop back to first ayah
      await play(currentSurah, 1)
    } else {
      // Stop playback
      stop()
    }
  }, [currentAyah, currentSurah, repeatMode, play])

  // Play previous ayah
  const playPrevious = useCallback(async () => {
    if (currentAyah === null || currentSurah === null) return

    const prevAyah = currentAyah > 1 ? currentAyah - 1 : null

    if (prevAyah !== null) {
      await play(currentSurah, prevAyah)
    }
  }, [currentAyah, currentSurah, play])

  // Stop playback
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlaybackState('idle')
    }
  }, [])

  // Update stop ref
  stopRef.current = stop

  // Check if currently playing
  const isPlaying = useCallback(() => {
    const result = playbackState === 'playing'
    console.log('[AudioPlayer] isPlaying() called, returning:', result, { playbackState })
    return result
  }, [playbackState])

  // Check if next ayah is available
  const canPlayNext = useCallback((totalVerses: number = 286) => {
    if (currentAyah === null || currentSurah === null) return false
    return currentAyah < totalVerses || repeatMode === 'surah'
  }, [currentAyah, currentSurah, repeatMode])

  // Check if previous ayah is available
  const canPlayPrevious = useCallback(() => {
    if (currentAyah === null) return false
    return currentAyah > 1
  }, [currentAyah])

  // Cleanup
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.removeEventListener('loadstart', handleLoadStart)
      audioRef.current.removeEventListener('canplay', handleCanPlay)
      audioRef.current.removeEventListener('play', handlePlay)
      audioRef.current.removeEventListener('pause', handlePause)
      audioRef.current.removeEventListener('ended', handleEnded)
      audioRef.current.removeEventListener('error', handleError)
      audioRef.current.removeEventListener('timeupdate', handleTimeUpdate)
      audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audioRef.current.src = ''
      audioRef.current = null
    }
  }, [])

  return {
    // State
    playbackState,
    currentSurah,
    currentAyah,
    currentTime,
    duration,
    volume,
    speed,
    repeatMode,
    repeatCount,
    currentRepeatIteration,
    reciterId,

    // Actions
    play,
    pause,
    togglePlayPause,
    seek,
    setVolume,
    setSpeed,
    setRepeatMode,
    setRepeatCount,
    setReciterId,
    playNext,
    playPrevious,
    stop,

    // Utilities
    formatTime,
    isPlaying,
    canPlayNext,
    canPlayPrevious,

    // Cleanup
    cleanup,
  }
}
