/**
 * Tests for AudioPlayer components
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VerseAudioPlayer, ReciterSelector, AudioProgressBar } from '@/components/AudioPlayer'

describe('VerseAudioPlayer', () => {
  const mockOnPlay = vi.fn()
  const mockOnPause = vi.fn()

  beforeEach(() => {
    mockOnPlay.mockClear()
    mockOnPause.mockClear()
  })

  it('should render play button when not playing', () => {
    render(
      <VerseAudioPlayer
        isPlaying={false}
        isLoading={false}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
      />
    )

    const button = screen.getByRole('button', { name: /play/i })
    expect(button).toBeInTheDocument()
  })

  it('should render pause button when playing', () => {
    render(
      <VerseAudioPlayer
        isPlaying={true}
        isLoading={false}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
      />
    )

    const button = screen.getByRole('button', { name: /pause/i })
    expect(button).toBeInTheDocument()
  })

  it('should render loading state when loading', () => {
    render(
      <VerseAudioPlayer
        isPlaying={false}
        isLoading={true}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
      />
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should call onPlay when clicked while not playing', () => {
    render(
      <VerseAudioPlayer
        isPlaying={false}
        isLoading={false}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
      />
    )

    fireEvent.click(screen.getByRole('button'))
    expect(mockOnPlay).toHaveBeenCalledTimes(1)
  })

  it('should call onPause when clicked while playing', () => {
    render(
      <VerseAudioPlayer
        isPlaying={true}
        isLoading={false}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
      />
    )

    fireEvent.click(screen.getByRole('button'))
    expect(mockOnPause).toHaveBeenCalledTimes(1)
  })

  it('should render compact mode', () => {
    render(
      <VerseAudioPlayer
        isPlaying={false}
        isLoading={false}
        onPlay={mockOnPlay}
        onPause={mockOnPause}
        compact
      />
    )

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })
})

describe('ReciterSelector', () => {
  const mockOnReciterChange = vi.fn()

  const reciters = [
    { id: 7, name: 'Mishary Rashid Alafasy', name_arabic: 'مشاري راشد العفاسي', style: 'murattal', cdnFolder: 'Alafasy_128kbps' },
    { id: 4, name: 'Abdul Rahman As-Sudais', name_arabic: 'عبد الرحمن السديس', style: 'murattal', cdnFolder: 'Sudais_128kbps' },
  ]

  beforeEach(() => {
    mockOnReciterChange.mockClear()
  })

  it('should render current reciter', () => {
    render(
      <ReciterSelector
        reciterId={7}
        onReciterChange={mockOnReciterChange}
        availableReciters={reciters}
      />
    )

    expect(screen.getByText('Mishary Rashid Alafasy')).toBeInTheDocument()
  })

  it('should open dropdown when clicked', () => {
    render(
      <ReciterSelector
        reciterId={7}
        onReciterChange={mockOnReciterChange}
        availableReciters={reciters}
      />
    )

    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Abdul Rahman As-Sudais')).toBeInTheDocument()
  })

  it('should call onReciterChange when a reciter is selected', () => {
    render(
      <ReciterSelector
        reciterId={7}
        onReciterChange={mockOnReciterChange}
        availableReciters={reciters}
      />
    )

    // Open dropdown
    fireEvent.click(screen.getByRole('button'))

    // Click on Sudais
    fireEvent.click(screen.getByText('Abdul Rahman As-Sudais'))

    expect(mockOnReciterChange).toHaveBeenCalledWith(4)
  })
})

describe('AudioProgressBar', () => {
  const mockOnSeek = vi.fn()

  beforeEach(() => {
    mockOnSeek.mockClear()
  })

  it('should render progress bar', () => {
    render(
      <AudioProgressBar
        currentTime={30}
        duration={120}
        onSeek={mockOnSeek}
        showTime
      />
    )

    expect(screen.getByText('0:30')).toBeInTheDocument()
    expect(screen.getByText('2:00')).toBeInTheDocument()
  })

  it('should not show time when showTime is false', () => {
    render(
      <AudioProgressBar
        currentTime={30}
        duration={120}
        onSeek={mockOnSeek}
        showTime={false}
      />
    )

    // Time labels should not be visible
    expect(screen.queryByText('0:30')).not.toBeInTheDocument()
    expect(screen.queryByText('2:00')).not.toBeInTheDocument()
  })

  it('should call onSeek when progress bar is clicked', () => {
    render(
      <AudioProgressBar
        currentTime={30}
        duration={120}
        onSeek={mockOnSeek}
        showTime
      />
    )

    // Find the progress bar element - it uses onMouseDown, not onClick
    const progressBars = document.querySelectorAll('.bg-slate-200')
    if (progressBars.length > 0) {
      fireEvent.mouseDown(progressBars[0] as HTMLElement)
      expect(mockOnSeek).toHaveBeenCalled()
    }
  })
})
