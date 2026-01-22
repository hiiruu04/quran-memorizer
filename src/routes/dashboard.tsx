import { createFileRoute, Link, Navigate } from "@tanstack/react-router"
import { useSession } from "@/lib/auth-client"

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
})

function DashboardPage() {
  const { data: session, isPending } = useSession()

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
              <h3 className="text-lg font-semibold text-white">Total Ayahs</h3>
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <span className="text-cyan-400 text-xl">📖</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-white">0</p>
            <p className="text-sm text-gray-400 mt-1">memorized</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Surahs</h3>
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span className="text-purple-400 text-xl">📚</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-white">0/114</p>
            <p className="text-sm text-gray-400 mt-1">completed</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Streak</h3>
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <span className="text-amber-400 text-xl">🔥</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-white">0</p>
            <p className="text-sm text-gray-400 mt-1">days</p>
          </div>
        </div>

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

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 opacity-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Quiz Mode</h3>
                <p className="text-gray-400 text-sm">Test your memorization</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Coming soon</p>
          </div>
        </div>
      </main>
    </div>
  )
}
