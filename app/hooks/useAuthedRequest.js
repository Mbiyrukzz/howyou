import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { useUser } from './useUser'

const useAuthedRequest = () => {
  const { user } = useUser()
  const [token, setToken] = useState(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    const createToken = async () => {
      try {
        if (!user) {
          if (isMounted) {
            setToken(null)
            setIsReady(false)
          }
          return
        }

        const idToken = await user.getIdToken()

        if (isMounted) {
          setToken(idToken)
          setIsReady(true)
        }
      } catch (error) {
        console.error('Error fetching token:', error)
        if (isMounted) {
          setIsReady(false)
        }
      }
    }

    createToken()

    return () => {
      isMounted = false
    }
  }, [user])

  // Generic function to handle authenticated requests
  const request = useCallback(
    async (method, url, body = null, isFormData = false) => {
      if (!token) throw new Error('No auth token available')

      const headers = { Authorization: `Bearer ${token}` }

      // Don't set Content-Type for FormData, let axios handle it
      if (!isFormData) {
        headers['Content-Type'] = 'application/json'
      }

      const response = await axios({
        method,
        url,
        data: body,
        headers,
        // Increase timeout for file uploads
        timeout: isFormData ? 30000 : 10000,
      })
      return response.data
    },
    [token]
  )

  // CRUD functions
  const get = useCallback((url) => request('get', url), [request])
  const post = useCallback(
    (url, body, isFormData = false) => request('post', url, body, isFormData),
    [request]
  )
  const put = useCallback((url, body) => request('put', url, body), [request])
  const del = useCallback(
    (url, body) => request('delete', url, body),
    [request]
  )

  return { isReady, get, post, put, del }
}

export default useAuthedRequest
