import { useEffect, useState, ReactNode } from 'react'
import { ThemeContext } from './theme-context-defs'

export { ThemeContext } from './theme-context-defs'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    // During SSR, just return default
    if (typeof window === 'undefined') {
      return 'dark'
    }

    // Check localStorage first (only runs on client)
    const stored = localStorage.getItem('theme') as 'dark' | 'light' | null
    if (stored) return stored

    // Check system preference
    if (window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    }

    return 'dark' // Default to dark theme
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
