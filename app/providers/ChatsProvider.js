// ChatsProvider.js
import React, { useEffect, useState, useCallback } from 'react'
import ChatsContext from '../contexts/ChatsContext'
import useAuthedRequest from '../hooks/useAuthedRequest'
import { useUser } from '../hooks/useUser'

const API_URL = 'http://10.216.188.87:5000'

const ChatsProvider = ({ children }) => {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([]) // 👈 all users except me

  const { isReady, get, post } = useAuthedRequest()

  const { user } = useUser()

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
  }, [user, get, isReady])

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

  // 👇 load all users (except me)
  const loadUsers = useCallback(async () => {
    if (!isReady) return
    try {
      const data = await get(`${API_URL}/list-users`)
      setUsers(data)
    } catch (error) {
      console.error('❌ Failed to load users:', error)
    }
  }, [get, isReady])

  useEffect(() => {
    loadChats()
    loadUsers()
  }, [loadChats, loadUsers])

  return (
    <ChatsContext.Provider
      value={{
        chats,
        loading,
        users,
        reloadChats: loadChats,
        loadUsers,
        createChat,
      }}
    >
      {children}
    </ChatsContext.Provider>
  )
}

export default ChatsProvider
