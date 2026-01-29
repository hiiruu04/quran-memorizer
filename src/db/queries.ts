import { db } from "./index"
import { progress, user } from "./schema"
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
  const result = await db
    .insert(progress)
    .values({
      userId: input.userId,
      surahNumber: input.surahNumber.toString(),
      ayahNumber: input.ayahNumber.toString(),
      status: input.status,
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

  if (!result[0]) {
    // If no record exists, create one
    return createProgress({ userId, surahNumber, ayahNumber, status })
  }

  return result[0]
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
    surahsCompleted: new Set<number>(),
  }

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
  }

  // Calculate surahs completed (all ayahs in a surah are memorized or revised)
  // This is a simplified calculation - in reality you'd need to know the total ayahs per surah
  const surahAyahs = new Map<number, { total: number; completed: number }>()
  for (const p of userProgress) {
    const surahNum = parseInt(p.surahNumber, 10)
    const ayahNum = parseInt(p.ayahNumber, 10)

    if (!surahAyahs.has(surahNum)) {
      surahAyahs.set(surahNum, { total: 0, completed: 0 })
    }
    const surah = surahAyahs.get(surahNum)!
    surah.total++

    if (p.status === "memorized" || p.status === "revised") {
      surah.completed++
    }
  }

  for (const [surahNum, { total, completed }] of surahAyahs) {
    // Consider a surah complete if all ayahs are tracked and completed
    // Note: This is a simplified check - we'd need the actual total ayahs per surah
    if (total > 0 && total === completed) {
      stats.surahsCompleted.add(surahNum)
    }
  }

  return {
    ...stats,
    surahsCompleted: stats.surahsCompleted.size,
  }
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
