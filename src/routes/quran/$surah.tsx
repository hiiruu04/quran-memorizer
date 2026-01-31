import { createFileRoute, Link } from "@tanstack/react-router"
import { fetchSurahDetail, fetchAllSurahs } from "@/lib/quran-api"
import { ChevronLeft, ChevronRight, BookOpen, MapPin, ChevronsLeft, ChevronsRight } from "lucide-react"
import { getSurahProgressFn, updateAyahProgress } from "@/lib/server/progress"
import { useSession } from "@/lib/auth-client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Circle, CircleDot, CheckCircle2, Clock } from "lucide-react"
import type { ProgressStatus } from "@/db/queries"
import React, { useRef, useEffect, useState, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useAudioPlayer } from "@/hooks/use-audio-player"
import { VerseAudioPlayer, FullAudioPlayer, AudioProgressBar } from "@/components/AudioPlayer"

// Verses per page
const VERSES_PER_PAGE = 10

// Convert English numerals to Arabic numerals
function toArabicNumeral(num: number): string {
  const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"]
  return num.toString().split("").map(d => arabicNumerals[parseInt(d)] || d).join("")
}

// Progress status configuration
const PROGRESS_STATUS: {
  value: ProgressStatus
  label: string
  icon: React.ReactNode
  color: string
  bgColor: string
}[] = [
  {
    value: "not_started",
    label: "Not Started",
    icon: <Circle className="w-4 h-4" />,
    color: "text-gray-400",
    bgColor: "bg-gray-500/20",
  },
  {
    value: "in_progress",
    label: "In Progress",
    icon: <Clock className="w-4 h-4" />,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
  },
  {
    value: "memorized",
    label: "Memorized",
    icon: <CircleDot className="w-4 h-4" />,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
  },
  {
    value: "revised",
    label: "Reviewed",
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
  },
]

// Get next status in the cycle
function getNextStatus(currentStatus: ProgressStatus): ProgressStatus {
  const cycle: ProgressStatus[] = ["not_started", "in_progress", "memorized", "revised"]
  const currentIndex = cycle.indexOf(currentStatus)
  return cycle[(currentIndex + 1) % cycle.length]
}

// Search params schema for pagination
interface QuranSearch {
  page?: number
  mode?: "verses" | "reading"
  filter?: ProgressStatus | "all"
}

export const Route = createFileRoute("/quran/$surah")({
  validateSearch: (search: Record<string, unknown>): QuranSearch => {
    const validFilters = ["all", "not_started", "in_progress", "memorized", "revised"]
    const filter = typeof search.filter === "string" && validFilters.includes(search.filter)
      ? search.filter as ProgressStatus | "all"
      : "all"

    return {
      page: typeof search.page === "number" ? search.page : 1,
      mode: search.mode === "reading" ? "reading" : "verses",
      filter,
    }
  },
  loader: async ({ params }) => {
    const surahNumber = parseInt(params.surah, 10)

    if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      throw new Error("Invalid surah number")
    }

    const [surah, allSurahs, session] = await Promise.all([
      fetchSurahDetail(surahNumber),
      fetchAllSurahs(),
      getSurahProgressFn({ data: { surahNumber } }).catch(() => null),
    ])

    return {
      surah,
      allSurahs,
      progressData: session?.progress || [],
    }
  },
  component: SurahReading,
})

function SurahReading() {
  const { surah, allSurahs, progressData } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const isAuthenticated = !!session?.user
  const { showError } = useToast()

  // View mode state
  const viewMode = search.mode || "verses"
  const isReadingMode = viewMode === "reading"

  // Audio player state
  const audioPlayer = useAudioPlayer({
    totalVerses: surah.verses_count,
  })

  // Filter state
  const currentFilter = search.filter || "all"

  // Pagination state
  const currentPage = search.page || 1

  // Audio-related state
  const [lastTapTime, setLastTapTime] = useState(0)
  const [lastTapVerse, setLastTapVerse] = useState<number | null>(null)

  // Query for progress
  const { data: progressResponse } = useQuery({
    queryKey: ["surah-progress", surah.id],
    queryFn: () => getSurahProgressFn({ data: { surahNumber: surah.id } }),
    enabled: isAuthenticated,
    initialData: { progress: progressData },
  })

  const progress = progressResponse?.progress || []

  // Create a map of ayah progress for quick lookup
  const progressMap = new Map(
    progress.map((p: { verse: string; status: string }) => [
      parseInt(p.verse, 10),
      p.status as ProgressStatus
    ])
  )

  // Filter verses based on selected status (only in verses mode, not reading mode)
  const shouldFilter = currentFilter !== "all" && !isReadingMode
  const filteredVerses = shouldFilter
    ? surah.verses.filter((verse) => {
        const status = progressMap.get(verse.id)
        // For "not_started", include verses with no progress record (undefined)
        if (currentFilter === "not_started") {
          return status === "not_started" || status === undefined
        }
        return status === currentFilter
      })
    : surah.verses

  // Calculate verse range for current page (using filtered verses if filtering is active)
  const versesForPage = shouldFilter || isReadingMode ? filteredVerses : surah.verses
  const totalPages = Math.ceil(versesForPage.length / VERSES_PER_PAGE)

  const startIndex = (currentPage - 1) * VERSES_PER_PAGE
  const endIndex = startIndex + VERSES_PER_PAGE
  const currentVerses = versesForPage.slice(startIndex, endIndex)

  // Pagination handlers - defined AFTER totalPages is calculated
  const goToPage = useCallback((page: number) => {
    navigate({ search: { ...search, page } })
  }, [navigate, search])

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      navigate({ search: { ...search, page: currentPage - 1 } })
    }
  }, [currentPage, navigate, search])

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      navigate({ search: { ...search, page: currentPage + 1 } })
    }
  }, [currentPage, totalPages, navigate, search])

  // Touch handling for swipe gestures
  const touchStartX = useRef<number>(0)
  const touchCurrentX = useRef<number>(0)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [swipeProgress, setSwipeProgress] = useState(0)

  const minSwipeDistance = 50
  const maxSwipeDistance = 150

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchCurrentX.current = e.touches[0].clientX
    setSwipeDirection(null)
    setSwipeProgress(0)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX
    const deltaX = touchStartX.current - touchCurrentX.current
    const absDeltaX = Math.abs(deltaX)

    // Determine swipe direction
    if (absDeltaX > 10) {
      setSwipeDirection(deltaX > 0 ? 'left' : 'right')
    }

    // Calculate progress (capped at 1)
    const progress = Math.min(absDeltaX / maxSwipeDistance, 1)
    setSwipeProgress(progress)
  }

  const onTouchEnd = () => {
    const swipeDistance = touchStartX.current - touchCurrentX.current

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      // Swipe left (next page)
      if (swipeDistance > 0 && currentPage < totalPages) {
        goToNextPage()
      }
      // Swipe right (previous page)
      else if (swipeDistance < 0 && currentPage > 1) {
        goToPreviousPage()
      }
    }

    // Reset animation state
    setSwipeDirection(null)
    setSwipeProgress(0)
  }

  // Double-tap handler for playing ayahs
  const handleVerseTap = useCallback((verse: number) => {
    const now = Date.now()
    const tapThreshold = 300 // ms between taps to consider it a double-tap

    if (lastTapVerse === verse && now - lastTapTime < tapThreshold) {
      // Double tap detected - play this ayah
      audioPlayer.play(surah.id, verse)
      setLastTapTime(0)
      setLastTapVerse(null)
    } else {
      setLastTapTime(now)
      setLastTapVerse(verse)
    }
  }, [lastTapTime, lastTapVerse, surah.id, audioPlayer])

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  // Show verse range info
  const startVerseNumber = startIndex + 1
  const endVerseNumber = Math.min(endIndex, surah.verses_count)

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle arrow keys, ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      if (e.key === 'ArrowLeft') {
        // Left arrow - previous page
        e.preventDefault()
        if (currentPage > 1) {
          goToPreviousPage()
        }
      } else if (e.key === 'ArrowRight') {
        // Right arrow - next page
        e.preventDefault()
        if (currentPage < totalPages) {
          goToNextPage()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage, totalPages, goToPreviousPage, goToNextPage])

  // Calculate chevron opacity based on swipe progress
  const chevronOpacity = Math.min(swipeProgress * 1.5, 1)
  const canSwipeLeft = currentPage < totalPages
  const canSwipeRight = currentPage > 1

  // Toggle view mode
  const toggleViewMode = () => {
    const newMode: "verses" | "reading" = isReadingMode ? "verses" : "reading"
    navigate({ search: { ...search, mode: newMode, page: 1 } })
  }

  // Set filter status
  const setFilter = (filter: ProgressStatus | "all") => {
    navigate({ search: { ...search, filter, page: 1 } })
  }

  // Mutation for updating progress
  const updateProgressMutation = useMutation({
    mutationFn: async ({ verse, status }: { verse: number; status: ProgressStatus }) => {
      return updateAyahProgress({
        data: {
          surahNumber: surah.id,
          verse,
          status,
          userId: session?.user?.id, // Pass userId from client session
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surah-progress", surah.id] })
      queryClient.invalidateQueries({ queryKey: ["user-stats"] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to update progress. Please try again."
      showError(message)
    },
  })

  const handleStatusClick = (verse: number, currentStatus: ProgressStatus) => {
    if (!isAuthenticated) {
      // Redirect to login or show a modal
      navigate({ to: "/auth/login", search: { redirect: `/quran/${surah.id}` } })
      return
    }

    const nextStatus = getNextStatus(currentStatus)
    updateProgressMutation.mutate({ verse, status: nextStatus })
  }

  const currentIndex = surah.id - 1
  const prevSurah = currentIndex > 0 ? allSurahs[currentIndex - 1] : null
  const nextSurah = currentIndex < 113 ? allSurahs[currentIndex + 1] : null

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pt-12 relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Mobile Swipe Indicators - animated feedback during swipe */}
      <div className="md:hidden fixed inset-0 pointer-events-none z-40">
        {/* Left swipe indicator (appears when swiping right) */}
        {swipeDirection === 'right' && canSwipeRight && (
          <div
            className="fixed left-6 top-1/2 -translate-y-1/2 flex items-center justify-center transition-opacity duration-150 ease-out"
            style={{ opacity: chevronOpacity }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-xl scale-150" />
              <div className="relative w-16 h-16 rounded-full bg-cyan-600/50 backdrop-blur-sm flex items-center justify-center border border-cyan-400/50">
                <ChevronLeft className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
            </div>
          </div>
        )}

        {/* Right swipe indicator (appears when swiping left) */}
        {swipeDirection === 'left' && canSwipeLeft && (
          <div
            className="fixed right-6 top-1/2 -translate-y-1/2 flex items-center justify-center transition-opacity duration-150 ease-out"
            style={{ opacity: chevronOpacity }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-xl scale-150" />
              <div className="relative w-16 h-16 rounded-full bg-cyan-600/50 backdrop-blur-sm flex items-center justify-center border border-cyan-400/50">
                <ChevronRight className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Navigation Arrows - hidden on mobile, visible on desktop */}
      {totalPages > 1 && (
        <>
          {/* Left Arrow */}
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="hidden md:flex fixed left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-cyan-600/40 hover:bg-cyan-600/60 text-white/80 hover:text-white items-center justify-center shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:scale-110 active:scale-95 touch-manipulation backdrop-blur-sm"
            title="Previous page"
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
          </button>

          {/* Right Arrow */}
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="hidden md:flex fixed right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-cyan-600/40 hover:bg-cyan-600/60 text-white/80 hover:text-white items-center justify-center shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:scale-110 active:scale-95 touch-manipulation backdrop-blur-sm"
            title="Next page"
          >
            <ChevronRight className="w-6 h-6" strokeWidth={2.5} />
          </button>

          {/* Page Indicator */}
          <div className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-50 px-3 md:px-4 py-2 md:py-2 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 text-xs md:text-sm shadow-sm dark:shadow-none">
            Page <span className="text-cyan-500 dark:text-cyan-400 font-semibold">{currentPage}</span> of{" "}
            <span className="text-slate-900 dark:text-white font-semibold">{totalPages}</span>
          </div>
        </>
      )}

      {/* Surah Header */}
      <main className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-8 mb-6 md:mb-8 shadow-sm dark:shadow-none">
          <div className="text-center">
            {/* Surah Number */}
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full mb-4 md:mb-6">
              <span className="text-white font-bold text-xl md:text-2xl">{surah.id}</span>
            </div>

            {/* Surah Names */}
            <h2 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">{surah.name_simple}</h2>
            <p className="text-3xl md:text-5xl text-cyan-500 dark:text-cyan-400 mb-4 md:mb-6" dir="rtl">{surah.name_arabic}</p>

            {/* Meta Info */}
            <div className="flex items-center justify-center gap-4 md:gap-6 text-gray-500 dark:text-gray-400 text-sm md:text-base mb-4 md:mb-6">
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {surah.verses_count} Verses
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {surah.revelation_place === "makkah" ? "Makkah" : "Madinah"}
              </span>
            </div>

            {/* View Mode Toggle */}
            <button
              onClick={toggleViewMode}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 md:px-6 py-3 bg-slate-200 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg hover:border-cyan-500/50 transition-all duration-300 text-slate-900 dark:text-white font-medium text-sm md:text-base"
            >
              {isReadingMode ? (
                <>
                  <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline">Switch to Verses Mode</span>
                  <span className="sm:hidden">Verses Mode</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline">Switch to Reading Mode</span>
                  <span className="sm:hidden">Reading Mode</span>
                </>
              )}
            </button>

            {/* Filter by Status (only show in verses mode and authenticated) */}
            {!isReadingMode && isAuthenticated && (
              <div className="mt-3 md:mt-4">
                <label className="block text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2">Filter by status:</label>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => setFilter("all")}
                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                      currentFilter === "all"
                        ? "bg-slate-800 dark:bg-slate-600 text-white"
                        : "bg-slate-100 dark:bg-slate-700/30 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    All
                  </button>
                  {PROGRESS_STATUS.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => setFilter(status.value)}
                      className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                        currentFilter === status.value
                          ? `${status.bgColor} ${status.color}`
                          : "bg-slate-100 dark:bg-slate-700/30 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50"
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
                {shouldFilter && (
                  <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-2">
                    Showing {filteredVerses.length} {filteredVerses.length === 1 ? "verse" : "verses"}
                  </p>
                )}
              </div>
            )}

            {/* Auth hint for progress tracking */}
            {!isAuthenticated && (
              <div className="mt-4 md:mt-6 text-xs md:text-sm text-gray-600 dark:text-gray-500">
                <Link to="/auth/login" search={{ redirect: `/quran/${surah.id}` }} className="text-cyan-600 dark:text-cyan-400 hover:underline">
                  Sign in
                </Link>
                {" "}to track your memorization progress
              </div>
            )}
          </div>
        </div>

        {/* Bismillah - Show if surah has bismillah, is not Surah 1 (Al-Fatiha has it built into verse 1), and is page 1 */}
        {surah.bismillah_pre && surah.id !== 1 && surah.id !== 9 && currentPage === 1 && (
          <div className="text-center mb-8 md:mb-12">
            <p className="text-2xl md:text-4xl text-amber-600 dark:text-amber-400" dir="rtl" style={{ fontFamily: "'Amiri', serif" }}>
              بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
            </p>
          </div>
        )}

        {/* Pagination Info */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-3 md:p-4 mb-6 md:mb-8 shadow-sm dark:shadow-none">
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 text-center">
              <div className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                Showing verses <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{startVerseNumber}</span> to{" "}
                <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{endVerseNumber}</span> of{" "}
                <span className="text-slate-900 dark:text-white font-semibold">{surah.verses_count}</span>
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                Page <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{currentPage}</span> of{" "}
                <span className="text-slate-900 dark:text-white font-semibold">{totalPages}</span>
              </div>
            </div>
          </div>
        )}

        {/* Verses */}
        {isReadingMode ? (
          // Reading Mode - Continuous flow with circle badge dividers inline
          <div className="bg-white dark:bg-slate-800/30 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-6 lg:p-8 shadow-sm dark:shadow-none">
            {/* Arabic Text - Continuous with circle badge dividers */}
            <p
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-slate-900 dark:text-white leading-loose text-right mb-8 md:mb-12"
              dir="rtl"
              style={{ fontFamily: "'Amiri', 'Scheherazade New', serif" }}
            >
              {currentVerses.map((verse, index) => {
                const verseNumber = verse.verse_number ?? (index + 1 + startIndex)
                const isFirst = index === 0
                return (
                  <React.Fragment key={verse.id}>
                    {!isFirst && (
                      <span className="inline-flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-cyan-500/30 mx-2 md:mx-2.5 align-middle">
                        <span className="text-cyan-600 dark:text-cyan-400 text-xs md:text-sm font-semibold leading-none">{toArabicNumeral(verseNumber)}</span>
                      </span>
                    )}
                    <span>{verse.text_uthmani}</span>
                  </React.Fragment>
                )
              })}
            </p>

            {/* Divider */}
            <div className="border-t border-slate-300 dark:border-slate-600 my-6 md:my-8"></div>

            {/* Translations - Each verse with number */}
            <div className="space-y-4 md:space-y-6">
              {currentVerses.map((verse, index) => {
                const verseNumber = verse.verse_number ?? (index + 1 + startIndex)
                return (
                  <div key={`trans-${verse.id}`} className="text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                    <span className="text-cyan-600 dark:text-cyan-400 font-semibold">[{verseNumber}]</span>{" "}
                    <span
                      dangerouslySetInnerHTML={{
                        __html: verse.translation?.replace(
                          /__FN_(\d+)__/g,
                          '<sub style="font-size: 0.7em;">[$1]</sub>'
                        ) || "",
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          // Verses Mode - Individual cards
          <div className="space-y-4 md:space-y-6">
            {currentVerses.map((verse, index) => {
              // Use verse.verse_number for the verse number within this surah (1-286)
              // NOT verse.id which is a global unique identifier across entire Quran
              // If verse_number is null, calculate from index in filtered array + page offset
              const verseNumber = verse.verse_number ?? (index + 1 + startIndex)
              const status = progressMap.get(verseNumber) || "not_started"
              const statusConfig = PROGRESS_STATUS.find((s) => s.value === status) || PROGRESS_STATUS[0]

              return (
                <div
                  key={verse.id}
                  className={`bg-white dark:bg-slate-800/30 backdrop-blur-sm border rounded-xl p-4 md:p-6 lg:p-8 transition-all duration-300 shadow-sm dark:shadow-none ${
                    status !== "not_started"
                      ? "border-cyan-500/30 bg-cyan-50 dark:bg-cyan-500/5"
                      : "border-slate-200 dark:border-slate-700/50 hover:border-cyan-500/30"
                  }`}
                >
                  <div className="flex items-start gap-3 md:gap-4">
                    {/* Verse Number Badge */}
                    <div className="flex-shrink-0">
                      <div className="w-9 h-9 md:w-10 md:h-10 bg-cyan-600 border-2 border-cyan-400 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm md:text-base drop-shadow-md" dir="rtl">{toArabicNumeral(verseNumber)}</span>
                      </div>
                    </div>

                    {/* Verse Text */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-slate-900 dark:text-white leading-loose text-right mb-3 md:mb-4"
                        dir="rtl"
                        style={{ fontFamily: "'Amiri', 'Scheherazade New', serif" }}
                      >
                        {verse.text_uthmani}
                      </p>

                      {/* Translation */}
                      {verse.translation && (
                        <p
                          className="text-sm md:text-base lg:text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-3 md:mb-4"
                          dangerouslySetInnerHTML={{
                            __html: verse.translation.replace(
                              /__FN_(\d+)__/g,
                              '<sub style="font-size: 0.7em;">[$1]</sub>'
                            ),
                          }}
                        />
                      )}

                      {/* Progress Status & Controls */}
                      <div className="mt-3 md:mt-4 flex flex-wrap items-center gap-2 md:gap-4">
                        {/* Audio Player - Per Verse */}
                        <div
                          onTouchEnd={() => handleVerseTap(verseNumber)}
                          className="cursor-pointer"
                        >
                          <VerseAudioPlayer
                            isPlaying={audioPlayer.currentSurah === surah.id && audioPlayer.currentAyah === verseNumber && audioPlayer.isPlaying()}
                            isLoading={audioPlayer.currentSurah === surah.id && audioPlayer.currentAyah === verseNumber && audioPlayer.playbackState === 'loading'}
                            onPlay={() => audioPlayer.play(surah.id, verseNumber)}
                            onPause={audioPlayer.pause}
                            compact
                          />
                        </div>

                        {/* Progress bar for currently playing verse */}
                        {audioPlayer.currentSurah === surah.id && audioPlayer.currentAyah === verseNumber && (
                          <div className="flex-1 min-w-[120px] sm:min-w-[200px]">
                            <AudioProgressBar
                              currentTime={audioPlayer.currentTime}
                              duration={audioPlayer.duration}
                              onSeek={audioPlayer.seek}
                              showTime={false}
                            />
                          </div>
                        )}

                        {/* Additional verse info */}
                        {verse.juz_number !== null && (
                          <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600 dark:text-gray-500">
                            <span>Juz {verse.juz_number}</span>
                            {verse.page_number !== null && (
                              <>
                                <span>•</span>
                                <span>Page {verse.page_number}</span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Progress Status Button */}
                        <button
                          onClick={() => handleStatusClick(verseNumber, status)}
                          disabled={updateProgressMutation.isPending}
                          className={`
                            flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 md:py-1.5 rounded-lg text-xs md:text-sm font-medium
                            transition-all duration-200 active:scale-95 touch-manipulation
                            ${statusConfig.bgColor} ${statusConfig.color}
                            ${!isAuthenticated ? "opacity-70" : "cursor-pointer"}
                            ${updateProgressMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}
                          `}
                          title={isAuthenticated ? `Click to change status` : "Sign in to track progress"}
                        >
                          <span className="hidden sm:inline">{statusConfig.icon}</span>
                          <span>{statusConfig.label}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 md:mt-12 bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-3 md:p-4 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-center gap-1 md:gap-2 overflow-x-auto">
              {/* First Page */}
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 md:p-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:border-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700/50 touch-manipulation"
                title="First page"
              >
                <ChevronsLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-500 dark:text-gray-400" />
              </button>

              {/* Previous Page */}
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="p-1.5 md:p-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:border-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700/50 touch-manipulation"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-500 dark:text-gray-400" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-0.5 md:gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number

                  // Show window of pages around current page (mobile shows fewer pages)
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i < 4 ? i + 1 : (i === 4 ? -1 : totalPages)
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = i < 2 ? (i === 0 ? 1 : -1) : totalPages - 4 + i
                  } else {
                    pageNum = i === 0 ? 1 : i === 4 ? totalPages : currentPage - 2 + i
                  }

                  if (pageNum === -1) {
                    return (
                      <span key={`ellipsis-${i}`} className="px-1.5 md:px-2 text-gray-500 dark:text-gray-500 text-xs md:text-sm">
                        ...
                      </span>
                    )
                  }

                  const isActive = pageNum === currentPage

                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`
                        min-w-[32px] md:min-w-[40px] px-2 md:px-3 py-2 rounded-lg font-medium transition-all text-xs md:text-sm touch-manipulation
                        ${isActive
                          ? "bg-cyan-500 text-white"
                          : "border border-slate-300 dark:border-slate-600 hover:border-cyan-500/50 text-gray-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                        }
                      `}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              {/* Next Page */}
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="p-1.5 md:p-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:border-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700/50 touch-manipulation"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-500 dark:text-gray-400" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 md:p-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:border-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700/50 touch-manipulation"
                title="Last page"
              >
                <ChevronsRight className="w-4 h-4 md:w-5 md:h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {/* Navigation Between Surahs */}
        <div className="mt-8 md:mt-12 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 md:gap-4">
          {prevSurah ? (
            <Link
              to="/quran/$surah"
              params={{ surah: prevSurah.id.toString() }}
              search={{ page: 1 }}
              className="flex-1 bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-3 md:p-4 hover:border-cyan-500/50 transition-all duration-300 text-center shadow-sm dark:shadow-none"
            >
              <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                <div className="text-left">
                  <p className="text-xs">Previous</p>
                  <p className="font-semibold text-sm md:text-base">{prevSurah.name_simple}</p>
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          <Link
            to="/quran"
            className="px-4 md:px-6 py-3 md:py-4 bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl hover:border-cyan-500/50 transition-all duration-300 text-center shadow-sm dark:shadow-none"
          >
            <span className="text-gray-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm md:text-base">Surah Index</span>
          </Link>

          {nextSurah ? (
            <Link
              to="/quran/$surah"
              params={{ surah: nextSurah.id.toString() }}
              search={{ page: 1 }}
              className="flex-1 bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-3 md:p-4 hover:border-cyan-500/50 transition-all duration-300 text-center shadow-sm dark:shadow-none"
            >
              <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <div className="text-right">
                  <p className="text-xs">Next</p>
                  <p className="font-semibold text-sm md:text-base">{nextSurah.name_simple}</p>
                </div>
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </main>

      {/* Full Audio Player Bar (shows when audio is active) */}
      {(audioPlayer.playbackState === 'playing' ||
        audioPlayer.playbackState === 'paused' ||
        audioPlayer.playbackState === 'loading') && (
        <FullAudioPlayer
          isPlaying={audioPlayer.isPlaying()}
          isLoading={audioPlayer.playbackState === 'loading'}
          currentTime={audioPlayer.currentTime}
          duration={audioPlayer.duration}
          volume={audioPlayer.volume}
          speed={audioPlayer.speed}
          repeatMode={audioPlayer.repeatMode}
          surahNumber={audioPlayer.currentSurah}
          verse={audioPlayer.currentAyah}
          reciterId={audioPlayer.reciterId}
          onTogglePlayPause={audioPlayer.togglePlayPause}
          onSeek={audioPlayer.seek}
          onVolumeChange={audioPlayer.setVolume}
          onSpeedChange={audioPlayer.setSpeed}
          onRepeatModeChange={audioPlayer.setRepeatMode}
          onReciterChange={audioPlayer.setReciterId}
          onPrevious={() => audioPlayer.currentAyah && audioPlayer.currentAyah > 1 && audioPlayer.play(audioPlayer.currentSurah!, audioPlayer.currentAyah - 1)}
          onNext={() => audioPlayer.currentSurah && audioPlayer.currentAyah && audioPlayer.currentAyah < surah.verses_count && audioPlayer.play(audioPlayer.currentSurah, audioPlayer.currentAyah + 1)}
          hasPrevious={audioPlayer.currentAyah !== null && audioPlayer.currentAyah > 1}
          hasNext={audioPlayer.currentAyah !== null && audioPlayer.currentAyah < surah.verses_count}
        />
      )}
    </div>
  )
}
