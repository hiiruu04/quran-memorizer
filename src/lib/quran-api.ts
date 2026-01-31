/**
 * Quran API Client
 * Uses Quran.com API v4 for fetching Quranic text, surahs, and ayahs
 * Documentation: https://quran.com/docs/developer/api/v4/
 */

import type { Reciter, AudioFile, VerseAudioData } from '@/types/audio'

// Types for Quran API responses
export interface SurahInfo {
  id: number
  revelation_place: "makkah" | "madinah"
  revelation_order: number
  bismillah_pre: boolean
  name_simple: string
  name_complex: string
  name_arabic: string
  verses_count: number
  pages: number[]
  translated_name: {
    language_name: string
    name: string
  }
}

export interface AyahText {
  text: string
  text_v1?: string
}

export interface Ayah {
  id: number
  verse_number: number | null
  verse_key: string
  text_uthmani: string
  text_imlaei?: string
  translation?: string
  juz_number: number | null
  hizb_number: number | null
  rub_el_hizb_number: number | null
  page_number: number | null
  audio?: AudioFile | null
}

// Audio-related types
export interface AyahWithAudio extends Ayah {
  audio: AudioFile
}

export interface SurahDetail {
  id: number
  revelation_place: "makkah" | "madinah"
  revelation_order: number
  bismillah_pre: boolean
  name_simple: string
  name_complex: string
  name_arabic: string
  verses_count: number
  pages: number[]
  translated_name: {
    language_name: string
    name: string
  }
  verses: Ayah[]
}

// API base URL
const QURAN_API_BASE = "https://api.quran.com/api/v4"

/**
 * Fetch all surahs (chapters) of the Quran
 */
export async function fetchAllSurahs(): Promise<SurahInfo[]> {
  const response = await fetch(
    `${QURAN_API_BASE}/chapters?language=en`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch surahs: ${response.statusText}`)
  }

  const data = await response.json()
  return data.chapters
}

/**
 * Fetch a specific surah with its ayahs (verses)
 * @param surahNumber - The surah number (1-114)
 */
export async function fetchSurahDetail(surahNumber: number): Promise<SurahDetail> {
  // Fetch surah info
  const surahResponse = await fetch(
    `${QURAN_API_BASE}/chapters/${surahNumber}?language=en`
  )

  if (!surahResponse.ok) {
    throw new Error(`Failed to fetch surah: ${surahResponse.statusText}`)
  }

  const surahData = await surahResponse.json()
  const surahInfo = surahData.chapter

  // Fetch verses for the surah (Uthmani script)
  const versesResponse = await fetch(
    `${QURAN_API_BASE}/quran/verses/uthmani?chapter_number=${surahNumber}`
  )

  if (!versesResponse.ok) {
    throw new Error(`Failed to fetch verses: ${versesResponse.statusText}`)
  }

  const versesData = await versesResponse.json()

  // Fetch English translations (resource 20 = Saheeh International)
  const translationResponse = await fetch(
    `${QURAN_API_BASE}/quran/translations/20?chapter_number=${surahNumber}`
  )

  if (!translationResponse.ok) {
    throw new Error(`Failed to fetch translations: ${translationResponse.statusText}`)
  }

  const translationData = await translationResponse.json()

  // Merge translations with verses by index (translations are in order)
  const verses = versesData.verses.map((verse: Ayah, index: number) => {
    let translation = translationData.translations?.[index]?.text || ""
    // Convert HTML footnotes to styled subscript
    translation = translation.replace(/<sup[^>]*>(\d+)<\/sup>/g, (_match: string, num: string) =>
      `__FN_${num}__`
    )
    return {
      ...verse,
      translation,
    }
  })

  return {
    ...surahInfo,
    verses,
  }
}

/**
 * Fetch a specific range of ayahs from a surah
 * @param surahNumber - The surah number (1-114)
 * @param fromAyah - Starting ayah number
 * @param toAyah - Ending ayah number
 */
export async function fetchAyahRange(
  surahNumber: number,
  fromAyah: number,
  toAyah: number
): Promise<Ayah[]> {
  const verseKeys: string[] = []
  for (let i = fromAyah; i <= toAyah; i++) {
    verseKeys.push(`${surahNumber}:${i}`)
  }

  const response = await fetch(
    `${QURAN_API_BASE}/quran/verses/uthmani?verse_key=${verseKeys.join(",")}`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch ayah range: ${response.statusText}`)
  }

  const data = await response.json()
  return data.verses
}

/**
 * Get surah name in Arabic
 */
export function getSurahNameArabic(surah: SurahInfo | SurahDetail): string {
  return surah.name_arabic
}

/**
 * Get surah name in English
 */
export function getSurahNameEnglish(surah: SurahInfo | SurahDetail): string {
  return surah.name_simple
}

/**
 * Get total ayah count for a surah
 */
export function getSurahAyahCount(surah: SurahInfo | SurahDetail): number {
  return surah.verses_count
}

// ============================================================================
// AUDIO API FUNCTIONS
// ============================================================================

/**
 * Fetch available reciters (audio recitations)
 * Quran.com API v4 endpoint for recitations
 */
export async function fetchReciters(): Promise<Reciter[]> {
  const response = await fetch(
    `${QURAN_API_BASE}/resources/recitations?language=en`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch reciters: ${response.statusText}`)
  }

  const data = await response.json()
  return data.recitations || []
}

/**
 * Fetch a specific surah with audio metadata
 * @param surahNumber - The surah number (1-114)
 * @param recitationId - The recitation ID (default: 7 for Alafasy)
 */
export async function fetchSurahWithAudio(
  surahNumber: number,
  recitationId: number = 7
): Promise<SurahDetail> {
  // Fetch surah info
  const surahResponse = await fetch(
    `${QURAN_API_BASE}/chapters/${surahNumber}?language=en`
  )

  if (!surahResponse.ok) {
    throw new Error(`Failed to fetch surah: ${surahResponse.statusText}`)
  }

  const surahData = await surahResponse.json()
  const surahInfo = surahData.chapter

  // Fetch verses for the surah (Uthmani script)
  const versesResponse = await fetch(
    `${QURAN_API_BASE}/quran/verses/uthmani?chapter_number=${surahNumber}`
  )

  if (!versesResponse.ok) {
    throw new Error(`Failed to fetch verses: ${versesResponse.statusText}`)
  }

  const versesData = await versesResponse.json()

  // Fetch English translations (resource 20 = Saheeh International)
  const translationResponse = await fetch(
    `${QURAN_API_BASE}/quran/translations/20?chapter_number=${surahNumber}`
  )

  if (!translationResponse.ok) {
    throw new Error(`Failed to fetch translations: ${translationResponse.statusText}`)
  }

  const translationData = await translationResponse.json()

  // Fetch audio files for the recitation
  const audioResponse = await fetch(
    `${QURAN_API_BASE}/recitations/${recitationId}/by_chapter/${surahNumber}?language=en`
  )

  let audioMap: Record<string, AudioFile> = {}
  if (audioResponse.ok) {
    const audioData = await audioResponse.json()
    // Create a map of verse_key to audio file
    if (audioData.audio_files) {
      audioMap = audioData.audio_files.reduce((acc: Record<string, AudioFile>, file: AudioFile) => {
        acc[file.verse_key] = file
        return acc
      }, {})
    }
  }

  // Merge translations and audio with verses by index
  const verses = versesData.verses.map((verse: Ayah, index: number) => {
    let translation = translationData.translations?.[index]?.text || ""
    // Convert HTML footnotes to styled subscript
    translation = translation.replace(/<sup[^>]*>(\d+)<\/sup>/g, (_match: string, num: string) =>
      `__FN_${num}__`
    )

    return {
      ...verse,
      translation,
      audio: audioMap[verse.verse_key] || null,
    }
  })

  return {
    ...surahInfo,
    verses,
  }
}

/**
 * Fetch audio files for a specific ayah range
 * @param surahNumber - The surah number (1-114)
 * @param fromAyah - Starting ayah number
 * @param toAyah - Ending ayah number
 * @param recitationId - The recitation ID (default: 7 for Alafasy)
 */
export async function fetchAyahAudioRange(
  surahNumber: number,
  fromAyah: number,
  toAyah: number,
  recitationId: number = 7
): Promise<VerseAudioData[]> {
  const verseKeys: string[] = []
  for (let i = fromAyah; i <= toAyah; i++) {
    verseKeys.push(`${surahNumber}:${i}`)
  }

  const response = await fetch(
    `${QURAN_API_BASE}/recitations/${recitationId}/by_ayah/${verseKeys.join(',')}`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch ayah audio: ${response.statusText}`)
  }

  const data = await response.json()
  return data.audio_files || []
}
