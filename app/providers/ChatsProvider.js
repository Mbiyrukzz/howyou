import React, { useEffect, useState, useCallback, useRef } from 'react'
import ChatsContext from '../contexts/ChatsContext'
import useAuthedRequest from '../hooks/useAuthedRequest'
import { useUser } from '../hooks/useUser'
import { Alert } from 'react-native'

const API_URL = 'http://10.143.145.87:5000'

const ChatsProvider = ({ children }) => {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState({})
  const [calls, setCalls] = useState({})
  const [incomingCall, setIncomingCall] = useState(null)
  const [callNotification, setCallNotification] = useState(null)
  const { isReady, get, post, upload } = useAuthedRequest()
  const { user } = useUser()
  const wsRef = useRef(null)

  // Debug logging
  useEffect(() => {
    console.log('🔍 ChatsProvider Debug:', {
      user: user ? `${user.displayName || 'No name'} (${user.uid})` : 'No user',
      isReady,
      usersCount: users.length,
      chatsCount: chats.length,
    })
  }, [user, isReady, users.length, chats.length])

  // WebSocket connection for real-time notifications
  useEffect(() => {
    if (user?.uid && isReady) {
      initializeWebSocket()
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [user?.uid, isReady])

  const initializeWebSocket = () => {
    try {
      const wsUrl = `ws://10.143.145.87:5000/notifications?userId=${user.uid}`
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log('📡 Notification WebSocket connected')
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleWebSocketMessage(data)
        } catch (error) {
          console.error('❌ WebSocket message parse error:', error)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
      }

      wsRef.current.onclose = () => {
        console.log('🔌 Notification WebSocket disconnected')
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (user?.uid && isReady) {
            initializeWebSocket()
          }
        }, 3000)
      }
    } catch (error) {
      console.error('❌ WebSocket initialization error:', error)
    }
  }

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'incoming_call':
        handleIncomingCall(data)
        break
      case 'call_ended':
        handleCallEnded(data)
        break
      case 'new_message':
        handleNewMessage(data)
        break
      case 'typing':
        handleTyping(data)
        break
      default:
        console.log('Unknown WebSocket message type:', data.type)
    }
  }

  const handleIncomingCall = (callData) => {
    console.log('📞 Incoming call:', callData)
    setIncomingCall(callData)
    setCallNotification({
      type: 'incoming_call',
      caller: callData.caller,
      callType: callData.callType,
      callId: callData.callId,
      chatId: callData.chatId,
    })

    // Auto-dismiss notification after 30 seconds
    setTimeout(() => {
      setCallNotification(null)
      setIncomingCall(null)
    }, 30000)
  }

  const handleCallEnded = (data) => {
    console.log('📱 Call ended:', data)
    setIncomingCall(null)
    setCallNotification(null)
  }

  const handleNewMessage = (messageData) => {
    console.log('💬 New message received:', messageData)
    const { chatId, message } = messageData
    setMessages((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), message],
    }))
  }

  const handleTyping = (typingData) => {
    console.log('⌨️ User typing:', typingData)
    // Handle typing indicators if needed
  }

  /** ──────────────── CHATS ──────────────── **/
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
      if (!isReady || !user?.uid) {
        return { success: false, error: 'Auth not ready' }
      }
      try {
        const data = await post(`${API_URL}/create-chat`, {
          participants,
          name,
        })
        if (data.success) setChats((prev) => [...prev, data.chat])
        return data
      } catch (error) {
        console.error('❌ createChat error:', error)
        return { success: false, error }
      }
    },
    [isReady, post, user?.uid]
  )

  const loadUsers = useCallback(async () => {
    if (!isReady) return
    try {
      const data = await get(`${API_URL}/list-users`)
      setUsers(data)
    } catch (error) {
      console.error('❌ Failed to load users:', error)
    }
  }, [get, isReady])

  /** ──────────────── MESSAGES ──────────────── **/
  const loadMessages = useCallback(
    async (chatId) => {
      if (!isReady || !chatId) return []
      try {
        const data = await get(`${API_URL}/get-messages/${chatId}`)
        const sorted = (data || []).sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        )
        setMessages((prev) => ({ ...prev, [chatId]: sorted }))
        return sorted
      } catch (error) {
        console.error('❌ Failed to load messages:', error)
        return []
      }
    },
    [get, isReady]
  )

  const sendMessage = useCallback(
    async ({ chatId, content, files = [], messageType = 'text' }) => {
      if (!isReady || !chatId) {
        return { success: false, error: 'Invalid parameters' }
      }

      try {
        let data
        if (files.length > 0) {
          const formData = new FormData()
          formData.append('chatId', chatId)
          formData.append('messageType', messageType || 'file')
          if (content) formData.append('content', content)

          files.forEach((file, index) => {
            formData.append('files', {
              uri: file.uri,
              name: file.name || `file_${index}`,
              type: file.type || 'application/octet-stream',
            })
          })

          data = await upload(`${API_URL}/send-message`, formData)
        } else {
          data = await post(`${API_URL}/send-message`, {
            chatId,
            content,
            messageType: 'text',
          })
        }

        if (data.success && data.message) {
          setMessages((prev) => ({
            ...prev,
            [chatId]: [...(prev[chatId] || []), data.message],
          }))
        }

        return data
      } catch (error) {
        console.error('❌ sendMessage error:', error)
        return { success: false, error }
      }
    },
    [isReady, post, upload]
  )

  const getMessagesForChat = useCallback(
    (chatId) => messages[chatId] || [],
    [messages]
  )

  /** ──────────────── CALLS ──────────────── **/
  const initiateCall = useCallback(
    async ({ chatId, callType, recipientId }) => {
      if (!isReady || !user?.uid) {
        return { success: false, error: 'Auth not ready' }
      }

      try {
        console.log('🔄 Initiating call:', { chatId, callType, recipientId })
        const data = await post(`${API_URL}/initiate-call`, {
          chatId,
          callType,
          recipientId,
        })

        console.log('📞 Call initiation result:', data)
        return data
      } catch (error) {
        console.error('❌ initiateCall error:', error)
        return {
          success: false,
          error: error.message || 'Failed to initiate call',
        }
      }
    },
    [isReady, post, user?.uid]
  )

  const answerCall = useCallback(
    async (callId, accepted) => {
      if (!isReady || !user?.uid) {
        return { success: false, error: 'Auth not ready' }
      }

      try {
        console.log('📱 Answering call:', { callId, accepted })
        const data = await post(`${API_URL}/answer-call/${callId}`, {
          accepted,
        })

        if (accepted && data.success) {
          // Clear call notification
          setIncomingCall(null)
          setCallNotification(null)
        }

        return data
      } catch (error) {
        console.error('❌ answerCall error:', error)
        return {
          success: false,
          error: error.message || 'Failed to answer call',
        }
      }
    },
    [isReady, post, user?.uid]
  )

  const rejectCall = useCallback(
    async (callId) => {
      const result = await answerCall(callId, false)
      setIncomingCall(null)
      setCallNotification(null)
      return result
    },
    [answerCall]
  )

  const endCall = useCallback(
    async (callId) => {
      if (!isReady || !user?.uid) {
        return { success: false, error: 'Auth not ready' }
      }

      try {
        console.log('🔴 Ending call:', callId)
        const data = await post(`${API_URL}/end-call/${callId}`)

        // Clear call states
        setIncomingCall(null)
        setCallNotification(null)

        return data
      } catch (error) {
        console.error('❌ endCall error:', error)
        return { success: false, error: error.message || 'Failed to end call' }
      }
    },
    [isReady, post, user?.uid]
  )

  const getCallHistory = useCallback(
    async (chatId) => {
      if (!isReady) return []
      try {
        const data = await get(`${API_URL}/call-history/${chatId}`)
        if (data.success) {
          setCalls((prev) => ({ ...prev, [chatId]: data.calls }))
          return data.calls
        }
        return []
      } catch (error) {
        console.error('❌ getCallHistory error:', error)
        return []
      }
    },
    [get, isReady]
  )

  const dismissCallNotification = useCallback(() => {
    setCallNotification(null)
  }, [])

  /** ──────────────── UTILITY FUNCTIONS ──────────────── **/
  const findUserById = useCallback(
    (userId) => {
      return users.find(
        (u) =>
          u.firebaseUid === userId ||
          (u._id && u._id.toString()) === userId ||
          (u.id && u.id.toString()) === userId
      )
    },
    [users]
  )

  const getChatParticipants = useCallback(
    (chatId) => {
      const chat = chats.find((c) => (c._id || c.id) === chatId)
      if (!chat) return []

      return chat.participants
        .map((participantId) => findUserById(participantId))
        .filter(Boolean)
    },
    [chats, findUserById]
  )

  const getUnreadMessageCount = useCallback(
    (chatId) => {
      const chatMessages = messages[chatId] || []
      // This would need to be implemented based on your read receipt system
      return chatMessages.filter(
        (msg) => !msg.read && msg.senderId !== user?.uid
      ).length
    },
    [messages, user?.uid]
  )

  /** ──────────────── INIT ──────────────── **/
  useEffect(() => {
    if (isReady) {
      loadChats()
      loadUsers()
    }
  }, [isReady, loadChats, loadUsers])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const contextValue = {
    // State
    chats,
    loading,
    users,
    messages,
    calls,
    incomingCall,
    callNotification,

    // Chat functions
    reloadChats: loadChats,
    loadUsers,
    createChat,

    // Message functions
    loadMessages,
    sendMessage,
    getMessagesForChat,

    // Call functions
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    getCallHistory,
    dismissCallNotification,

    // Utility functions
    findUserById,
    getChatParticipants,
    getUnreadMessageCount,
  }

  return (
    <ChatsContext.Provider value={contextValue}>
      {children}
    </ChatsContext.Provider>
  )
}

export default ChatsProvider
