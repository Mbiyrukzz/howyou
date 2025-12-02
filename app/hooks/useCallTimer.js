import { useState, useRef, useEffect } from 'react'

export function useCallTimer(isConnected) {
  const [callDuration, setCallDuration] = useState(0)
  const callStartTime = useRef(null)
  const durationInterval = useRef(null)

  useEffect(() => {
    if (isConnected) {
      startCallTimer()
    }

    return () => {
      stopCallTimer()
    }
  }, [isConnected])

  const startCallTimer = () => {
    callStartTime.current = Date.now()
    durationInterval.current = setInterval(() => {
      if (callStartTime.current) {
        const elapsed = Math.floor((Date.now() - callStartTime.current) / 1000)
        setCallDuration(elapsed)
      }
    }, 1000)
  }

  const stopCallTimer = () => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current)
      durationInterval.current = null
    }
  }

  return { callDuration }
}
