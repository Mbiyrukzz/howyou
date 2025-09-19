import { useEffect, useState, useCallback } from 'react'
import { useUser } from './useUser'
import axios from 'axios'

const useAuthedRequest = () => {
  const { user } = useUser()
  const [token, setToken] = useState(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    const createToken = async () => {
      try {
        if (!user) {
          setToken(null)
          setIsReady(false)
          return
        }

        const token = await user.getIdToken()

        if (isMounted) {
          setToken(token)
          setIsReady(true)
        }
      } catch (error) {
        console.error('❌ Error fetching token:', error)
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

      const headers = { authtoken: token }
      const response = await axios({ method, url, data: body, headers })
      return response.data
    },
    [token]
  )

  // CRUD functions using `request`
  const get = useCallback((url) => request('get', url), [request])
  const post = useCallback((url, body) => request('post', url, body), [request])
  const put = useCallback((url, body) => request('put', url, body), [request])
  const del = useCallback(
    (url, body) => request('delete', url, body),
    [request]
  )

  return { isReady, get, post, put, del }
}

export default useAuthedRequest
