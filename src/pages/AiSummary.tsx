import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * AiSummary has been merged into the unified Statistics page.
 * This component redirects to /statistics with the ai tab.
 */
export default function AiSummary() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/statistics?tab=ai', { replace: true })
  }, [navigate])

  return null
}
