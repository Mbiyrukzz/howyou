import React, { useEffect, useState, useCallback } from 'react'
import ChatsContext from '../contexts/ChatsContext'

const API_URL = 'http://localhost:5000'

const ChatsProvider = ({ children }) => {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)

  const loadChats = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/list-chats`)
      const data = await response.json()
      setChats(data)
    } catch (error) {
      console.error('❌ Failed to load chats:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadChats()
  }, [loadChats])

  return (
    <ChatsContext.Provider value={{ chats, loading, reloadChats: loadChats }}>
      {children}
    </ChatsContext.Provider>
  )
}

export default ChatsProvider
