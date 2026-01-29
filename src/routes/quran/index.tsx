import { createFileRoute, Link } from "@tanstack/react-router"
import { fetchAllSurahs } from "@/lib/quran-api"
import { BookOpen, MapPin } from "lucide-react"

export const Route = createFileRoute("/quran/")({
  loader: async () => {
    const surahs = await fetchAllSurahs()
    return { surahs }
  },
  component: QuranIndex,
})

function QuranIndex() {
  const { surahs } = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">The Holy Quran</h1>
          <p className="text-gray-400">Select a Surah to begin reading</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {surahs.map((surah) => (
            <Link
              key={surah.id}
              to="/quran/$surah"
              params={{ surah: surah.id.toString() }}
              className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-5 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <div className="flex items-start gap-4">
                {/* Surah Number Badge */}
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{surah.id}</span>
                </div>

                {/* Surah Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors truncate">
                      {surah.name_simple}
                    </h3>
                    <span className="text-lg text-cyan-400" dir="rtl">
                      {surah.name_arabic}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {surah.verses_count} verses
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {surah.revelation_place === "makkah" ? "Makkah" : "Madinah"}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
