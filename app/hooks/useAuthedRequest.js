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
    async (method, url, body = null) => {
      if (!token) throw new Error('No auth token available')

      const headers = { Authorization: `Bearer ${token}` }
      const response = await axios({ method, url, data: body, headers })
      return response.data
    },
    [token]
  )

  // Upload function for multipart/form-data
  const upload = useCallback(
    async (url, formData) => {
      if (!token) throw new Error('No auth token available')

      try {
        console.log('Uploading to:', url)

        // Use fetch instead of axios for better React Native FormData support
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type - let browser/RN set it with boundary
          },
          body: formData,
        })

        const data = await response.json()
        console.log('Upload response:', data)

        if (!response.ok) {
          throw new Error(data.error || 'Upload failed')
        }

        return data
      } catch (error) {
        console.error('Upload error:', error)
        throw error
      }
    },
    [token]
  )

  // CRUD functions
  const get = useCallback((url) => request('get', url), [request])
  const post = useCallback((url, body) => request('post', url, body), [request])
  const put = useCallback((url, body) => request('put', url, body), [request])
  const del = useCallback(
    (url, body) => request('delete', url, body),
    [request]
  )

  return { isReady, get, post, put, del, upload }
}

export default useAuthedRequest
