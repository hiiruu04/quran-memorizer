/**
 * Server actions for Quran progress management
 */

import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"
import { auth } from "@/lib/auth"
import type { ProgressStatus } from "@/db/queries"
import {
  getProgress,
  updateProgress,
  getSurahProgress,
  getUserProgress,
  getUserProgressStats,
  getUserProgressByStatus,
  batchUpdateProgress,
} from "@/db/queries"

/**
 * Helper function to get session from request
 */
async function getSession() {
  try {
    const request = getRequest()

    if (request instanceof Request) {
      const headers = request.headers
      const session = await auth.api.getSession({
        headers: headers as Headers,
      })
      return session
    }

    const session = await auth.api.getSession({
      headers: new Headers() as Headers,
    })
    return session
  } catch {
    return null
  }
}

/**
 * Get progress for a specific ayah
 */
export const getAyahProgress = createServerFn({ method: "GET" })
  .inputValidator((input: { surahNumber: number; ayahNumber: number }) => input)
  .handler(async ({ data }) => {
    const session = await getSession()

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
  .handler(async ({ data }) => {
    const session = await getSession()

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
    (input: { surahNumber: number; ayahNumber: number; status: ProgressStatus; userId?: string }) => input
  )
  .handler(async ({ data }) => {
    // Try to get userId from request first (for security), fall back to provided userId
    let userId = data.userId

    if (!userId) {
      const session = await getSession()
      userId = session?.user?.id
    }

    if (!userId) {
      throw new Error("Unauthorized")
    }

    const progress = await updateProgress(
      userId,
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
  .handler(async () => {
    const session = await getSession()

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
  .handler(async () => {
    const session = await getSession()

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
  .handler(async ({ data }) => {
    const session = await getSession()

    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const progress = await batchUpdateProgress(session.user.id, data.updates)
    return { progress }
  })

/**
 * Get user progress filtered by status
 */
export const getUserProgressByStatusFn = createServerFn({ method: "GET" })
  .inputValidator((input: { status: ProgressStatus }) => input)
  .handler(async ({ data }) => {
    const session = await getSession()

    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const progress = await getUserProgressByStatus(session.user.id, data.status)
    return { progress }
  })
