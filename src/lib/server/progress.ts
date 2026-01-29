/**
 * Server actions for Quran progress management
 */

import { createServerFn } from "@tanstack/react-start"
import { auth } from "@/lib/auth"
import type { ProgressStatus } from "@/db/queries"
import {
  getProgress,
  updateProgress,
  getSurahProgress,
  getUserProgress,
  getUserProgressStats,
  batchUpdateProgress,
} from "@/db/queries"

/**
 * Helper function to get session from request headers
 */
async function getSessionFromHeaders(headers: Headers) {
  const session = await auth.api.getSession({
    headers,
  })
  return session
}

/**
 * Get progress for a specific ayah
 */
export const getAyahProgress = createServerFn({ method: "GET" })
  .inputValidator((input: { surahNumber: number; ayahNumber: number }) => input)
  .handler(async ({ data, request }) => {
    const session = await getSessionFromHeaders(request.headers)

    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const progress = await getProgress(session.user.id, data.surahNumber, data.ayahNumber)
    return { progress }
  })

/**
 * Get progress for an entire surah
 */
export const getSurahProgressFn = createServerFn({ method: "GET" })
  .inputValidator((input: { surahNumber: number }) => input)
  .handler(async ({ data, request }) => {
    const session = await getSessionFromHeaders(request.headers)

    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const progress = await getSurahProgress(session.user.id, data.surahNumber)
    return { progress }
  })

/**
 * Update progress status for a specific ayah
 */
export const updateAyahProgress = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { surahNumber: number; ayahNumber: number; status: ProgressStatus }) => input
  )
  .handler(async ({ data, request }) => {
    const session = await getSessionFromHeaders(request.headers)

    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const progress = await updateProgress(
      session.user.id,
      data.surahNumber,
      data.ayahNumber,
      data.status
    )

    return { progress }
  })

/**
 * Get all progress for the current user
 */
export const getAllUserProgress = createServerFn({ method: "GET" })
  .handler(async ({ request }) => {
    const session = await getSessionFromHeaders(request.headers)

    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const progress = await getUserProgress(session.user.id)
    return { progress }
  })

/**
 * Get user progress statistics
 */
export const getUserStats = createServerFn({ method: "GET" })
  .handler(async ({ request }) => {
    const session = await getSessionFromHeaders(request.headers)

    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const stats = await getUserProgressStats(session.user.id)
    return { stats }
  })

/**
 * Batch update progress for multiple ayahs
 */
export const batchUpdateAyahProgress = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      updates: Array<{ surahNumber: number; ayahNumber: number; status: ProgressStatus }>
    }) => input
  )
  .handler(async ({ data, request }) => {
    const session = await getSessionFromHeaders(request.headers)

    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const progress = await batchUpdateProgress(session.user.id, data.updates)
    return { progress }
  })
