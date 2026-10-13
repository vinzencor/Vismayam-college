import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Scrolls to the top on page change, or to the #anchor when one is present.
// Query-string changes (e.g. course filters) intentionally keep the scroll position.
export function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      // Wait a frame so the target section has rendered after navigation.
      const id = requestAnimationFrame(() => {
        document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
      return () => cancelAnimationFrame(id)
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])

  return null
}
