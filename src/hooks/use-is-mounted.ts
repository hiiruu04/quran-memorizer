import { useLayoutEffect, useState } from 'react'

/**
 * Custom hook to detect when a component has mounted on the client.
 * This is useful for SSR hydration to avoid hydration mismatches.
 * Returns false during SSR and initial render, true after mount.
 *
 * Note: setState in useLayoutEffect is necessary here for SSR hydration.
 * This is a one-time mount signal, not a reactive state update.
 */
export function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false)

  useLayoutEffect(() => {
    // One-time signal that component has mounted on client
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true)
  }, [])

  return isMounted
}
