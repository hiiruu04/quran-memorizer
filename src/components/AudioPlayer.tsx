/**
 * AudioPlayer - Per-verse audio player component
 * Provides play/pause controls for individual Quran verses
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Play, Pause, Volume2, VolumeX, Repeat, Repeat1 } from 'lucide-react'
import type { RepeatMode, Reciter } from '@/types/audio'
import { AVAILABLE_RECITERS } from '@/lib/audio-utils'

// ============================================================================
// Mini Per-Verse Player
// ============================================================================

export interface VerseAudioPlayerProps {
  isPlaying: boolean
  isLoading: boolean
  onPlay: () => void
  onPause: () => void
  compact?: boolean
}

/**
 * Mini per-verse audio player for individual verses
 * Shows play/pause button and optionally reciter name
 */
export function VerseAudioPlayer({
  isPlaying,
  isLoading,
  onPlay,
  onPause,
  compact = false,
}: VerseAudioPlayerProps) {
  const handleClick = useCallback(() => {
    if (isPlaying) {
      onPause()
    } else {
      onPlay()
    }
  }, [isPlaying, onPlay, onPause])

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        inline-flex items-center justify-center gap-1.5 md:gap-2
        px-2 md:px-3 py-1.5 md:py-2 rounded-lg
        text-xs md:text-sm font-medium
        transition-all duration-200 active:scale-95 touch-manipulation
        ${isPlaying
          ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
          : 'bg-slate-100 dark:bg-slate-700/30 text-slate-600 dark:text-slate-400 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 hover:text-cyan-600 dark:hover:text-cyan-400 border border-slate-200 dark:border-slate-600'
        }
        ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
      `}
      title={isPlaying ? 'Pause audio' : 'Play audio'}
    >
      {isLoading ? (
        <div className="w-3.5 h-3.5 md:w-4 md:h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isPlaying ? (
        <Pause className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={2.5} />
      ) : (
        <Play className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={2.5} />
      )}
      {!compact && (
        <span className="hidden sm:inline">
          {isPlaying ? 'Pause' : 'Play'}
        </span>
      )}
    </button>
  )
}

// ============================================================================
// Reciter Selector
// ============================================================================

export interface ReciterSelectorProps {
  reciterId: number
  onReciterChange: (reciterId: number) => void
  availableReciters?: Reciter[]
  disabled?: boolean
  compact?: boolean
}

/**
 * Dropdown selector for choosing reciter
 */
export function ReciterSelector({
  reciterId,
  onReciterChange,
  availableReciters = AVAILABLE_RECITERS,
  disabled = false,
  compact = false,
}: ReciterSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedReciter = availableReciters.find(r => r.id === reciterId)

  return (
    <div ref={selectRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          inline-flex items-center justify-between gap-2
          px-2 md:px-3 py-1.5 md:py-2 rounded-lg
          text-xs md:text-sm font-medium
          transition-all duration-200
          bg-white dark:bg-slate-700/30
          border border-slate-200 dark:border-slate-600
          text-slate-700 dark:text-slate-300
          hover:border-cyan-500/50
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${compact ? 'min-w-[120px]' : 'min-w-[160px]'}
        `}
        title="Select reciter"
      >
        <span className="truncate">
          {selectedReciter?.name || 'Select Reciter'}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 bottom-full mb-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg overflow-hidden">
          {availableReciters.map(reciter => (
            <button
              key={reciter.id}
              onClick={() => {
                onReciterChange(reciter.id)
                setIsOpen(false)
              }}
              className={`
                w-full text-left px-3 py-2 text-xs md:text-sm
                transition-colors duration-150
                hover:bg-cyan-50 dark:hover:bg-cyan-500/20
                ${reciter.id === reciterId
                  ? 'bg-cyan-100 dark:bg-cyan-500/30 text-cyan-700 dark:text-cyan-300 font-medium'
                  : 'text-slate-700 dark:text-slate-300'
                }
              `}
            >
              <div className="font-medium">{reciter.name}</div>
              {!compact && (
                <div className="text-xs text-slate-500 dark:text-slate-400" dir="rtl">
                  {reciter.name_arabic}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Progress Bar
// ============================================================================

export interface AudioProgressBarProps {
  currentTime: number
  duration: number
  onSeek: (time: number) => void
  disabled?: boolean
  showTime?: boolean
}

/**
 * Progress bar for seeking within audio
 */
export function AudioProgressBar({
  currentTime,
  duration,
  onSeek,
  disabled = false,
  showTime = true,
}: AudioProgressBarProps) {
  const [isDragging, setIsDragging] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (disabled || !progressRef.current) return

    const rect = progressRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const newTime = percentage * duration

    onSeek(newTime)
  }, [duration, disabled, onSeek])

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    handleSeek(e)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true)
    handleSeek(e)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && progressRef.current) {
        const rect = progressRef.current.getBoundingClientRect()
        const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        onSeek(percentage * duration)
      }
    }

    const handleMouseUp = () => setIsDragging(false)

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, duration, onSeek])

  return (
    <div className={`flex items-center gap-2 ${showTime ? 'w-full' : ''}`}>
      {showTime && (
        <span className="text-xs text-slate-500 dark:text-slate-400 min-w-[40px] tabular-nums">
          {formatTimeCompact(currentTime)}
        </span>
      )}
      <div
        ref={progressRef}
        className={`
          flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div
          className="h-full bg-cyan-500 transition-all duration-75 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {showTime && (
        <span className="text-xs text-slate-500 dark:text-slate-400 min-w-[40px] tabular-nums">
          {formatTimeCompact(duration)}
        </span>
      )}
    </div>
  )
}

// Compact time format (e.g., "1:23" instead of "01:23")
function formatTimeCompact(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) {
    return '0:00'
  }
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// ============================================================================
// Repeat Mode Toggle
// ============================================================================

export interface RepeatModeToggleProps {
  repeatMode: RepeatMode
  onRepeatModeChange: (mode: RepeatMode) => void
  disabled?: boolean
}

/**
 * Toggle button for cycling through repeat modes
 */
export function RepeatModeToggle({
  repeatMode,
  onRepeatModeChange,
  disabled = false,
}: RepeatModeToggleProps) {
  const cycleRepeatMode = useCallback(() => {
    const modes: RepeatMode[] = ['none', 'ayah', 'surah']
    const currentIndex = modes.indexOf(repeatMode)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    onRepeatModeChange(nextMode)
  }, [repeatMode, onRepeatModeChange])

  const getIcon = () => {
    if (repeatMode === 'ayah') {
      return <Repeat1 className="w-4 h-4" />
    }
    return <Repeat className="w-4 h-4" />
  }

  return (
    <button
      onClick={cycleRepeatMode}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center
        p-2 rounded-lg transition-all duration-200
        ${repeatMode !== 'none'
          ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400'
          : 'bg-slate-100 dark:bg-slate-700/30 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer touch-manipulation'}
      `}
      title={`Repeat: ${repeatMode}`}
    >
      {getIcon()}
    </button>
  )
}

// ============================================================================
// Volume Control
// ============================================================================

export interface VolumeControlProps {
  volume: number
  onVolumeChange: (volume: number) => void
  disabled?: boolean
}

/**
 * Volume control with mute toggle
 */
export function VolumeControl({
  volume,
  onVolumeChange,
  disabled = false,
}: VolumeControlProps) {
  const [previousVolume, setPreviousVolume] = useState(volume)
  const sliderRef = useRef<HTMLDivElement>(null)

  const isMuted = volume === 0

  const toggleMute = useCallback(() => {
    if (isMuted) {
      onVolumeChange(previousVolume > 0 ? previousVolume : 1)
    } else {
      setPreviousVolume(volume)
      onVolumeChange(0)
    }
  }, [isMuted, volume, previousVolume, onVolumeChange])

  const handleVolumeChange = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    onVolumeChange(percentage)
  }, [disabled, onVolumeChange])

  return (
    <div className="group relative flex items-center">
      <button
        onClick={toggleMute}
        disabled={disabled}
        className={`
          p-2 rounded-lg transition-all duration-200
          ${isMuted
            ? 'bg-slate-100 dark:bg-slate-700/30 text-slate-500 dark:text-slate-400'
            : 'bg-slate-100 dark:bg-slate-700/30 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer touch-manipulation'}
        `}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </button>

      {/* Volume slider - show on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
        <div
          ref={sliderRef}
          className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer"
          onMouseDown={handleVolumeChange}
        >
          <div
            className="h-full bg-cyan-500 rounded-full"
            style={{ width: `${volume * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Playback Speed Control
// ============================================================================

export interface PlaybackSpeedControlProps {
  speed: number
  onSpeedChange: (speed: number) => void
  disabled?: boolean
}

/**
 * Playback speed selector
 */
export function PlaybackSpeedControl({
  speed,
  onSpeedChange,
  disabled = false,
}: PlaybackSpeedControlProps) {
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

  return (
    <select
      value={speed}
      onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
      disabled={disabled}
      className={`
        px-2 py-1 rounded-lg text-xs font-medium
        bg-white dark:bg-slate-700/30
        border border-slate-200 dark:border-slate-600
        text-slate-700 dark:text-slate-300
        hover:border-cyan-500/50
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title="Playback speed"
    >
      {speeds.map(s => (
        <option key={s} value={s}>
          {s}x
        </option>
      ))}
    </select>
  )
}

// ============================================================================
// Full Audio Player Bar (for reading mode)
// ============================================================================

export interface FullAudioPlayerProps {
  isPlaying: boolean
  isLoading: boolean
  currentTime: number
  duration: number
  volume: number
  speed: number
  repeatMode: RepeatMode
  surahNumber: number | null
  verse: number | null
  reciterId: number
  onTogglePlayPause: () => void
  onSeek: (time: number) => void
  onVolumeChange: (volume: number) => void
  onSpeedChange: (speed: number) => void
  onRepeatModeChange: (mode: RepeatMode) => void
  onReciterChange: (reciterId: number) => void
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
}

/**
 * Full featured audio player bar for reading mode
 */
export function FullAudioPlayer({
  isPlaying,
  isLoading,
  currentTime,
  duration,
  volume,
  speed,
  repeatMode,
  surahNumber,
  verse,
  reciterId,
  onTogglePlayPause,
  onSeek,
  onVolumeChange,
  onSpeedChange,
  onRepeatModeChange,
  onReciterChange,
  onPrevious,
  onNext,
  hasPrevious = true,
  hasNext = true,
}: FullAudioPlayerProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 shadow-lg">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2 md:py-3">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Controls */}
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            {/* Previous/Next */}
            {onPrevious && (
              <button
                onClick={onPrevious}
                disabled={!hasPrevious}
                className="hidden sm:block p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Previous verse"
              >
                <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>
            )}

            {/* Play/Pause - between prev and next */}
            <button
              onClick={onTogglePlayPause}
              disabled={isLoading}
              className={`
                flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full
                flex items-center justify-center
                bg-cyan-500 text-white shadow-md shadow-cyan-500/30
                hover:bg-cyan-600 transition-all duration-200
                touch-manipulation active:scale-95
                ${isLoading ? 'opacity-70' : ''}
              `}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
              ) : (
                <Play className="w-5 h-5 md:w-6 md:h-6 ml-0.5" strokeWidth={2.5} />
              )}
            </button>

            {onNext && (
              <button
                onClick={onNext}
                disabled={!hasNext}
                className="hidden sm:block p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Next verse"
              >
                <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>
            )}

            {/* Repeat mode */}
            <RepeatModeToggle
              repeatMode={repeatMode}
              onRepeatModeChange={onRepeatModeChange}
            />

            {/* Volume */}
            <VolumeControl
              volume={volume}
              onVolumeChange={onVolumeChange}
            />

            {/* Speed */}
            <PlaybackSpeedControl
              speed={speed}
              onSpeedChange={onSpeedChange}
            />
          </div>

          {/* Progress bar */}
          <div className="flex-1 min-w-0">
            <AudioProgressBar
              currentTime={currentTime}
              duration={duration}
              onSeek={onSeek}
              showTime
            />
          </div>

          {/* Reciter selector (desktop only) */}
          <div className="hidden lg:block">
            <ReciterSelector
              reciterId={reciterId}
              onReciterChange={onReciterChange}
              compact
            />
          </div>
        </div>

        {/* Now playing info */}
        {surahNumber !== null && verse !== null && (
          <div className="mt-2 text-xs md:text-sm text-center text-slate-600 dark:text-slate-400">
            Surah {surahNumber}, Verse {verse}
          </div>
        )}
      </div>
    </div>
  )
}
