import React, { useEffect, useState, useCallback, useRef } from 'react'
import ChatsContext from '../contexts/ChatsContext'
import useAuthedRequest from '../hooks/useAuthedRequest'
import { useUser } from '../hooks/useUser'
import { Alert, Platform } from 'react-native'

const API_URL = 'http://localhost:5000'
const WS_URL = 'ws://localhost:5000'

const ChatsProvider = ({ children }) => {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [messages, setMessages] = useState({})
  const [calls, setCalls] = useState({})
  const [incomingCall, setIncomingCall] = useState(null)
  const [callNotification, setCallNotification] = useState(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState({}) // { chatId: [userId1, userId2] }
  const [userStatuses, setUserStatuses] = useState({}) // { userId: { status, customMessage } }

  const { isReady, get, put, post, del } = useAuthedRequest()
  const { user } = useUser()
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const typingTimeoutRef = useRef({})
  const maxReconnectAttempts = 5

  // WebSocket connection
  useEffect(() => {
    if (user?.uid && isReady) {
      initializeWebSocket()
    }
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
      // Clear all typing timeouts
      Object.values(typingTimeoutRef.current).forEach(clearTimeout)
    }
  }, [user?.uid, isReady])

  const initializeWebSocket = () => {
    try {
      if (wsRef.current) {
        wsRef.current.close()
      }

      const wsUrl = `${WS_URL}/notifications?userId=${user.uid}`
      console.log('🔌 Connecting to WebSocket:', wsUrl)

      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected successfully')
        setWsConnected(true)
        reconnectAttemptsRef.current = 0
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
        setWsConnected(false)
      }

      wsRef.current.onclose = (event) => {
        console.log('❌ WebSocket disconnected:', {
          code: event.code,
          reason: event.reason,
          clean: event.wasClean,
        })
        setWsConnected(false)

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            30000
          )
          console.log(
            `⏳ Reconnecting in ${delay}ms (attempt ${
              reconnectAttemptsRef.current + 1
            }/${maxReconnectAttempts})`
          )

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            if (user?.uid && isReady) {
              initializeWebSocket()
            }
          }, delay)
        } else {
          console.error('❌ Max reconnection attempts reached')
          Alert.alert(
            'Connection Lost',
            'Unable to connect to server. Please check your internet connection and restart the app.',
            [{ text: 'OK' }]
          )
        }
      }
    } catch (error) {
      console.error('❌ WebSocket initialization error:', error)
      setWsConnected(false)
    }
  }

  const handleWebSocketMessage = (data) => {
    console.log('📨 WebSocket message received:', data.type)

    switch (data.type) {
      case 'connected':
        console.log('✅ WebSocket connection confirmed')
        if (data.onlineUsers) {
          setOnlineUsers(new Set(data.onlineUsers))
        }
        break

      // ===== CALL EVENTS =====
      case 'incoming_call':
        handleIncomingCall(data)
        break

      case 'call_ended':
        handleCallEnded(data)
        break

      case 'call_accepted':
        console.log('📞 Call accepted by recipient')
        break

      case 'call_rejected':
        console.log('📞 Call rejected by recipient')
        setIncomingCall(null)
        setCallNotification(null)
        Alert.alert(
          'Call Declined',
          `${data.recipientName || 'The other person'} declined your call`
        )
        break

      // ===== MESSAGE EVENTS =====
      case 'new_message':
        handleNewMessage(data)
        break

      case 'message-delivered':
        handleMessageDelivered(data)
        break

      case 'message-read':
        handleMessageRead(data)
        break

      // ===== TYPING EVENTS =====
      case 'typing':
        handleTypingIndicator(data)
        break

      case 'typing-stopped':
        handleTypingStopped(data)
        break

      // ===== PRESENCE EVENTS =====
      case 'user-online':
        handleUserOnline(data)
        break

      case 'user-offline':
        handleUserOffline(data)
        break

      case 'user-status-updated':
        handleUserStatusUpdate(data)
        break

      // ===== KEEP-ALIVE =====
      case 'ping':
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'pong' }))
        }
        break

      case 'pong':
        break

      case 'error':
        console.error('❌ Server error:', data.message)
        break

      default:
        console.log('⚠️ Unknown WebSocket message type:', data.type)
    }
  }

  // ===== CALL HANDLERS =====
  const handleIncomingCall = (callData) => {
    console.log('📞 Incoming call notification:', callData)

    setIncomingCall(callData)
    setCallNotification({
      type: 'incoming_call',
      caller: callData.caller,
      callerName: callData.callerName,
      callType: callData.callType,
      callId: callData.callId,
      chatId: callData.chatId,
    })

    // Auto-dismiss after 40 seconds
    setTimeout(() => {
      if (incomingCall?.callId === callData.callId) {
        setCallNotification(null)
        setIncomingCall(null)
        rejectCall(callData.callId)
      }
    }, 40000)
  }

  const handleCallEnded = (data) => {
    console.log('📞 Call ended notification:', data)
    setIncomingCall(null)
    setCallNotification(null)

    Alert.alert('Call Ended', `Call ended after ${data.duration || 0} seconds`)
  }

  // ===== MESSAGE HANDLERS =====
  const handleNewMessage = (messageData) => {
    console.log('💬 New message received:', messageData)
    const { chatId, message } = messageData

    setMessages((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), message],
    }))

    // Update chat's last message
    setChats((prev) =>
      prev.map((chat) =>
        (chat._id || chat.id) === chatId
          ? {
              ...chat,
              lastMessage: message.content || 'Sent an attachment',
              lastActivity: message.createdAt,
            }
          : chat
      )
    )

    // Clear typing indicator for sender
    setTypingUsers((prev) => {
      const chatTyping = prev[chatId] || []
      return {
        ...prev,
        [chatId]: chatTyping.filter((uid) => uid !== messageData.senderId),
      }
    })
  }

  const handleMessageDelivered = (data) => {
    console.log('✓ Message delivered:', data.messageId)
    const { chatId, messageId } = data

    setMessages((prev) => ({
      ...prev,
      [chatId]: (prev[chatId] || []).map((msg) =>
        (msg._id || msg.id) === messageId
          ? { ...msg, delivered: true, deliveredAt: data.timestamp }
          : msg
      ),
    }))
  }

  const handleMessageRead = (data) => {
    console.log('✓✓ Message read:', data.messageId)
    const { chatId, messageId } = data

    setMessages((prev) => ({
      ...prev,
      [chatId]: (prev[chatId] || []).map((msg) =>
        (msg._id || msg.id) === messageId
          ? { ...msg, read: true, readAt: data.timestamp }
          : msg
      ),
    }))
  }

  // ===== TYPING HANDLERS =====
  const handleTypingIndicator = (data) => {
    const { userId, chatId, isTyping } = data

    if (isTyping) {
      console.log(`⌨️ User ${userId} is typing in chat ${chatId}`)
      setTypingUsers((prev) => {
        const chatTyping = prev[chatId] || []
        if (!chatTyping.includes(userId)) {
          return { ...prev, [chatId]: [...chatTyping, userId] }
        }
        return prev
      })
    } else {
      console.log(`⌨️ User ${userId} stopped typing in chat ${chatId}`)
      setTypingUsers((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] || []).filter((uid) => uid !== userId),
      }))
    }
  }

  const handleTypingStopped = (data) => {
    const { userId, chatId } = data
    setTypingUsers((prev) => ({
      ...prev,
      [chatId]: (prev[chatId] || []).filter((uid) => uid !== userId),
    }))
  }

  // ===== PRESENCE HANDLERS =====
  const handleUserOnline = (data) => {
    console.log(`🟢 User ${data.userId} is online`)
    setOnlineUsers((prev) => new Set([...prev, data.userId]))

    // Update user list
    setUsers((prev) =>
      prev.map((u) =>
        u.firebaseUid === data.userId || u._id === data.userId
          ? { ...u, online: true }
          : u
      )
    )
  }

  const handleUserOffline = (data) => {
    console.log(`🔴 User ${data.userId} is offline`)
    setOnlineUsers((prev) => {
      const updated = new Set(prev)
      updated.delete(data.userId)
      return updated
    })

    // Update user list
    setUsers((prev) =>
      prev.map((u) =>
        u.firebaseUid === data.userId || u._id === data.userId
          ? { ...u, online: false }
          : u
      )
    )
  }

  const handleUserStatusUpdate = (data) => {
    console.log(`📍 User ${data.userId} status updated:`, data.status)
    setUserStatuses((prev) => ({
      ...prev,
      [data.userId]: {
        status: data.status,
        customMessage: data.customMessage,
        timestamp: data.timestamp,
      },
    }))
  }

  // ===== TYPING FUNCTIONS =====
  const sendTypingIndicator = useCallback(
    (chatId, isTyping) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        return
      }

      const chat = chats.find((c) => (c._id || c.id) === chatId)
      if (!chat) return

      const message = {
        type: isTyping ? 'typing-start' : 'typing-stop',
        chatId,
        participants: chat.participants,
      }

      wsRef.current.send(JSON.stringify(message))

      // Auto-stop typing after 5 seconds
      if (isTyping) {
        if (typingTimeoutRef.current[chatId]) {
          clearTimeout(typingTimeoutRef.current[chatId])
        }

        typingTimeoutRef.current[chatId] = setTimeout(() => {
          sendTypingIndicator(chatId, false)
        }, 5000)
      }
    },
    [chats]
  )

  const getTypingUsersForChat = useCallback(
    (chatId) => {
      const typingUserIds = typingUsers[chatId] || []
      return typingUserIds.map((userId) => findUserById(userId)).filter(Boolean)
    },
    [typingUsers, users]
  )

  // ===== STATUS FUNCTIONS =====
  const updateUserStatus = useCallback((status, customMessage = '') => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return
    }

    wsRef.current.send(
      JSON.stringify({
        type: 'update-status',
        status,
        customMessage,
      })
    )
  }, [])

  const getUserStatus = useCallback(
    (userId) => {
      return userStatuses[userId] || { status: 'offline', customMessage: '' }
    },
    [userStatuses]
  )

  // ===== EXISTING FUNCTIONS (CHAT, MESSAGES, CALLS) =====
  const loadChats = useCallback(async () => {
    if (!isReady) return
    try {
      setLoading(true)
      const data = await get(`${API_URL}/list-chats`)
      setChats(data)
    } catch (error) {
      console.error('Failed to load chats:', error)
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
        console.error('createChat error:', error)
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
      console.error('Failed to load users:', error)
    }
  }, [get, isReady])

  const deleteChat = useCallback(
    async (chatId) => {
      if (!isReady || !user?.uid) {
        return { success: false, error: 'Auth not ready' }
      }

      try {
        const data = await del(`${API_URL}/delete-chat/${chatId}`)

        if (data.success) {
          setChats((prev) => prev.filter((c) => (c._id || c.id) !== chatId))
          setMessages((prev) => {
            const updated = { ...prev }
            delete updated[chatId]
            return updated
          })
          setCalls((prev) => {
            const updated = { ...prev }
            delete updated[chatId]
            return updated
          })
        }

        return data
      } catch (error) {
        console.error('deleteChat error:', error)
        return {
          success: false,
          error: error.message || 'Failed to delete chat',
        }
      }
    },
    [isReady, del, user?.uid]
  )

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
        console.error('Failed to load messages:', error)
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

          const firstFileType = files[0].type || files[0].mimeType || ''
          let determinedType = messageType

          if (!messageType || messageType === 'text') {
            if (firstFileType.startsWith('image/')) {
              determinedType = 'image'
            } else if (firstFileType.startsWith('video/')) {
              determinedType = 'video'
            } else if (firstFileType.startsWith('audio/')) {
              determinedType = 'audio'
            } else {
              determinedType = 'file'
            }
          }

          formData.append('messageType', determinedType)

          if (content && content.trim()) {
            formData.append('content', content.trim())
          }

          for (let i = 0; i < files.length; i++) {
            const file = files[i]

            if (Platform.OS === 'web' && file.uri.startsWith('blob:')) {
              try {
                const response = await fetch(file.uri)
                const blob = await response.blob()
                const webFile = new File(
                  [blob],
                  file.name || `file_${Date.now()}_${i}.jpg`,
                  { type: file.type || file.mimeType || 'image/jpeg' }
                )
                formData.append('files', webFile)
              } catch (blobError) {
                console.error('Failed to convert blob:', blobError)
                throw new Error('Failed to process image file')
              }
            } else {
              const fileObject = {
                uri: file.uri,
                name: file.name || `file_${Date.now()}_${i}.jpg`,
                type: file.type || file.mimeType || 'image/jpeg',
              }
              formData.append('files', fileObject)
            }
          }

          const token = await user.getIdToken()

          const response = await fetch(`${API_URL}/send-message`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `HTTP ${response.status}`)
          }

          data = await response.json()
        } else {
          if (!content || !content.trim()) {
            return {
              success: false,
              error: 'Message must have content or files',
            }
          }

          data = await post(`${API_URL}/send-message`, {
            chatId,
            content: content.trim(),
            messageType: 'text',
          })
        }

        if (data.success && data.message) {
          setMessages((prev) => ({
            ...prev,
            [chatId]: [...(prev[chatId] || []), data.message],
          }))

          // Notify via WebSocket
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            const chat = chats.find((c) => (c._id || c.id) === chatId)
            wsRef.current.send(
              JSON.stringify({
                type: 'new-message',
                chatId,
                message: data.message,
                participants: chat?.participants || [],
              })
            )
          }

          // Stop typing indicator
          sendTypingIndicator(chatId, false)
        }

        return data
      } catch (error) {
        console.error('sendMessage error:', error)
        return {
          success: false,
          error: error.message || 'Failed to send message',
        }
      }
    },
    [isReady, post, user, chats, sendTypingIndicator]
  )

  const deleteMessage = useCallback(
    async (messageId, chatId) => {
      if (!isReady || !user?.uid) {
        return { success: false, error: 'Auth not ready' }
      }

      try {
        const data = await del(`${API_URL}/delete-message/${messageId}`)

        if (data.success) {
          setMessages((prev) => ({
            ...prev,
            [chatId]: (prev[chatId] || []).filter(
              (msg) => (msg._id || msg.id) !== messageId
            ),
          }))
        }

        return data
      } catch (error) {
        console.error('deleteMessage error:', error)
        return {
          success: false,
          error: error.message || 'Failed to delete message',
        }
      }
    },
    [isReady, del, user?.uid]
  )

  const updateMessage = useCallback(
    async (messageId, chatId, content) => {
      if (!isReady || !user?.uid) {
        return { success: false, error: 'Auth not ready' }
      }

      if (!content || !content.trim()) {
        return { success: false, error: 'Content cannot be empty' }
      }

      try {
        const data = await put(`${API_URL}/update-message/${messageId}`, {
          content: content.trim(),
        })

        if (data.success) {
          setMessages((prev) => ({
            ...prev,
            [chatId]: (prev[chatId] || []).map((msg) =>
              (msg._id || msg.id) === messageId
                ? { ...msg, content: content.trim(), updatedAt: new Date() }
                : msg
            ),
          }))
        }

        return data
      } catch (error) {
        console.error('updateMessage error:', error)
        return {
          success: false,
          error: error.message || 'Failed to update message',
        }
      }
    },
    [isReady, put, user?.uid]
  )

  const getMessagesForChat = useCallback(
    (chatId) => messages[chatId] || [],
    [messages]
  )

  const initiateCall = useCallback(
    async ({ chatId, callType, recipientId }) => {
      if (!isReady || !user?.uid) {
        return { success: false, error: 'Auth not ready' }
      }

      if (!wsConnected) {
        Alert.alert(
          'Connection Error',
          'Not connected to server. Please try again.'
        )
        return { success: false, error: 'WebSocket not connected' }
      }

      try {
        const data = await post(`${API_URL}/initiate-call`, {
          chatId,
          callType,
          recipientId,
        })

        return data
      } catch (error) {
        console.error('initiateCall error:', error)
        return {
          success: false,
          error: error.message || 'Failed to initiate call',
        }
      }
    },
    [isReady, post, user?.uid, wsConnected]
  )

  const answerCall = useCallback(
    async (callId, accepted) => {
      if (!isReady || !user?.uid) {
        return { success: false, error: 'Auth not ready' }
      }

      try {
        const data = await post(`${API_URL}/answer-call/${callId}`, {
          accepted,
        })

        if (accepted && data.success) {
          setIncomingCall(null)
          setCallNotification(null)
        }

        return data
      } catch (error) {
        console.error('answerCall error:', error)
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
        const data = await post(`${API_URL}/end-call/${callId}`)

        setIncomingCall(null)
        setCallNotification(null)

        return data
      } catch (error) {
        console.error('endCall error:', error)
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
        console.error('getCallHistory error:', error)
        return []
      }
    },
    [get, isReady]
  )

  const dismissCallNotification = useCallback(() => {
    setCallNotification(null)
  }, [])

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
      return chatMessages.filter(
        (msg) => !msg.read && msg.senderId !== user?.uid
      ).length
    },
    [messages, user?.uid]
  )

  const isUserOnline = useCallback(
    (userId) => {
      return onlineUsers.has(userId)
    },
    [onlineUsers]
  )

  useEffect(() => {
    if (isReady) {
      loadChats()
      loadUsers()
    }
  }, [isReady, loadChats, loadUsers])

  const contextValue = {
    // State
    chats,
    loading,
    users,
    messages,
    calls,
    incomingCall,
    callNotification,
    wsConnected,
    typingUsers,
    onlineUsers,
    userStatuses,

    // Chat functions
    reloadChats: loadChats,
    loadUsers,
    createChat,
    deleteChat,

    // Message functions
    loadMessages,
    sendMessage,
    updateMessage,
    deleteMessage,
    getMessagesForChat,

    // Call functions
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    getCallHistory,
    dismissCallNotification,

    // Typing functions
    sendTypingIndicator,
    getTypingUsersForChat,

    // Status functions
    updateUserStatus,
    getUserStatus,

    // Utility functions
    findUserById,
    getChatParticipants,
    getUnreadMessageCount,
    isUserOnline,
  }

  return (
    <ChatsContext.Provider value={contextValue}>
      {children}
    </ChatsContext.Provider>
  )
}

export default ChatsProvider
