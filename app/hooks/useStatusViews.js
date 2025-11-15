import { useState, useCallback } from 'react'
import useAuthedRequest from './useAuthedRequest'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'

export const useStatusViews = () => {
  const { isReady, get, post: postRequest } = useAuthedRequest()
  const [viewsData, setViewsData] = useState({}) // Map<statusId, views[]>
  const [loading, setLoading] = useState({}) // Map<statusId, boolean>

  // Mark status as viewed
  const markStatusViewed = useCallback(
    async (statusId) => {
      if (!isReady || !statusId) return

      try {
        console.log('👁️ Marking status viewed:', statusId)
        const response = await postRequest(
          `${API_URL}/status/${statusId}/view`,
          {}
        )

        if (response.success) {
          console.log('✅ Status viewed, count:', response.viewCount)
          return response
        }
      } catch (error) {
        console.error('❌ Failed to mark status viewed:', error)
      }
    },
    [isReady, postRequest]
  )

  // Get viewers for a status (only owner can see)
  const getStatusViewers = useCallback(
    async (statusId) => {
      if (!isReady || !statusId) return []

      setLoading((prev) => ({ ...prev, [statusId]: true }))

      try {
        console.log('📥 Fetching viewers for status:', statusId)
        const response = await get(`${API_URL}/status/${statusId}/views`)

        if (response.success) {
          setViewsData((prev) => ({
            ...prev,
            [statusId]: response.views || [],
          }))
          return response.views || []
        }

        return []
      } catch (error) {
        console.error('❌ Failed to fetch status viewers:', error)
        return []
      } finally {
        setLoading((prev) => ({ ...prev, [statusId]: false }))
      }
    },
    [isReady, get]
  )

  // Get views summary for all user's statuses
  const getMyStatusViewsSummary = useCallback(async () => {
    if (!isReady) return []

    try {
      console.log('📥 Fetching my status views summary')
      const response = await get(`${API_URL}/status/my/views-summary`)

      if (response.success) {
        console.log('✅ Got views summary:', response.statuses.length)
        return response.statuses || []
      }

      return []
    } catch (error) {
      console.error('❌ Failed to fetch views summary:', error)
      return []
    }
  }, [isReady, get])

  // Get views for specific status
  const getViewsForStatus = useCallback(
    (statusId) => {
      return viewsData[statusId] || []
    },
    [viewsData]
  )

  // Check if loading views for a status
  const isLoadingViews = useCallback(
    (statusId) => {
      return loading[statusId] || false
    },
    [loading]
  )

  return {
    markStatusViewed,
    getStatusViewers,
    getMyStatusViewsSummary,
    getViewsForStatus,
    isLoadingViews,
  }
}
