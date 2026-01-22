import { Link, useNavigate } from '@tanstack/react-router'
import { HeaderAuth } from './HeaderAuth'
import { signOut } from '@/lib/auth-client'
import { useQueryClient } from '@tanstack/react-query'

export default function Header() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleLogout = async () => {
    await signOut()
    // Invalidate the session query to trigger a refetch
    queryClient.invalidateQueries({ queryKey: ['auth-session'] })
    // Force navigation to home using window.location to bypass any redirects
    window.location.href = '/'
  }

  return (
    <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">📖</span>
            <h1 className="text-xl font-bold text-white">Quran Memorizer</h1>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className="text-gray-300 hover:text-white transition-colors"
              activeProps={{ className: "text-cyan-400" }}
            >
              Home
            </Link>
            <HeaderAuth onLogout={handleLogout} />
          </nav>
        </div>
      </div>
    </header>
  )
}
