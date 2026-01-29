import { Link } from '@tanstack/react-router'
import { HeaderAuth } from './HeaderAuth'
import { signOut } from '@/lib/auth-client'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import { Moon, Sun } from 'lucide-react'

export default function Header() {
  const queryClient = useQueryClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const handleLogout = async () => {
    await signOut()
    // Invalidate the session query to trigger a refetch
    queryClient.invalidateQueries({ queryKey: ['auth-session'] })
    // Force navigation to home using window.location to bypass any redirects
    window.location.href = '/'
    setMobileMenuOpen(false)
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <header className="border-b border-slate-300 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
            <span className="text-2xl">📖</span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Quran Memorizer</h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/quran"
              className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              activeProps={{ className: "text-cyan-600 dark:text-cyan-400" }}
            >
              Quran
            </Link>
            <Link
              to="/dashboard"
              className="text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              activeProps={{ className: "text-cyan-600 dark:text-cyan-400" }}
            >
              Dashboard
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <HeaderAuth onLogout={handleLogout} />
          </nav>

          {/* Mobile Menu Button - hide container on desktop */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                // Close icon (X)
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // Hamburger icon
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-300 dark:border-slate-700 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-sm">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <Link
              to="/quran"
              className="block px-3 py-3 rounded-md text-base font-medium text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              activeProps={{ className: "text-cyan-600 dark:text-cyan-400 bg-slate-200 dark:bg-slate-700" }}
              onClick={closeMobileMenu}
            >
              Quran
            </Link>
            <Link
              to="/dashboard"
              className="block px-3 py-3 rounded-md text-base font-medium text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              activeProps={{ className: "text-cyan-600 dark:text-cyan-400 bg-slate-200 dark:bg-slate-700" }}
              onClick={closeMobileMenu}
            >
              Dashboard
            </Link>
            <div className="px-3 py-3 border-t border-slate-300 dark:border-slate-700 mt-2 pt-4">
              <HeaderAuth onLogout={handleLogout} />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
