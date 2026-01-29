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
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Track your Quran memorization progress</p>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Memorized Ayahs</h3>
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{stats.memorized}</p>
            <p className="text-sm text-gray-400 mt-1">verses memorized</p>
            {stats.inProgress > 0 && (
              <p className="text-xs text-yellow-400 mt-2">+{stats.inProgress} in progress</p>
            )}
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Surahs Completed</h3>
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{stats.surahsCompleted}/114</p>
            <p className="text-sm text-gray-400 mt-1">surahs completed</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Revised Ayahs</h3>
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Flame className="w-5 h-5 text-green-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{stats.revised}</p>
            <p className="text-sm text-gray-400 mt-1">verses revised</p>
          </div>
        </div>

        {/* Progress Breakdown */}
        {stats.totalAyahs > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">Progress Breakdown</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-400">{stats.memorized}</p>
                <p className="text-sm text-gray-400">Memorized</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">{stats.inProgress}</p>
                <p className="text-sm text-gray-400">In Progress</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{stats.revised}</p>
                <p className="text-sm text-gray-400">Revised</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-400">{stats.notStarted}</p>
                <p className="text-sm text-gray-400">Not Started</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/quran/1"
            className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📖</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  Start Reading
                </h3>
                <p className="text-gray-400 text-sm">Begin with Surah Al-Fatiha</p>
              </div>
            </div>
          </Link>

          <Link
            to="/quran"
            className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                  Browse All Surahs
                </h3>
                <p className="text-gray-400 text-sm">View all 114 surahs</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Motivational Message */}
        {stats.totalAyahs === 0 && (
          <div className="mt-12 text-center">
            <p className="text-lg text-gray-400">
              Start your memorization journey by reading Surah Al-Fatiha
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
