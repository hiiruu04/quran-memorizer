import { db } from "./index"
import { progress } from "./schema"
import { eq, and } from "drizzle-orm"

export type ProgressStatus = "not_started" | "in_progress" | "memorized" | "revised"

export interface ProgressInput {
  userId: string
  surahNumber: number
  ayahNumber: number
  status: ProgressStatus
}

export interface Progress {
  id: string
  userId: string
  surahNumber: string
  ayahNumber: string
  status: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Surah ayah counts for accurate progress calculation
 * Surah number -> total ayahs
 */
export const SURAH_AYAH_COUNTS: Record<number, number> = {
  1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
  11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135,
  21: 112, 22: 78, 23: 118, 24: 64, 25: 77, 26: 227, 27: 93, 28: 88, 29: 69, 30: 60,
  31: 34, 32: 30, 33: 73, 34: 54, 35: 45, 36: 83, 37: 182, 38: 88, 39: 75, 40: 85,
  41: 54, 42: 53, 43: 89, 44: 59, 45: 37, 46: 35, 47: 38, 48: 29, 49: 18, 50: 45,
  51: 60, 52: 49, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29, 58: 22, 59: 24, 60: 13,
  61: 14, 62: 11, 63: 11, 64: 18, 65: 12, 66: 12, 67: 30, 68: 52, 69: 52, 70: 44,
  71: 28, 72: 28, 73: 20, 74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42,
  81: 29, 82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20,
  91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11,
  101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3,
  111: 5, 112: 4, 113: 5, 114: 6
}

/**
 * Get or create progress record for a specific ayah
 */
export async function getOrCreateProgress(input: ProgressInput): Promise<Progress> {
  const existing = await getProgress(input.userId, input.surahNumber, input.ayahNumber)

  if (existing) {
    return existing
  }

  return createProgress(input)
}

/**
 * Get progress for a specific ayah
 */
export async function getProgress(
  userId: string,
  surahNumber: number,
  ayahNumber: number
): Promise<Progress | null> {
  const result = await db
    .select()
    .from(progress)
    .where(
      and(
        eq(progress.userId, userId),
        eq(progress.surahNumber, surahNumber.toString()),
        eq(progress.ayahNumber, ayahNumber.toString())
      )
    )
    .limit(1)

  return result[0] || null
}

/**
 * Create a new progress record
 */
export async function createProgress(input: ProgressInput): Promise<Progress> {
  const now = new Date()
  const result = await db
    .insert(progress)
    .values({
      userId: input.userId,
      surahNumber: input.surahNumber.toString(),
      ayahNumber: input.ayahNumber.toString(),
      status: input.status,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  return result[0]
}

/**
 * Update progress status for a specific ayah
 */
export async function updateProgress(
  userId: string,
  surahNumber: number,
  ayahNumber: number,
  status: ProgressStatus
): Promise<Progress> {
  console.log("DEBUG: updateProgress called:", { userId, surahNumber, ayahNumber, status })

  try {
    // First try to update existing record
    const result = await db
      .update(progress)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(progress.userId, userId),
          eq(progress.surahNumber, surahNumber.toString()),
          eq(progress.ayahNumber, ayahNumber.toString())
        )
      )
      .returning()

    if (result[0]) {
      console.log("DEBUG: Updated existing progress:", result[0])
      return result[0]
    }

    // If no record exists, create one
    console.log("DEBUG: No existing record, creating new one")
    const newProgress = await createProgress({ userId, surahNumber, ayahNumber, status })
    console.log("DEBUG: Created new progress:", newProgress)
    return newProgress
  } catch (error) {
    console.error("DEBUG: Error in updateProgress:", error)
    throw error
  }
}

/**
 * Get all progress for a user
 */
export async function getUserProgress(userId: string): Promise<Progress[]> {
  return db
    .select()
    .from(progress)
    .where(eq(progress.userId, userId))
}

/**
 * Get progress for a specific surah
 */
export async function getSurahProgress(
  userId: string,
  surahNumber: number
): Promise<Progress[]> {
  return db
    .select()
    .from(progress)
    .where(
      and(
        eq(progress.userId, userId),
        eq(progress.surahNumber, surahNumber.toString())
      )
    )
}

/**
 * Get summary statistics for a user's progress
 */
export async function getUserProgressStats(userId: string) {
  const userProgress = await getUserProgress(userId)

  const stats = {
    totalAyahs: userProgress.length,
    memorized: 0,
    inProgress: 0,
    revised: 0,
    notStarted: 0,
    surahsCompleted: 0,
  }

  // Track progress per surah to calculate completion
  const surahProgress = new Map<number, { completed: number; total: number }>()

  for (const p of userProgress) {
    switch (p.status) {
      case "memorized":
        stats.memorized++
        break
      case "in_progress":
        stats.inProgress++
        break
      case "revised":
        stats.revised++
        break
      case "not_started":
        stats.notStarted++
        break
    }

    // Track surah progress
    const surahNum = parseInt(p.surahNumber, 10)
    if (!surahProgress.has(surahNum)) {
      surahProgress.set(surahNum, { completed: 0, total: 0 })
    }
    const surah = surahProgress.get(surahNum)!

    // Count memorized and revised as completed
    if (p.status === "memorized" || p.status === "revised") {
      surah.completed++
    }
    surah.total++
  }

  // Calculate surahs completed using actual ayah counts
  for (const [surahNum, { completed, total }] of surahProgress) {
    const totalAyahsInSurah = SURAH_AYAH_COUNTS[surahNum] || total
    // A surah is considered complete if all ayahs are memorized/revised
    if (completed >= totalAyahsInSurah) {
      stats.surahsCompleted++
    }
  }

  return stats
}

/**
 * Get progress filtered by status
 */
export async function getUserProgressByStatus(
  userId: string,
  status: ProgressStatus
): Promise<Progress[]> {
  return db
    .select()
    .from(progress)
    .where(
      and(
        eq(progress.userId, userId),
        eq(progress.status, status)
      )
    )
}

/**
 * Delete progress for a specific ayah
 */
export async function deleteProgress(
  userId: string,
  surahNumber: number,
  ayahNumber: number
): Promise<void> {
  await db
    .delete(progress)
    .where(
      and(
        eq(progress.userId, userId),
        eq(progress.surahNumber, surahNumber.toString()),
        eq(progress.ayahNumber, ayahNumber.toString())
      )
    )
}

/**
 * Batch update progress for multiple ayahs
 */
export async function batchUpdateProgress(
  userId: string,
  updates: Array<{ surahNumber: number; ayahNumber: number; status: ProgressStatus }>
): Promise<Progress[]> {
  const results: Progress[] = []

  for (const update of updates) {
    const result = await updateProgress(
      userId,
      update.surahNumber,
      update.ayahNumber,
      update.status
    )
    results.push(result)
  }

  return results
}
