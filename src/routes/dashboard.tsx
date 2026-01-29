import { createFileRoute, Link, Navigate } from "@tanstack/react-router"
import { useSession } from "@/lib/auth-client"
import { getUserStats } from "@/lib/server/progress"
import { useQuery } from "@tanstack/react-query"
import { BookOpen, Flame, Target } from "lucide-react"

export const Route = createFileRoute("/dashboard")({
  loader: async () => {
    try {
      const stats = await getUserStats()
      return { statsData: stats.data?.stats || null }
    } catch {
      return { statsData: null }
    }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { data: session, isPending } = useSession()
  const { statsData } = Route.useLoaderData()

  // Query for stats
  const { data: statsResponse } = useQuery({
    queryKey: ["user-stats"],
    queryFn: getUserStats,
    enabled: !!session?.user,
    initialData: { stats: statsData },
  })

  const stats = statsResponse?.stats || {
    memorized: 0,
    inProgress: 0,
    revised: 0,
    notStarted: 0,
    surahsCompleted: 0,
    totalAyahs: 0,
  }

  // Redirect to login if not authenticated
  if (!isPending && !session?.user) {
    return <Navigate to="/auth/login" search={{ redirect: "/dashboard" }} />
  }

  // Show loading state while checking session
  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-slate-900 dark:text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">Dashboard</h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-gray-400">Track your Quran memorization progress</p>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
          <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white">Memorized Ayahs</h3>
              <div className="w-9 h-9 md:w-10 md:h-10 bg-cyan-100 dark:bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{stats.memorized}</p>
            <p className="text-xs md:text-sm text-slate-500 dark:text-gray-400 mt-1">verses memorized</p>
            {stats.inProgress > 0 && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">+{stats.inProgress} in progress</p>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white">Surahs Completed</h3>
              <div className="w-9 h-9 md:w-10 md:h-10 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{stats.surahsCompleted}/114</p>
            <p className="text-xs md:text-sm text-slate-500 dark:text-gray-400 mt-1">surahs completed</p>
          </div>

          <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-6 sm:col-span-2 md:col-span-1 shadow-sm">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white">Reviewed Ayahs</h3>
              <div className="w-9 h-9 md:w-10 md:h-10 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center">
                <Flame className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{stats.revised}</p>
            <p className="text-xs md:text-sm text-slate-500 dark:text-gray-400 mt-1">verses reviewed</p>
          </div>
        </div>

        {/* Progress Breakdown */}
        {stats.totalAyahs > 0 && (
          <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-6 mb-8 md:mb-12 shadow-sm">
            <h2 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-white mb-3 md:mb-4">Progress Breakdown</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
              <div className="text-center p-2 md:p-0">
                <p className="text-xl md:text-2xl font-bold text-cyan-600 dark:text-cyan-400">{stats.memorized}</p>
                <p className="text-xs md:text-sm text-slate-500 dark:text-gray-400">Memorized</p>
              </div>
              <div className="text-center p-2 md:p-0">
                <p className="text-xl md:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.inProgress}</p>
                <p className="text-xs md:text-sm text-slate-500 dark:text-gray-400">In Progress</p>
              </div>
              <div className="text-center p-2 md:p-0">
                <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">{stats.revised}</p>
                <p className="text-xs md:text-sm text-slate-500 dark:text-gray-400">Reviewed</p>
              </div>
              <div className="text-center p-2 md:p-0">
                <p className="text-xl md:text-2xl font-bold text-slate-400 dark:text-gray-400">{stats.notStarted}</p>
                <p className="text-xs md:text-sm text-slate-500 dark:text-gray-400">Not Started</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <Link
            to="/quran/1"
            className="group bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-6 hover:border-cyan-500/50 transition-all duration-300 active:scale-[0.98] touch-manipulation shadow-sm"
          >
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-11 h-11 md:w-12 md:h-12 bg-cyan-100 dark:bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xl md:text-2xl">📖</span>
              </div>
              <div className="min-w-0">
                <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors truncate">
                  Start Reading
                </h3>
                <p className="text-slate-500 dark:text-gray-400 text-xs md:text-sm truncate">Begin with Surah Al-Fatiha</p>
              </div>
            </div>
          </Link>

          <Link
            to="/quran"
            className="group bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-6 hover:border-purple-500/50 transition-all duration-300 active:scale-[0.98] touch-manipulation shadow-sm"
          >
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-11 h-11 md:w-12 md:h-12 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xl md:text-2xl">📚</span>
              </div>
              <div className="min-w-0">
                <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors truncate">
                  Browse All Surahs
                </h3>
                <p className="text-slate-500 dark:text-gray-400 text-xs md:text-sm truncate">View all 114 surahs</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Motivational Message */}
        {stats.totalAyahs === 0 && (
          <div className="mt-8 md:mt-12 text-center px-4">
            <p className="text-base md:text-lg text-slate-500 dark:text-gray-400">
              Start your memorization journey by reading Surah Al-Fatiha
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
