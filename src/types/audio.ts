/**
 * Audio-related TypeScript types for Quran audio playback
 */

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error'
export type RepeatMode = 'none' | 'ayah' | 'surah' | 'range'

export interface AudioPlayerState {
  playbackState: PlaybackState
  currentSurah: number | null
  currentAyah: number | null
  repeatMode: RepeatMode
  repeatCount: number
  volume: number
  speed: number
}

export interface AudioMetadata {
  url: string
  format: string
  duration: number
}

export interface Reciter {
  id: number
  name: string
  name_arabic: string
  style: string
  cdnFolder: string // EveryAyah CDN folder name
}

export interface AudioFile {
  verse_key: string
  url: string
  duration: number
  format: string
}

export interface VerseAudioData {
  verse_key: string
  audio: AudioFile | null
}

// Available reciters configuration
export const DEFAULT_RECITER_ID = 7 // Mishary Rashid Alafasy

export const AVAILABLE_RECITERS: Reciter[] = [
  {
    id: 7,
    name: 'Mishary Rashid Alafasy',
    name_arabic: 'مشاري راشد العفاسي',
    style: 'murattal',
    cdnFolder: 'Alafasy_128kbps',
  },
  {
    id: 4,
    name: 'Abdul Rahman As-Sudais',
    name_arabic: 'عبد الرحمن السديس',
    style: 'murattal',
    cdnFolder: 'Sudais_128kbps',
  },
  {
    id: 3,
    name: 'Sa`d al-Ghamdi',
    name_arabic: 'سعد الغامدي',
    style: 'murattal',
    cdnFolder: 'Ghamadi_40kbps',
  },
  {
    id: 5,
    name: 'Abdullah Basfar',
    name_arabic: 'عبدالله بصفر',
    style: 'murattal',
    cdnFolder: 'Basfar_128kbps',
  },
  {
    id: 9,
    name: 'Minshawy',
    name_arabic: 'محمد صديق المنشاوي',
    style: 'murattal',
    cdnFolder: 'Minshawy_128kbps',
  },
  {
    id: 6,
    name: 'Mahmoud Khalil Al-Husary',
    name_arabic: 'محمود خليل الحصري',
    style: 'murattal',
    cdnFolder: 'Husary_128kbps',
  },
  {
    id: 10,
    name: 'Muhammad Ayyoub',
    name_arabic: 'محمد أيوب',
    style: 'murattal',
    cdnFolder: 'Ayoub_128kbps',
  },
  {
    id: 11,
    name: 'Sudais & Shuraim',
    name_arabic: 'السديس والشريم',
    style: 'murattal',
    cdnFolder: 'Sudais_Shuraim_128kbps',
  },
  {
    id: 2,
    name: 'Abdul Basit',
    name_arabic: 'عبد الباسط',
    style: 'murattal',
    cdnFolder: 'Abdul_Basit_Mujawwad_128kbps',
  },
  {
    id: 12,
    name: 'Abdul Basit (Murattal)',
    name_arabic: 'عبد الباسط (مرتل)',
    style: 'murattal',
    cdnFolder: 'Abdul_Basit_Murattal_64kbps',
  },
]

// User audio preferences for localStorage
export interface AudioPreferences {
  defaultReciterId: number
  volume: number
  speed: number
  repeatMode: RepeatMode
  repeatCount: number
}

export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
  defaultReciterId: DEFAULT_RECITER_ID,
  volume: 1.0,
  speed: 1.0,
  repeatMode: 'none',
  repeatCount: 3,
}

// LocalStorage key
export const AUDIO_PREFERENCES_KEY = 'quran-audio-preferences'
