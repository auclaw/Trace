import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * DeepWorkStats has been merged into the unified Statistics page.
 * This component redirects to /statistics with the deepwork tab.
 */
export default function DeepWorkStats() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/statistics?tab=deepwork', { replace: true })
  }, [navigate])

  return null
}
