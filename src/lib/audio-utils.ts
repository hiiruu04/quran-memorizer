/**
 * Audio utility functions for Quran audio playback
 */

import type { AudioPreferences, Reciter } from '@/types/audio'
import {
  AVAILABLE_RECITERS,
  DEFAULT_AUDIO_PREFERENCES,
  AUDIO_PREFERENCES_KEY,
} from '@/types/audio'

/**
 * Format seconds to MM:SS or HH:MM:SS format
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) {
    return '0:00'
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Get the audio URL for a specific verse from a reciter
 * @param surahNumber - Chapter number (1-114)
 * @param ayahNumber - Verse number within the chapter
 * @param reciterId - Reciter ID (default: 7 for Alafasy)
 * @returns Full audio URL
 */
export function getAudioUrl(surahNumber: number, ayahNumber: number, reciterId: number = 7): string {
  // Get the reciter to find the CDN folder name
  const reciter = getReciterById(reciterId)

  if (reciter && reciter.cdnFolder) {
    // Use EveryAyah CDN format with specific folder for each reciter
    // Format: https://everyayah.com/data/{CDN_FOLDER}/{surah:03d}{ayah:03d}.mp3
    // Example: https://everyayah.com/data/Alafasy_128kbps/001001.mp3 (Surah 1, Ayah 1)
    const surahStr = String(surahNumber).padStart(3, '0')
    const ayahStr = String(ayahNumber).padStart(3, '0')
    return `https://everyayah.com/data/${reciter.cdnFolder}/${surahStr}${ayahStr}.mp3`
  }

  // Fallback: Use default reciter (Alafasy) if reciterId is invalid
  const surahStr = String(surahNumber).padStart(3, '0')
  const ayahStr = String(ayahNumber).padStart(3, '0')
  return `https://everyayah.com/data/Alafasy_128kbps/${surahStr}${ayahStr}.mp3`
}

/**
 * Check if an audio URL is valid/accessible
 * @param url - Audio URL to check
 * @returns Promise<boolean> - true if audio exists, false otherwise
 */
export async function checkAudioExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    const contentType = response.headers.get('content-type')
    return response.ok && (contentType?.includes('audio') ?? false)
  } catch {
    return false
  }
}

/**
 * Get a valid audio URL for a specific verse, falling back to Alafasy if needed
 * @param surahNumber - Chapter number (1-114)
 * @param ayahNumber - Verse number within the chapter
 * @param reciterId - Preferred reciter ID
 * @returns Promise of valid audio URL
 */
export async function getValidAudioUrl(
  surahNumber: number,
  ayahNumber: number,
  reciterId: number
): Promise<string> {
  const preferredUrl = getAudioUrl(surahNumber, ayahNumber, reciterId)

  // Check if preferred reciter has audio for this verse
  const exists = await checkAudioExists(preferredUrl)

  if (exists) {
    return preferredUrl
  }

  // Fallback to Alafasy (reciter ID 7) who has complete Quran coverage
  return getAudioUrl(surahNumber, ayahNumber, 7)
}

/**
 * Get the reciter by ID
 * @param reciterId - Reciter ID
 * @returns Reciter object or undefined if not found
 */
export function getReciterById(reciterId: number): Reciter | undefined {
  return AVAILABLE_RECITERS.find(r => r.id === reciterId)
}

/**
 * Get audio preferences from localStorage
 * @returns Audio preferences object
 */
export function getAudioPreferences(): AudioPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_AUDIO_PREFERENCES
  }

  try {
    const stored = localStorage.getItem(AUDIO_PREFERENCES_KEY)
    if (stored) {
      return { ...DEFAULT_AUDIO_PREFERENCES, ...JSON.parse(stored) }
    }
  } catch (error) {
    console.error('Failed to read audio preferences:', error)
  }

  return DEFAULT_AUDIO_PREFERENCES
}

/**
 * Save audio preferences to localStorage
 * @param preferences - Audio preferences to save
 */
export function saveAudioPreferences(preferences: Partial<AudioPreferences>): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const current = getAudioPreferences()
    const updated = { ...current, ...preferences }
    localStorage.setItem(AUDIO_PREFERENCES_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save audio preferences:', error)
  }
}

/**
 * Parse verse key to extract surah and ayah numbers
 * @param verseKey - Verse key in format "surah:ayah" (e.g., "1:1")
 * @returns Object with surahNumber and ayahNumber
 */
export function parseVerseKey(verseKey: string): { surahNumber: number; ayahNumber: number } {
  const [surah, ayah] = verseKey.split(':').map(Number)
  return { surahNumber: surah, ayahNumber: ayah }
}

/**
 * Create verse key from surah and ayah numbers
 * @param surahNumber - Chapter number
 * @param ayahNumber - Verse number
 * @returns Verse key string (e.g., "1:1")
 */
export function createVerseKey(surahNumber: number, ayahNumber: number): string {
  return `${surahNumber}:${ayahNumber}`
}

/**
 * Check if an ayah number is valid
 * @param ayahNumber - Verse number to validate
 * @param surahNumber - Chapter number (for verse count validation)
 * @param verseCount - Total verses in the surah
 * @returns True if valid
 */
export function isValidAyah(ayahNumber: number, surahNumber: number, verseCount: number): boolean {
  return ayahNumber >= 1 && ayahNumber <= verseCount && surahNumber >= 1 && surahNumber <= 114
}

/**
 * Calculate the next ayah number
 * @param currentAyah - Current ayah number
 * @param verseCount - Total verses in the surah
 * @returns Next ayah number or null if at end
 */
export function getNextAyah(currentAyah: number, verseCount: number): number | null {
  return currentAyah < verseCount ? currentAyah + 1 : null
}

/**
 * Calculate the previous ayah number
 * @param currentAyah - Current ayah number
 * @returns Previous ayah number or null if at beginning
 */
export function getPreviousAyah(currentAyah: number): number | null {
  return currentAyah > 1 ? currentAyah - 1 : null
}

/**
 * Get list of ayah numbers in a range
 * @param startAyah - Starting ayah number
 * @param endAyah - Ending ayah number
 * @returns Array of ayah numbers
 */
export function getAyahRange(startAyah: number, endAyah: number): number[] {
  const range: number[] = []
  for (let i = startAyah; i <= endAyah; i++) {
    range.push(i)
  }
  return range
}

// Re-export types for convenience
export type { AudioPreferences, Reciter }
export { AVAILABLE_RECITERS, DEFAULT_RECITER_ID, DEFAULT_AUDIO_PREFERENCES, AUDIO_PREFERENCES_KEY } from '@/types/audio'
