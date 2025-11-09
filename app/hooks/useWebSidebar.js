// hooks/useWebSidebar.js
import { Platform, Dimensions } from 'react-native'

/**
 * Hook to detect if we're in web sidebar mode
 * Returns true if:
 * - Platform is web
 * - Screen width is >= 768px
 */
export function useWebSidebar() {
  // Direct calculation on first render (no delay)
  const { width } = Dimensions.get('window')
  const isWebSidebar = Platform.OS === 'web' && width >= 768

  return isWebSidebar
}
