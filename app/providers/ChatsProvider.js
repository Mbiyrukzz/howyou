// ChatsProvider.js with debugging
import React, { useEffect, useState, useCallback } from 'react'
import ChatsContext from '../contexts/ChatsContext'
import useAuthedRequest from '../hooks/useAuthedRequest'
import { useUser } from '../hooks/useUser'

const API_URL = 'http://10.216.188.87:5000'

const ChatsProvider = ({ children }) => {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState({}) // Store messages by chatId

  const { isReady, get, post } = useAuthedRequest()
  const { user } = useUser()

  // Debug logging
  useEffect(() => {
    console.log('🔍 ChatsProvider Debug:', {
      user: user ? `${user.displayName || 'No name'} (${user.uid})` : 'No user',
      isReady,
      usersCount: users.length,
      chatsCount: chats.length,
    })
  }, [user, isReady, users.length, chats.length])

  const loadChats = useCallback(async () => {
    if (!isReady) {
      console.log('⏳ Auth not ready for loading chats')
      return
    }
    try {
      setLoading(true)
      console.log('🔄 Loading chats...')
      const data = await get(`${API_URL}/list-chats`)
      console.log('✅ Chats loaded:', data?.length || 0)
      setChats(data)
    } catch (error) {
      console.error('❌ Failed to load chats:', error)
    } finally {
      setLoading(false)
    }
  }, [user, get, isReady])

  const createChat = useCallback(
    async (participants, name) => {
      console.log('🔄 createChat called with:', { participants, name })
      console.log('🔍 Current state:', { isReady, user: user?.uid })

      if (!isReady) {
        console.log('❌ Auth not ready')
        return { success: false, error: 'Authentication not ready' }
      }

      if (!user?.uid) {
        console.log('❌ User not authenticated:', user)
        return { success: false, error: 'User not authenticated' }
      }

      try {
        console.log('🔄 Making API call to create chat...')
        console.log('📡 Request data:', { participants, name })

        const data = await post(`${API_URL}/create-chat`, {
          participants,
          name,
        })

        console.log('📥 API Response:', data)

        if (data.success) {
          console.log('✅ Chat created, updating local state')
          setChats((prev) => [...prev, data.chat])
        } else {
          console.log('❌ Chat creation failed:', data.error)
        }

        return data
      } catch (error) {
        console.error('❌ Exception in createChat:', error)
        return {
          success: false,
          error: error.message || 'Failed to create chat',
          originalError: error,
        }
      }
    },
    [isReady, post, user?.uid]
  )

  const loadUsers = useCallback(async () => {
    if (!isReady) {
      console.log('⏳ Auth not ready for loading users')
      return
    }
    try {
      console.log('🔄 Loading users...')
      const data = await get(`${API_URL}/list-users`)
      console.log('✅ Users loaded:', data?.length || 0)
      setUsers(data)
    } catch (error) {
      console.error('❌ Failed to load users:', error)
    }
  }, [get, isReady])

  const loadMessages = useCallback(
    async (chatId) => {
      if (!isReady || !chatId) return []
      try {
        console.log('🔄 Loading messages for chat:', chatId)
        const data = await get(`${API_URL}/get-messages/${chatId}`)
        const sortedMessages = (data || []).sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        )

        console.log('✅ Messages loaded:', sortedMessages.length)

        // Store messages for this chat
        setMessages((prev) => ({
          ...prev,
          [chatId]: sortedMessages,
        }))

        return sortedMessages
      } catch (error) {
        console.error('❌ Failed to load messages:', error)
        return []
      }
    },
    [get, isReady]
  )

  const sendMessage = useCallback(
    async (chatId, content) => {
      if (!isReady || !chatId || !content?.trim()) {
        return { success: false, error: 'Invalid parameters' }
      }

      try {
        console.log('🔄 Sending message:', { chatId, content: content.trim() })
        const data = await post(`${API_URL}/send-message`, {
          chatId,
          content: content.trim(),
        })

        console.log('📥 Send message response:', data)

        if (data.success && data.message) {
          // Add the new message to local state
          setMessages((prev) => ({
            ...prev,
            [chatId]: [...(prev[chatId] || []), data.message],
          }))
        }

        return data
      } catch (error) {
        console.error('❌ Failed to send message:', error)
        return { success: false, error }
      }
    },
    [isReady, post]
  )

  // Get messages for a specific chat
  const getMessagesForChat = useCallback(
    (chatId) => {
      return messages[chatId] || []
    },
    [messages]
  )

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
        messages,
        reloadChats: loadChats,
        loadUsers,
        createChat,
        loadMessages,
        sendMessage,
        getMessagesForChat,
      }}
    >
      {children}
    </ChatsContext.Provider>
  )
}

export default ChatsProvider
