import React, { useEffect, useState, useCallback, useRef } from 'react'
import ChatsContext from '../contexts/ChatsContext'
import useAuthedRequest from '../hooks/useAuthedRequest'
import { useUser } from '../hooks/useUser'
import useWebSocket from '../hooks/useWebSocket'
import { Alert, Platform } from 'react-native'

const API_URL = 'http://localhost:5000'

const ChatsProvider = ({ children }) => {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [messages, setMessages] = useState({})
  const [calls, setCalls] = useState({})
  const [incomingCall, setIncomingCall] = useState(null)
  const [callNotification, setCallNotification] = useState(null)
  const [typingUsers, setTypingUsers] = useState({})
  const [userStatuses, setUserStatuses] = useState({})
  const [lastSeen, setLastSeen] = useState({})

  const { isReady, get, put, post, del } = useAuthedRequest()
  const { user } = useUser()
  const typingTimeoutRef = useRef({})
  const handleWebSocketMessage = useCallback(
    (data) => {
      console.log('📨 [ChatsProvider] WebSocket message:', data.type, {
        from: data.from,
        to: data.to,
        userId: data.userId,
      })

      switch (data.type) {
        case 'call_accepted':
          console.log('📞 [ChatsProvider] Call accepted notification:', {
            from: data.from,
            callId: data.callId,
          })
          // Don't do anything here - CallScreen handles it
          break

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

        case 'user-last-seen':
          handleLastSeenUpdate(data)
          break

        case 'new-message':
          handleNewMessage(data)
          break

        case 'message-updated':
          handleMessageUpdated(data)
          break

        case 'message-deleted':
          handleMessageDeleted(data)
          break

        case 'message-delivered':
          handleMessageDelivered(data)
          break

        case 'message-read':
          handleMessageRead(data)
          break

        case 'typing':
          handleTypingIndicator(data)
          break

        case 'typing-stopped':
          handleTypingStopped(data)
          break

        case 'user-online':
          handleUserOnline(data)
          break

        case 'user-offline':
          handleUserOffline(data)
          break

        case 'user-status-updated':
          handleUserStatusUpdate(data)
          break

        case 'ping':
          // Handled automatically by useWebSocket
          break

        case 'pong':
          // Handled automatically by useWebSocket
          break

        case 'error':
          console.error('❌ Server error:', data.message)
          break

        default:
          console.log('⚠️ Unknown WebSocket message type:', data.type)
      }
    },
    [user?.uid]
  )

  // Initialize WebSocket with the custom hook
  const {
    isConnected: wsConnected,
    connectionState,
    send: wsSend,
    reconnect: wsReconnect,
  } = useWebSocket({
    userId: user?.uid,
    endpoint: '/notifications',
    onMessage: handleWebSocketMessage,
    enabled: !!user?.uid && isReady,
  })

  // Message handlers
  const handleIncomingCall = useCallback((callData) => {
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

    setTimeout(() => {
      setIncomingCall((current) => {
        if (current?.callId === callData.callId) {
          setCallNotification(null)
          rejectCall(callData.callId)
          return null
        }
        return current
      })
    }, 40000)
  }, [])

  const handleCallEnded = useCallback((data) => {
    console.log('📞 Call ended notification:', data)
    setIncomingCall(null)
    setCallNotification(null)
    Alert.alert('Call Ended', `Call ended after ${data.duration || 0} seconds`)
  }, [])

  const handleNewMessage = useCallback(
    (messageData) => {
      const { chatId, message, senderId } = messageData

      if (senderId === user?.uid) {
        console.log('⏭️ Skipping own message (already in state)')
        return
      }

      setMessages((prevMessages) => {
        const existingMessages = prevMessages[chatId] || []
        const messageId = message._id || message.id
        const isDuplicate = existingMessages.some(
          (msg) => (msg._id || msg.id) === messageId
        )

        if (isDuplicate) {
          console.log('⚠️ Duplicate message detected, skipping')
          return prevMessages
        }

        return {
          ...prevMessages,
          [chatId]: [...existingMessages, message],
        }
      })

      setChats((prevChats) =>
        prevChats.map((chat) =>
          (chat._id || chat.id) === chatId
            ? {
                ...chat,
                lastMessage: message.content || 'Sent an attachment',
                lastActivity: message.createdAt,
              }
            : chat
        )
      )

      setTypingUsers((prev) => {
        const chatTyping = prev[chatId] || []
        return {
          ...prev,
          [chatId]: chatTyping.filter((uid) => uid !== senderId),
        }
      })
    },
    [user?.uid]
  )

  const handleMessageUpdated = useCallback((data) => {
    const { chatId, messageId, message } = data

    if (!chatId || !messageId || !message) {
      console.error('❌ Missing required fields for message update')
      return
    }

    setMessages((prevMessages) => {
      const chatMessages = prevMessages[chatId] || []
      const updatedMessages = chatMessages.map((msg) => {
        const msgId = msg._id || msg.id
        if (msgId === messageId || msgId === message._id) {
          return {
            ...msg,
            content: message.content,
            updatedAt: message.updatedAt || new Date(),
          }
        }
        return msg
      })

      // ✅ FIX: Update chat list if this was the last message
      const lastMsg = updatedMessages[updatedMessages.length - 1]
      if (lastMsg && (lastMsg._id || lastMsg.id) === messageId) {
        setChats((prevChats) =>
          prevChats.map((chat) =>
            (chat._id || chat.id) === chatId
              ? {
                  ...chat,
                  lastMessage:
                    message.content?.substring(0, 50) || 'Sent an attachment',
                  lastActivity: message.updatedAt || lastMsg.createdAt,
                }
              : chat
          )
        )
      }

      return {
        ...prevMessages,
        [chatId]: updatedMessages,
      }
    })
  }, [])

  const handleMessageDeleted = useCallback((data) => {
    const { chatId, messageId } = data

    setMessages((prev) => {
      const updated = { ...prev }
      if (updated[chatId]) {
        updated[chatId] = updated[chatId].filter(
          (msg) => (msg._id || msg.id) !== messageId
        )

        // ✅ FIX: Update chats immediately with filtered messages
        setChats((prevChats) =>
          prevChats.map((chat) => {
            if ((chat._id || chat.id) !== chatId) return chat

            const remainingMessages = updated[chatId]

            if (remainingMessages.length > 0) {
              const last = remainingMessages[remainingMessages.length - 1]
              return {
                ...chat,
                lastMessage:
                  last.content?.substring(0, 50) || 'Sent an attachment',
                lastActivity: last.createdAt,
              }
            }

            // ✅ FIX: Empty string instead of "No conversation"
            return {
              ...chat,
              lastMessage: '',
              lastActivity: chat.lastActivity || new Date(),
            }
          })
        )
      }
      return updated
    })
  }, [])

  const handleMessageDelivered = useCallback((data) => {
    const { chatId, messageId } = data
    setMessages((prev) => ({
      ...prev,
      [chatId]: (prev[chatId] || []).map((msg) =>
        (msg._id || msg.id) === messageId
          ? { ...msg, delivered: true, deliveredAt: data.timestamp }
          : msg
      ),
    }))
  }, [])

  const handleMessageRead = useCallback((data) => {
    const { chatId, messageId } = data
    setMessages((prev) => ({
      ...prev,
      [chatId]: (prev[chatId] || []).map((msg) =>
        (msg._id || msg.id) === messageId
          ? { ...msg, read: true, readAt: data.timestamp }
          : msg
      ),
    }))
  }, [])

  const handleLastSeenUpdate = useCallback((data) => {
    setLastSeen((prev) => ({
      ...prev,
      [data.userId]: data.timestamp,
    }))
  }, [])

  const handleTypingIndicator = useCallback((data) => {
    const { userId, chatId, isTyping } = data

    if (isTyping) {
      setTypingUsers((prev) => {
        const chatTyping = prev[chatId] || []
        if (!chatTyping.includes(userId)) {
          return { ...prev, [chatId]: [...chatTyping, userId] }
        }
        return prev
      })
    } else {
      setTypingUsers((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] || []).filter((uid) => uid !== userId),
      }))
    }
  }, [])

  const handleTypingStopped = useCallback((data) => {
    const { userId, chatId } = data
    setTypingUsers((prev) => ({
      ...prev,
      [chatId]: (prev[chatId] || []).filter((uid) => uid !== userId),
    }))
  }, [])

  const handleUserOnline = useCallback((data) => {
    setOnlineUsers((prev) => new Set([...prev, data.userId]))
    setUsers((prev) =>
      prev.map((u) =>
        u.firebaseUid === data.userId || u._id === data.userId
          ? { ...u, online: true }
          : u
      )
    )
  }, [])

  const handleUserOffline = useCallback((data) => {
    setOnlineUsers((prev) => {
      const updated = new Set(prev)
      updated.delete(data.userId)
      return updated
    })
    setUsers((prev) =>
      prev.map((u) =>
        u.firebaseUid === data.userId || u._id === data.userId
          ? { ...u, online: false }
          : u
      )
    )
  }, [])

  const handleUserStatusUpdate = useCallback((data) => {
    setUserStatuses((prev) => ({
      ...prev,
      [data.userId]: {
        status: data.status,
        customMessage: data.customMessage,
        timestamp: data.timestamp,
      },
    }))
  }, [])

  // API Methods
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

  const loadUsers = useCallback(async () => {
    if (!isReady) return
    try {
      const data = await get(`${API_URL}/list-users`)
      setUsers(data)

      const lastSeenData = {}
      data.forEach((user) => {
        if (user.lastSeen) {
          lastSeenData[user.firebaseUid || user._id] = user.lastSeen
        }
      })
      setLastSeen(lastSeenData)
    } catch (error) {
      console.error('Failed to load users:', error)
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

          const chat = chats.find((c) => (c._id || c.id) === chatId)
          if (chat) {
            wsSend({
              type: 'new-message',
              chatId,
              message: data.message,
              participants: chat.participants || [],
            })
          }

          sendTypingIndicator(chatId, false)
          await updateLastSeen(chatId)
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
    [isReady, post, user, chats, wsSend]
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

  const deleteMessage = useCallback(
    async (messageId, chatId) => {
      if (!isReady || !user?.uid) {
        return { success: false, error: 'Auth not ready' }
      }

      try {
        const response = await del(`${API_URL}/delete-message/${messageId}`)

        if (response.success) {
          // ✅ FIX: Update states correctly
          setMessages((prev) => {
            const updated = {
              ...prev,
              [chatId]: (prev[chatId] || []).filter(
                (msg) => (msg._id || msg.id) !== messageId
              ),
            }

            // Update chats with new filtered messages
            setChats((prevChats) =>
              prevChats.map((chat) => {
                if ((chat._id || chat.id) !== chatId) return chat

                const remaining = updated[chatId] || []

                if (remaining.length > 0) {
                  const last = remaining[remaining.length - 1]
                  return {
                    ...chat,
                    lastMessage:
                      last.content?.substring(0, 50) || 'Sent an attachment',
                    lastActivity: last.createdAt,
                  }
                }

                return {
                  ...chat,
                  lastMessage: '',
                  lastActivity: chat.lastActivity || new Date(),
                }
              })
            )

            return updated
          })
        }

        return response
      } catch (error) {
        console.error('deleteMessage error:', error)
        return { success: false, error: error.message || 'Failed to delete' }
      }
    },
    [isReady, del, user?.uid]
  )

  const updateLastSeen = useCallback(
    async (chatId) => {
      if (!isReady || !user?.uid) return

      try {
        await post(`${API_URL}/update-last-seen/${chatId}`)

        const chat = chats.find((c) => (c._id || c.id) === chatId)
        if (chat) {
          wsSend({
            type: 'update-last-seen',
            chatId,
            participants: chat.participants || [],
          })
        }
      } catch (error) {
        console.error('Failed to update last seen:', error)
      }
    },
    [isReady, post, user?.uid, chats, wsSend]
  )

  const sendTypingIndicator = useCallback(
    (chatId, isTyping) => {
      const chat = chats.find((c) => (c._id || c.id) === chatId)
      if (!chat) return

      wsSend({
        type: isTyping ? 'typing-start' : 'typing-stop',
        chatId,
        participants: chat.participants,
      })

      if (isTyping) {
        if (typingTimeoutRef.current[chatId]) {
          clearTimeout(typingTimeoutRef.current[chatId])
        }

        typingTimeoutRef.current[chatId] = setTimeout(() => {
          sendTypingIndicator(chatId, false)
        }, 5000)
      }
    },
    [chats, wsSend]
  )

  const updateUserStatus = useCallback(
    (status, customMessage = '') => {
      wsSend({
        type: 'update-status',
        status,
        customMessage,
      })
    },
    [wsSend]
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

  // Utility functions
  const getMessagesForChat = useCallback(
    (chatId) => messages[chatId] || [],
    [messages]
  )

  const getTypingUsersForChat = useCallback(
    (chatId) => {
      const typingUserIds = typingUsers[chatId] || []
      return typingUserIds
        .map((userId) => {
          return users.find(
            (u) =>
              u.firebaseUid === userId ||
              (u._id && u._id.toString()) === userId ||
              (u.id && u.id.toString()) === userId
          )
        })
        .filter(Boolean)
    },
    [typingUsers, users]
  )

  const getUserStatus = useCallback(
    (userId) => {
      return userStatuses[userId] || { status: 'offline', customMessage: '' }
    },
    [userStatuses]
  )

  const getLastSeen = useCallback(
    (userId) => {
      return lastSeen[userId] || null
    },
    [lastSeen]
  )

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

  const dismissCallNotification = useCallback(() => {
    setCallNotification(null)
  }, [])

  // Load initial data
  useEffect(() => {
    if (isReady) {
      loadChats()
      loadUsers()
    }
  }, [isReady, loadChats, loadUsers])

  // Cleanup typing timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(typingTimeoutRef.current).forEach(clearTimeout)
    }
  }, [])

  const contextValue = {
    chats,
    loading,
    users,
    messages,
    calls,
    incomingCall,
    callNotification,
    wsSend,
    wsConnected,
    connectionState,
    typingUsers,
    onlineUsers,
    userStatuses,
    lastSeen,

    reloadChats: loadChats,
    loadUsers,
    createChat,
    deleteChat,

    loadMessages,
    sendMessage,
    updateMessage,
    deleteMessage,
    getMessagesForChat,

    updateLastSeen,
    getLastSeen,

    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    getCallHistory,
    dismissCallNotification,

    sendTypingIndicator,
    getTypingUsersForChat,

    updateUserStatus,
    getUserStatus,

    findUserById,
    getChatParticipants,
    getUnreadMessageCount,
    isUserOnline,

    wsReconnect, // New: expose manual reconnect function
  }

  return (
    <ChatsContext.Provider value={contextValue}>
      {children}
    </ChatsContext.Provider>
  )
}

export default ChatsProvider
