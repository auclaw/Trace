import { useState, useEffect, useRef, useCallback } from 'react'

interface UseInfiniteScrollOptions<T> {
  loadMore: (direction: 'up' | 'down') => Promise<T> | void
  threshold?: number
}

interface UseInfiniteScrollResult {
  containerRef: React.RefObject<HTMLDivElement>
  isLoading: boolean
  scrollTo: (position: number, behavior?: ScrollBehavior) => void
}

export function useInfiniteScroll<T>({
  loadMore,
  threshold = 200,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const isProcessing = useRef(false)

  const handleScroll = useCallback(async () => {
    if (!containerRef.current || isProcessing.current) return

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current

    // Load previous content (scroll up near top)
    if (scrollTop < threshold) {
      isProcessing.current = true
      setIsLoading(true)
      const prevHeight = scrollHeight
      await loadMore('up')

      // Maintain scroll position after adding content above
      requestAnimationFrame(() => {
        if (containerRef.current) {
          const newHeight = containerRef.current.scrollHeight
          containerRef.current.scrollTop += newHeight - prevHeight
        }
        setIsLoading(false)
        isProcessing.current = false
      })
    }

    // Load next content (scroll down near bottom)
    if (scrollTop + clientHeight > scrollHeight - threshold) {
      isProcessing.current = true
      setIsLoading(true)
      await loadMore('down')
      setIsLoading(false)
      isProcessing.current = false
    }
  }, [loadMore, threshold])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const scrollTo = useCallback((position: number, behavior: ScrollBehavior = 'smooth') => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: position, behavior })
    }
  }, [])

  return { containerRef, isLoading, scrollTo }
}
