import { createFileRoute, Link, Navigate } from '@tanstack/react-router'
import { BookOpen, Brain, TrendingUp } from 'lucide-react'
import { useSession } from '@/lib/auth-client'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const { data: session, isPending } = useSession()

  // Redirect to dashboard if authenticated
  if (!isPending && session?.user) {
    return <Navigate to="/dashboard" />
  }

  // Show loading while checking session
  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-slate-900 dark:text-white text-xl">Loading...</div>
      </div>
    )
  }
  const features = [
    {
      icon: <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-500 dark:text-cyan-400" />,
      title: 'Quran Reading',
      description:
        'Beautiful Arabic text display with proper typography and easy navigation through Surahs and Ayahs.',
    },
    {
      icon: <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-purple-500 dark:text-purple-400" />,
      title: 'Memorization Tracking',
      description:
        'Track your progress per Ayah with visual indicators. Mark what you have memorized and what needs revision.',
    },
    {
      icon: <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 dark:text-amber-400" />,
      title: 'Quiz Mode',
      description:
        'Test your memorization with self-assessment tools. Use hints and track weak areas.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <section className="relative py-12 md:py-20 px-4 sm:px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 dark:from-cyan-500/10 dark:via-blue-500/10 dark:to-purple-500/10"></div>
        <div className="relative max-w-5xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-4 md:mb-6">
            Quran Memorizer
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl text-slate-600 dark:text-gray-300 mb-3 md:mb-4 font-light">
            Your companion for Hifz journey
          </p>
          <p className="text-sm sm:text-base md:text-lg text-slate-500 dark:text-gray-400 max-w-3xl mx-auto mb-6 md:mb-8 px-4">
            A modern web application to help you memorize the Holy Quran with
            interactive tools including text display, audio recitation, progress tracking,
            and self-testing features.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 w-full sm:w-auto px-4">
            <Link
              to="/auth/register"
              className="w-full sm:w-auto px-6 md:px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50 text-center touch-manipulation"
            >
              Get Started
            </Link>
            <Link
              to="/auth/login"
              className="w-full sm:w-auto px-6 md:px-8 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors text-center touch-manipulation"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white text-center mb-8 md:mb-12">
          Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-5 md:p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 active:scale-[0.98] touch-manipulation"
            >
              <div className="mb-3 md:mb-4">{feature.icon}</div>
              <h3 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-white mb-2 md:mb-3">
                {feature.title}
              </h3>
              <p className="text-sm md:text-base text-slate-500 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
