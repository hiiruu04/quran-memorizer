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
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }
  const features = [
    {
      icon: <BookOpen className="w-12 h-12 text-cyan-400" />,
      title: 'Quran Reading',
      description:
        'Beautiful Arabic text display with proper typography and easy navigation through Surahs and Ayahs.',
    },
    {
      icon: <Brain className="w-12 h-12 text-purple-400" />,
      title: 'Memorization Tracking',
      description:
        'Track your progress per Ayah with visual indicators. Mark what you have memorized and what needs revision.',
    },
    {
      icon: <TrendingUp className="w-12 h-12 text-amber-400" />,
      title: 'Quiz Mode',
      description:
        'Test your memorization with self-assessment tools. Use hints and track weak areas.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="relative max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Quran Memorizer
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
            Your companion for Hifz journey
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
            A modern web application to help you memorize the Holy Quran with
            interactive tools including text display, audio recitation, progress tracking,
            and self-testing features.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth/register"
              className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50"
            >
              Get Started
            </Link>
            <Link
              to="/auth/login"
              className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
