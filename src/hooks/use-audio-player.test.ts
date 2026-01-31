/**
 * Tests for useAudioPlayer hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import { useAudioPlayer } from '@/hooks/use-audio-player'

// Mock HTMLAudioElement
class MockAudio {
  volume = 1.0
  playbackRate = 1.0
  currentTime = 0
  duration = 10
  paused = true
  ended = false
  src = ''
  _listeners: Record<string, (() => void)[]> = {}

  addEventListener(event: string, handler: () => void) {
    this._listeners[event] = this._listeners[event] || []
    this._listeners[event].push(handler)
  }

  removeEventListener(event: string, handler: () => void) {
    this._listeners[event] = this._listeners[event]?.filter(h => h !== handler)
  }

  async play() {
    this.paused = false
    this._emit('play')
    // Simulate audio loading and playing
    this._emit('loadedmetadata')
    this._emit('canplay')
    return Promise.resolve()
  }

  pause() {
    this.paused = true
    this._emit('pause')
  }

  _emit(event: string) {
    this._listeners[event]?.forEach(handler => handler())
  }
}

// Global mock audio instance (accessible via window.Audio)
let currentMockAudio: MockAudio | null = null

describe('useAudioPlayer', () => {
  beforeEach(() => {
    // Reset localStorage
    localStorage.clear()
    // Create fresh mock for each test
    currentMockAudio = new MockAudio()
    global.Audio = vi.fn(() => currentMockAudio!) as unknown as { new (): HTMLAudioElement }
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    currentMockAudio = null
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAudioPlayer())

    expect(result.current.playbackState).toBe('idle')
    expect(result.current.currentSurah).toBeNull()
    expect(result.current.currentAyah).toBeNull()
    expect(result.current.currentTime).toBe(0)
    expect(result.current.duration).toBe(0)
    expect(result.current.volume).toBe(1.0)
    expect(result.current.speed).toBe(1.0)
    expect(result.current.repeatMode).toBe('none')
    expect(result.current.isPlaying()).toBe(false)
  })

  it('should play audio when play is called', async () => {
    const { result } = renderHook(() => useAudioPlayer())

    await act(async () => {
      await result.current.play(1, 1)
    })

    // Check that Audio constructor was called
    expect(global.Audio).toHaveBeenCalled()
  })

  it('should pause audio when pause is called', () => {
    const { result } = renderHook(() => useAudioPlayer())

    act(() => {
      result.current.pause()
    })

    // The hook should pause the audio element
    // When pause is called on an idle hook, it becomes paused
    expect(result.current.playbackState).toBe('paused')
  })

  it('should set volume correctly', () => {
    const { result } = renderHook(() => useAudioPlayer())

    act(() => {
      result.current.setVolume(0.5)
    })

    expect(result.current.volume).toBe(0.5)
  })

  it('should set speed correctly', () => {
    const { result } = renderHook(() => useAudioPlayer())

    act(() => {
      result.current.setSpeed(1.5)
    })

    expect(result.current.speed).toBe(1.5)
  })

  it('should set repeat mode correctly', () => {
    const { result } = renderHook(() => useAudioPlayer())

    act(() => {
      result.current.setRepeatMode('ayah')
    })

    expect(result.current.repeatMode).toBe('ayah')
  })

  it('should toggle between repeat modes', () => {
    const { result } = renderHook(() => useAudioPlayer())

    expect(result.current.repeatMode).toBe('none')

    act(() => {
      result.current.setRepeatMode('ayah')
    })
    expect(result.current.repeatMode).toBe('ayah')

    act(() => {
      result.current.setRepeatMode('surah')
    })
    expect(result.current.repeatMode).toBe('surah')

    act(() => {
      result.current.setRepeatMode('none')
    })
    expect(result.current.repeatMode).toBe('none')
  })

  it('should format time correctly', () => {
    const { result } = renderHook(() => useAudioPlayer())

    expect(result.current.formatTime(0)).toBe('0:00')
    expect(result.current.formatTime(125)).toBe('2:05')
    expect(result.current.formatTime(3661)).toBe('1:01:01')
  })

  it('should check if playing correctly', () => {
    const { result } = renderHook(() => useAudioPlayer())

    expect(result.current.isPlaying()).toBe(false)
  })

  it('should seek to time correctly', () => {
    const { result } = renderHook(() => useAudioPlayer())

    act(() => {
      result.current.seek(30)
    })

    expect(result.current.currentTime).toBe(30)
  })

  it('should handle play/pause toggle', async () => {
    const { result } = renderHook(() => useAudioPlayer())

    // Initially idle
    expect(result.current.isPlaying()).toBe(false)

    // Play
    await act(async () => {
      await result.current.play(1, 1)
    })
    // Audio constructor should have been called
    expect(global.Audio).toHaveBeenCalled()

    // Pause
    act(() => {
      result.current.pause()
    })
  })

  it('should stop audio when stop is called', () => {
    const { result } = renderHook(() => useAudioPlayer())

    act(() => {
      result.current.stop()
    })

    expect(result.current.currentTime).toBe(0)
  })
})
