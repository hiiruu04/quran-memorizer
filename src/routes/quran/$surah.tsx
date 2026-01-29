import { createFileRoute, Link } from "@tanstack/react-router"
import { fetchSurahDetail, fetchAllSurahs } from "@/lib/quran-api"
import { ChevronLeft, ChevronRight, BookOpen, MapPin, ChevronsLeft, ChevronsRight } from "lucide-react"
import { getSurahProgressFn, updateAyahProgress } from "@/lib/server/progress"
import { useSession } from "@/lib/auth-client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Circle, CircleDot, CheckCircle2, Clock } from "lucide-react"
import type { ProgressStatus } from "@/db/queries"
import React from "react"

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
    label: "Revised",
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
}

export const Route = createFileRoute("/quran/$surah")({
  validateSearch: (search: Record<string, unknown>): QuranSearch => {
    return {
      page: typeof search.page === "number" ? search.page : 1,
      mode: search.mode === "reading" ? "reading" : "verses",
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

  // View mode state
  const viewMode = search.mode || "verses"
  const isReadingMode = viewMode === "reading"

  // Pagination state
  const currentPage = search.page || 1
  const totalPages = Math.ceil(surah.verses_count / VERSES_PER_PAGE)

  // Calculate verse range for current page
  const startIndex = (currentPage - 1) * VERSES_PER_PAGE
  const endIndex = startIndex + VERSES_PER_PAGE
  const currentVerses = surah.verses.slice(startIndex, endIndex)

  // Show verse range info
  const startVerseNumber = startIndex + 1
  const endVerseNumber = Math.min(endIndex, surah.verses_count)

  // Pagination handlers
  const goToPage = (page: number) => {
    navigate({ search: { ...search, page } })
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1)
    }
  }

  // Toggle view mode
  const toggleViewMode = () => {
    const newMode: "verses" | "reading" = isReadingMode ? "verses" : "reading"
    navigate({ search: { mode: newMode, page: 1 } })
  }

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
    progress.map((p: { ayahNumber: string; status: string }) => [
      parseInt(p.ayahNumber, 10),
      p.status as ProgressStatus
    ])
  )

  // Mutation for updating progress
  const updateProgressMutation = useMutation({
    mutationFn: async ({ ayahNumber, status }: { ayahNumber: number; status: ProgressStatus }) => {
      return updateAyahProgress({
        data: {
          surahNumber: surah.id,
          ayahNumber,
          status,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surah-progress", surah.id] })
      queryClient.invalidateQueries({ queryKey: ["user-stats"] })
    },
  })

  const handleStatusClick = (ayahNumber: number, currentStatus: ProgressStatus) => {
    if (!isAuthenticated) {
      // Redirect to login or show a modal
      window.location.href = `/auth/login?redirect=/quran/${surah.id}`
      return
    }

    const nextStatus = getNextStatus(currentStatus)
    updateProgressMutation.mutate({ ayahNumber, status: nextStatus })
  }

  const currentIndex = surah.id - 1
  const prevSurah = currentIndex > 0 ? allSurahs[currentIndex - 1] : null
  const nextSurah = currentIndex < 113 ? allSurahs[currentIndex + 1] : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pt-12 relative">
      {/* Carousel-style Navigation Arrows */}
      {totalPages > 1 && (
        <>
          {/* Left Arrow */}
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="fixed left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-cyan-600/90 hover:bg-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
            title="Previous page"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-cyan-600/90 hover:bg-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
            title="Next page"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Page Indicator */}
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900/90 backdrop-blur-sm border border-slate-700 text-gray-400 text-sm">
            Page <span className="text-cyan-400 font-semibold">{currentPage}</span> of{" "}
            <span className="text-white font-semibold">{totalPages}</span>
          </div>
        </>
      )}

      {/* Surah Header */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 mb-8">
          <div className="text-center">
            {/* Surah Number */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full mb-6">
              <span className="text-white font-bold text-2xl">{surah.id}</span>
            </div>

            {/* Surah Names */}
            <h2 className="text-4xl font-bold text-white mb-2">{surah.name_simple}</h2>
            <p className="text-5xl text-cyan-400 mb-6" dir="rtl">{surah.name_arabic}</p>

            {/* Meta Info */}
            <div className="flex items-center justify-center gap-6 text-gray-400 mb-6">
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
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700/50 border border-slate-600 rounded-lg hover:border-cyan-500/50 transition-all duration-300 text-white font-medium"
            >
              {isReadingMode ? (
                <>
                  <BookOpen className="w-5 h-5" />
                  Switch to Verses Mode
                </>
              ) : (
                <>
                  <BookOpen className="w-5 h-5" />
                  Switch to Reading Mode
                </>
              )}
            </button>

            {/* Auth hint for progress tracking */}
            {!isAuthenticated && (
              <div className="mt-6 text-sm text-gray-500">
                <Link to="/auth/login" search={{ redirect: `/quran/${surah.id}` }} className="text-cyan-400 hover:underline">
                  Sign in
                </Link>
                {" "}to track your memorization progress
              </div>
            )}
          </div>
        </div>

        {/* Bismillah - Show if surah has bismillah, is not Surah 1 (Al-Fatiha has it built into verse 1), and is page 1 */}
        {surah.bismillah_pre && surah.id !== 1 && surah.id !== 9 && currentPage === 1 && (
          <div className="text-center mb-12">
            <p className="text-4xl text-amber-400" dir="rtl" style={{ fontFamily: "'Amiri', serif" }}>
              بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
            </p>
          </div>
        )}

        {/* Pagination Info */}
        {totalPages > 1 && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="text-gray-400">
                Showing verses <span className="text-cyan-400 font-semibold">{startVerseNumber}</span> to{" "}
                <span className="text-cyan-400 font-semibold">{endVerseNumber}</span> of{" "}
                <span className="text-white font-semibold">{surah.verses_count}</span>
              </div>
              <div className="text-gray-400">
                Page <span className="text-cyan-400 font-semibold">{currentPage}</span> of{" "}
                <span className="text-white font-semibold">{totalPages}</span>
              </div>
            </div>
          </div>
        )}

        {/* Verses */}
        {isReadingMode ? (
          // Reading Mode - Continuous flow with circle badge dividers inline
          <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-xl p-6 md:p-8">
            {/* Arabic Text - Continuous with circle badge dividers */}
            <p
              className="text-3xl md:text-4xl text-white leading-loose text-right mb-12"
              dir="rtl"
              style={{ fontFamily: "'Amiri', 'Scheherazade New', serif" }}
            >
              {currentVerses.map((verse, index) => {
                const verseNumber = index + 1 + startIndex
                const isFirst = index === 0
                return (
                  <React.Fragment key={verse.id}>
                    {!isFirst && (
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-cyan-500/30 mx-3 align-middle">
                        <span className="text-cyan-400 text-sm font-semibold">{toArabicNumeral(verseNumber)}</span>
                      </span>
                    )}
                    <span>{verse.text_uthmani}</span>
                  </React.Fragment>
                )
              })}
            </p>

            {/* Divider */}
            <div className="border-t border-slate-600 my-8"></div>

            {/* Translations - Each verse with number */}
            <div className="space-y-6">
              {currentVerses.map((verse, index) => {
                const verseNumber = index + 1 + startIndex
                return (
                  <div key={`trans-${verse.id}`} className="text-lg text-gray-300 leading-relaxed">
                    <span className="text-cyan-400 font-semibold">[{verseNumber}]</span>{" "}
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
          <div className="space-y-6">
            {currentVerses.map((verse, index) => {
              const verseNumber = index + 1 + startIndex
              const status = progressMap.get(verseNumber) || "not_started"
              const statusConfig = PROGRESS_STATUS.find((s) => s.value === status) || PROGRESS_STATUS[0]

              return (
                <div
                  key={verse.id}
                  className={`bg-slate-800/30 backdrop-blur-sm border rounded-xl p-6 md:p-8 transition-all duration-300 ${
                    status !== "not_started"
                      ? "border-cyan-500/30 bg-cyan-500/5"
                      : "border-slate-700/50 hover:border-cyan-500/30"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Verse Number Badge */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-cyan-600 border-2 border-cyan-400 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-base drop-shadow-md" dir="rtl">{toArabicNumeral(verseNumber)}</span>
                      </div>
                    </div>

                    {/* Verse Text */}
                    <div className="flex-1">
                      <p
                        className="text-3xl md:text-4xl text-white leading-loose text-right mb-4"
                        dir="rtl"
                        style={{ fontFamily: "'Amiri', 'Scheherazade New', serif" }}
                      >
                        {verse.text_uthmani}
                      </p>

                      {/* Translation */}
                      {verse.translation && (
                        <p
                          className="text-lg text-gray-300 leading-relaxed mb-4"
                          dangerouslySetInnerHTML={{
                            __html: verse.translation.replace(
                              /__FN_(\d+)__/g,
                              '<sub style="font-size: 0.7em;">[$1]</sub>'
                            ),
                          }}
                        />
                      )}

                      {/* Progress Status & Controls */}
                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        {/* Additional verse info */}
                        {verse.juz_number !== null && (
                          <div className="flex items-center gap-4 text-sm text-gray-500">
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
                            flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                            transition-all duration-200 hover:scale-105 active:scale-95
                            ${statusConfig.bgColor} ${statusConfig.color}
                            ${!isAuthenticated ? "opacity-70" : "cursor-pointer"}
                            ${updateProgressMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}
                          `}
                          title={isAuthenticated ? `Click to change status` : "Sign in to track progress"}
                        >
                          {statusConfig.icon}
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
          <div className="mt-12 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-center gap-2">
              {/* First Page */}
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-600 hover:border-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700/50"
                title="First page"
              >
                <ChevronsLeft className="w-5 h-5 text-gray-400" />
              </button>

              {/* Previous Page */}
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-600 hover:border-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700/50"
                title="Previous page"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number

                  // Show window of pages around current page
                  if (totalPages <= 7) {
                    pageNum = i + 1
                  } else if (currentPage <= 4) {
                    pageNum = i < 5 ? i + 1 : (i === 5 ? -1 : totalPages)
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = i < 2 ? (i === 0 ? 1 : -1) : totalPages - 6 + i
                  } else {
                    pageNum = i === 0 ? 1 : i === 6 ? totalPages : currentPage - 3 + i
                  }

                  if (pageNum === -1) {
                    return (
                      <span key={`ellipsis-${i}`} className="px-2 text-gray-500">
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
                        min-w-[40px] px-3 py-2 rounded-lg font-medium transition-all
                        ${isActive
                          ? "bg-cyan-500 text-white"
                          : "border border-slate-600 hover:border-cyan-500/50 text-gray-400 hover:bg-slate-700/50"
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
                className="p-2 rounded-lg border border-slate-600 hover:border-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700/50"
                title="Next page"
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-600 hover:border-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700/50"
                title="Last page"
              >
                <ChevronsRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {/* Navigation Between Surahs */}
        <div className="mt-12 flex items-center justify-between gap-4">
          {prevSurah ? (
            <Link
              to="/quran/$surah"
              params={{ surah: prevSurah.id.toString() }}
              search={{ page: 1 }}
              className="flex-1 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4 hover:border-cyan-500/50 transition-all duration-300 text-center"
            >
              <div className="flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
                <div className="text-left">
                  <p className="text-xs">Previous</p>
                  <p className="font-semibold">{prevSurah.name_simple}</p>
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          <Link
            to="/quran"
            className="px-6 py-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl hover:border-cyan-500/50 transition-all duration-300 text-center"
          >
            <span className="text-gray-400 hover:text-white transition-colors">Surah Index</span>
          </Link>

          {nextSurah ? (
            <Link
              to="/quran/$surah"
              params={{ surah: nextSurah.id.toString() }}
              search={{ page: 1 }}
              className="flex-1 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4 hover:border-cyan-500/50 transition-all duration-300 text-center"
            >
              <div className="flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors">
                <div className="text-right">
                  <p className="text-xs">Next</p>
                  <p className="font-semibold">{nextSurah.name_simple}</p>
                </div>
                <ChevronRight className="w-5 h-5" />
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </main>
    </div>
  )
}
