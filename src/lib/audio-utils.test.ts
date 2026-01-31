/**
 * Tests for audio utility functions
 */

import { describe, it, expect } from 'vitest'
import { formatTime, getAudioUrl, parseVerseKey, createVerseKey, isValidAyah, getNextAyah, getPreviousAyah } from '@/lib/audio-utils'

describe('formatTime', () => {
  it('should format seconds as MM:SS', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(5)).toBe('0:05')
    expect(formatTime(60)).toBe('1:00')
    expect(formatTime(125)).toBe('2:05')
    expect(formatTime(359)).toBe('5:59')
  })

  it('should format seconds as HH:MM:SS for longer durations', () => {
    expect(formatTime(3600)).toBe('1:00:00')
    expect(formatTime(3661)).toBe('1:01:01')
    expect(formatTime(7325)).toBe('2:02:05')
  })

  it('should handle NaN and infinite values', () => {
    expect(formatTime(NaN)).toBe('0:00')
    expect(formatTime(Infinity)).toBe('0:00')
    expect(formatTime(-Infinity)).toBe('0:00')
  })
})

describe('getAudioUrl', () => {
  it('should generate correct audio URL for Alafasy reciter', () => {
    const url = getAudioUrl(1, 1, 7)
    expect(url).toBe('https://everyayah.com/data/Alafasy_128kbps/001001.mp3')
  })

  it('should generate correct audio URL for Sudais reciter', () => {
    const url = getAudioUrl(2, 5, 4)
    expect(url).toBe('https://everyayah.com/data/Sudais_128kbps/002005.mp3')
  })

  it('should pad surah and ayah numbers with zeros', () => {
    const url = getAudioUrl(114, 6, 7)
    expect(url).toBe('https://everyayah.com/data/Alafasy_128kbps/114006.mp3')
  })

  it('should use fallback URL for unknown reciter', () => {
    const url = getAudioUrl(1, 1, 999)
    // Unknown reciter falls back to default Alafasy CDN
    expect(url).toBe('https://everyayah.com/data/Alafasy_128kbps/001001.mp3')
  })
})

describe('parseVerseKey', () => {
  it('should parse verse key correctly', () => {
    expect(parseVerseKey('1:1')).toEqual({ surahNumber: 1, ayahNumber: 1 })
    expect(parseVerseKey('114:6')).toEqual({ surahNumber: 114, ayahNumber: 6 })
    expect(parseVerseKey('2:255')).toEqual({ surahNumber: 2, ayahNumber: 255 })
  })
})

describe('createVerseKey', () => {
  it('should create verse key correctly', () => {
    expect(createVerseKey(1, 1)).toBe('1:1')
    expect(createVerseKey(114, 6)).toBe('114:6')
    expect(createVerseKey(2, 255)).toBe('2:255')
  })
})

describe('isValidAyah', () => {
  it('should validate ayah numbers', () => {
    expect(isValidAyah(1, 1, 7)).toBe(true) // ayah 1, surah 1, 7 verses total
    expect(isValidAyah(286, 2, 286)).toBe(true) // ayah 286, surah 2, 286 verses total
    expect(isValidAyah(8, 1, 7)).toBe(false) // ayah 8 > 7 verses total
    expect(isValidAyah(0, 1, 7)).toBe(false) // ayah 0 < 1
    expect(isValidAyah(1, 0, 7)).toBe(false) // ayah 1, surah 0 (surah < 1)
    expect(isValidAyah(1, 115, 7)).toBe(false) // surah 115 > 114
  })
})

describe('getNextAyah', () => {
  it('should return next ayah number', () => {
    expect(getNextAyah(1, 7)).toBe(2)
    expect(getNextAyah(285, 286)).toBe(286)
    expect(getNextAyah(286, 286)).toBe(null) // at end
  })

  it('should return null if at the end of surah', () => {
    expect(getNextAyah(7, 7)).toBe(null)
  })
})

describe('getPreviousAyah', () => {
  it('should return previous ayah number', () => {
    expect(getPreviousAyah(2)).toBe(1)
    expect(getPreviousAyah(286)).toBe(285)
  })

  it('should return null if at the beginning of surah', () => {
    expect(getPreviousAyah(1)).toBe(null)
  })
})
