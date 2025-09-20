import React, { useEffect, useState, useCallback } from 'react'
import ChatsContext from '../contexts/ChatsContext'
import useAuthedRequest from '../hooks/useAuthedRequest'

const API_URL = 'http://10.216.188.87:5000'

const ChatsProvider = ({ children }) => {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)

  const { isReady, get, post } = useAuthedRequest()

  const loadChats = useCallback(async () => {
    if (!isReady) return
    try {
      setLoading(true)
      const data = await get(`${API_URL}/list-chats`)
      setChats(data)
    } catch (error) {
      console.error('❌ Failed to load chats:', error)
    } finally {
      setLoading(false)
    }
  }, [get, isReady])

  const createChat = useCallback(
    async (participants, name) => {
      if (!isReady) return { success: false, error: 'Auth not ready' }
      try {
        const data = await post(`${API_URL}/create-chat`, {
          participants,
          name,
        })
        if (data.success) {
          setChats((prev) => [...prev, data.chat])
        }
        return data
      } catch (error) {
        console.error('❌ Failed to create chat:', error)
        return { success: false, error }
      }
    },
    [isReady, post]
  )

  useEffect(() => {
    loadChats()
  }, [loadChats])

  return (
    <ChatsContext.Provider
      value={{ chats, loading, reloadChats: loadChats, createChat }}
    >
      {children}
    </ChatsContext.Provider>
  )
}

export default ChatsProvider
