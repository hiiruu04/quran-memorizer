import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface User {
  id: string
  email: string
  name: string | null
  image: string | null
}

interface Session {
  user: User
}

interface HeaderAuthProps {
  onLogout: () => void
}

function HeaderAuthClient({ onLogout }: HeaderAuthProps) {
  const { data: session, isLoading } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async (): Promise<Session | null> => {
      try {
        const res = await fetch('/api/auth/get-session', {
          credentials: 'include',
        })
        if (!res.ok) return null
        const data = await res.json()
        return data?.user ? data : null
      } catch {
        return null
      }
    },
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always treat data as stale to ensure fresh state
  })

  if (isLoading) {
    return <div className="h-9 w-32 bg-slate-700 animate-pulse rounded"></div>
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400">
          {session.user.name || session.user.email}
        </span>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
        >
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <>
      <Link
        to="/auth/login"
        className="text-gray-300 hover:text-white transition-colors px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm"
      >
        Sign In
      </Link>
      <Link
        to="/auth/register"
        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors text-sm"
      >
        Get Started
      </Link>
    </>
  )
}

export function HeaderAuth(props: HeaderAuthProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // During SSR, show a skeleton placeholder
  if (!isMounted) {
    return <div className="h-9 w-32 bg-slate-700 animate-pulse rounded"></div>
  }

  // Only render the client component after mounting
  return <HeaderAuthClient {...props} />
}
