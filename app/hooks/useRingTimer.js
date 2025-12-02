import { useEffect, useRef } from 'react'

const RING_TIMEOUT = 40000

export function useRingTimer(onTimeout, shouldStart) {
  const ringTimerRef = useRef(null)

  useEffect(() => {
    if (shouldStart) {
      startRingTimer()
    }

    return () => {
      clearRingTimer()
    }
  }, [shouldStart])

  const startRingTimer = () => {
    ringTimerRef.current = setTimeout(() => {
      console.log('⏰ Ring timeout - call not answered')
      onTimeout()
    }, RING_TIMEOUT)
  }

  const clearRingTimer = () => {
    if (ringTimerRef.current) {
      clearTimeout(ringTimerRef.current)
      ringTimerRef.current = null
    }
  }

  return { clearRingTimer }
}
