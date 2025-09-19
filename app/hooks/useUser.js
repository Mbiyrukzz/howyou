import { useEffect, useState } from 'react'
import { onAuthStateChanged, getAuth } from 'firebase/auth'

export const useUser = () => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    const auth = getAuth()
    const cancelSubscription = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setIsLoading(false)
    })
    return cancelSubscription
  }, [])

  return { user, isLoading }
}
