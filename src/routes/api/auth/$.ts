import { createFileRoute } from '@tanstack/react-router'
import { auth } from '@/lib/auth'

// Catch-all route for Better Auth endpoints
export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return auth.handler(request)
      },
      POST: async ({ request }) => {
        return auth.handler(request)
      },
    },
  },
})
