import { useEffect } from 'react'
import { Platform } from 'react-native'

export function useWebNavigation(onRouteChange) {
  useEffect(() => {
    if (Platform.OS !== 'web') return

    const handlePopState = (event) => {
      const path = window.location.pathname

      // Parse the path to extract route info
      const chatMatch = path.match(/\/chats\/(.+)/)
      const postMatch = path.match(/\/posts\/(.+)/)

      if (chatMatch) {
        onRouteChange('chat', chatMatch[1])
      } else if (postMatch) {
        onRouteChange('post', postMatch[1])
      } else if (path === '/chats') {
        onRouteChange('chat', null)
      } else if (path === '/posts') {
        onRouteChange('post', null)
      }
    }

    window.addEventListener('popstate', handlePopState)

    // Initial route parsing
    handlePopState()

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [onRouteChange])
}
