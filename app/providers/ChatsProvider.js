import React, { useEffect, useState, useCallback, useRef } from 'react'
import ChatsContext from '../contexts/ChatsContext'
import useAuthedRequest from '../hooks/useAuthedRequest'
import { useUser } from '../hooks/useUser'
import useWebSocket from '../hooks/useWebSocket'
import { Alert, Platform } from 'react-native'

const API_URL = process.env.EXPO_PUBLIC_API_URL

const ChatsProvider = ({ children }) => {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [messages, setMessages] = useState({})
  const [calls, setCalls] = useState({})
  const [activeCall, setActiveCall] = useState(null)
  const [incomingCall, setIncomingCall] = useState(null)
  const [callNotification, setCallNotification] = useState(null)
  const [typingUsers, setTypingUsers] = useState({})
  const [userStatuses, setUserStatuses] = useState({})
  const [lastSeen, setLastSeen] = useState({})

  const { isReady, get, put, post, del } = useAuthedRequest()
  const { user } = useUser()
  const typingTimeoutRef = useRef({})
  const messageUpdateCounter = useRef(0)

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

        case 'new-chat':
          handleNewChat(data)
          break

        case 'chat-deleted':
          handleChatDeleted(data)
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
          handleMessagesRead(data)
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

      console.log('📨 handleNewMessage called:', {
        chatId,
        messageId: message._id || message.id,
        senderId,
        currentUserId: user?.uid,
        isOwnMessage: senderId === user?.uid,
      })

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

      // ✅ AUTO-MARK AS DELIVERED - Use setTimeout to break circular dependency
      if (user?.uid && senderId !== user.uid) {
        const messageId = message._id || message.id

        console.log('📬 Preparing to auto-mark as delivered:', {
          messageId,
          chatId,
          receivedBy: user.uid,
          alreadyDelivered: message.deliveredBy?.includes(user.uid),
        })

        // ✅ Use setTimeout with 0ms to defer execution and break circular dependency
        setTimeout(() => {
          console.log('📬 Calling markMessagesAsDelivered...')

          // ✅ Call the API directly instead of relying on the function reference
          if (!isReady || !user?.uid) return

          // Update local state
          setMessages((prev) => {
            const chatMessages = prev[chatId] || []
            const updatedMessages = chatMessages.map((msg) => {
              const msgId = msg._id || msg.id
              const msgSenderId = msg.senderId || msg.sender || msg.from

              if (msgId === messageId && msgSenderId !== user.uid) {
                const alreadyDelivered = msg.deliveredBy?.includes(user.uid)
                if (!alreadyDelivered) {
                  console.log('✅ Marking message as delivered:', msgId)
                  return {
                    ...msg,
                    status: 'delivered',
                    deliveredAt: new Date().toISOString(),
                    deliveredBy: Array.from(
                      new Set([...(msg.deliveredBy || []), user.uid])
                    ),
                    _updateCount: (msg._updateCount || 0) + 1,
                  }
                }
              }
              return msg
            })

            return {
              ...prev,
              [chatId]: updatedMessages,
            }
          })

          // Make API call
          post(`${API_URL}/mark-messages-delivered/${chatId}`, {
            messageIds: [messageId],
          })
            .then((result) => {
              console.log('✅ Auto-mark delivered result:', result)
            })
            .catch((err) => {
              console.error('❌ Failed to auto-mark as delivered:', err)
            })
        }, 0)
      } else {
        console.log('⏭️ Skipping auto-mark delivered:', {
          hasUser: !!user?.uid,
          isOwnMessage: senderId === user?.uid,
        })
      }
    },
    [user?.uid, isReady, post]
  )

  const handleNewChat = useCallback(
    (data) => {
      const { chat, createdBy, timestamp } = data

      console.log('💬 New chat notification received:', {
        chatId: chat._id,
        createdBy,
        isGroup: chat.isGroup,
        participants: chat.participants,
      })

      // Check if this chat already exists (avoid duplicates)
      setChats((prevChats) => {
        const exists = prevChats.some(
          (c) => (c._id || c.id) === (chat._id || chat.id)
        )

        if (exists) {
          console.log('⚠️ Chat already exists in state, skipping')
          return prevChats
        }

        console.log('✅ Adding new chat to state')
        // Add to the beginning of the list (most recent)
        return [chat, ...prevChats]
      })

      // Show a notification (optional)
      if (Platform.OS !== 'web') {
        const otherParticipant = chat.participants?.find((p) => p !== user?.uid)
        const otherUser =
          chat.participantDetails?.[otherParticipant] ||
          users.find((u) => (u.firebaseUid || u._id) === otherParticipant)

        const chatName = chat.isGroup ? chat.name : otherUser?.name || 'Someone'

        Alert.alert('New Chat', `${chatName} started a conversation with you`, [
          { text: 'OK' },
        ])
      }
    },
    [user?.uid, users]
  )

  const handleChatDeleted = useCallback((data) => {
    const { chatId, deletedBy } = data

    console.log('🗑️ Chat deletion notification:', {
      chatId,
      deletedBy,
    })

    // Remove chat from state
    setChats((prevChats) => prevChats.filter((c) => (c._id || c.id) !== chatId))

    // Remove messages for this chat
    setMessages((prev) => {
      const updated = { ...prev }
      delete updated[chatId]
      return updated
    })

    // Remove calls for this chat
    setCalls((prev) => {
      const updated = { ...prev }
      delete updated[chatId]
      return updated
    })

    // Show notification
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Chat Deleted',
        'This conversation has been deleted by the other person',
        [{ text: 'OK' }]
      )
    }
  }, [])

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
    const { chatId, messageId, deliveredBy, timestamp } = data

    console.log(`✅ [WS] Message delivered:`, {
      chatId,
      messageId,
      deliveredBy,
      timestamp,
    })

    setMessages((prev) => {
      const chatMessages = prev[chatId] || []

      // Find the message
      const messageIndex = chatMessages.findIndex(
        (msg) => (msg._id || msg.id) === messageId
      )

      if (messageIndex === -1) {
        console.warn(`⚠️ Message ${messageId} not found in chat ${chatId}`)
        return prev
      }

      console.log(`✅ Updating message at index ${messageIndex} to delivered`)

      // ✅ Create completely new array and object
      const updatedMessages = [...chatMessages]
      const oldMessage = updatedMessages[messageIndex]

      updatedMessages[messageIndex] = {
        ...oldMessage,
        status: 'delivered',
        deliveredAt: timestamp || new Date().toISOString(),
        deliveredBy: Array.from(
          new Set([...(oldMessage.deliveredBy || []), deliveredBy])
        ),
        _updateCount: (oldMessage._updateCount || 0) + 1,
      }

      console.log('✅ Message updated:', {
        messageId,
        oldStatus: oldMessage.status,
        newStatus: 'delivered',
        updateCount: updatedMessages[messageIndex]._updateCount,
      })

      messageUpdateCounter.current += 1

      return {
        ...prev,
        [chatId]: updatedMessages,
      }
    })
  }, [])

  const handleMessagesRead = useCallback((data) => {
    const { chatId, messageIds, readBy, timestamp } = data

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👁️ [WS] MESSAGE-READ EVENT RECEIVED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📥 Payload:', {
      chatId,
      messageIds,
      readBy,
      timestamp,
      messageIdsType: Array.isArray(messageIds) ? 'array' : typeof messageIds,
      messageIdsLength: messageIds?.length,
    })

    // ✅ Handle both single messageId (legacy) and array of messageIds
    const ids = Array.isArray(messageIds) ? messageIds : [messageIds]
    console.log('🔄 Processed IDs:', ids)

    setMessages((prev) => {
      const chatMessages = prev[chatId] || []
      console.log(`📊 Current chat has ${chatMessages.length} messages`)

      // Find which messages actually exist
      const validMessageIds = ids.filter((id) =>
        chatMessages.some((msg) => (msg._id || msg.id) === id)
      )

      console.log(
        `✅ Valid message IDs found: ${validMessageIds.length}`,
        validMessageIds
      )

      if (validMessageIds.length === 0) {
        console.warn(`⚠️ No valid messages for read update in chat ${chatId}`)
        console.warn(
          'Available message IDs:',
          chatMessages.map((m) => m._id || m.id)
        )
        return prev
      }

      // ✅ Update all matching messages
      const updatedMessages = chatMessages.map((msg) => {
        const msgId = msg._id || msg.id

        if (validMessageIds.includes(msgId)) {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.log(`👁️ UPDATING MESSAGE ${msgId} TO READ`)
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.log('Before:', {
            status: msg.status,
            readBy: msg.readBy,
            updateCount: msg._updateCount,
          })

          const newReadBy = Array.from(new Set([...(msg.readBy || []), readBy]))

          console.log('After:', {
            status: 'read',
            readBy: newReadBy,
            updateCount: (msg._updateCount || 0) + 1,
          })

          return {
            ...msg,
            status: 'read',
            readAt: timestamp || new Date().toISOString(),
            readBy: newReadBy,
            _updateCount: (msg._updateCount || 0) + 1, // ✅ Force re-render
          }
        }

        return msg
      })

      messageUpdateCounter.current += 1
      console.log(
        '✅ Updated messageUpdateCounter to:',
        messageUpdateCounter.current
      )

      return {
        ...prev,
        [chatId]: updatedMessages,
      }
    })

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ MESSAGE-READ HANDLER COMPLETE')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  }, [])
  const handleLastSeenUpdate = useCallback((data) => {
    console.log('👁️ Last seen update received:', {
      userId: data.userId,
      timestamp: data.timestamp,
    })

    setLastSeen((prev) => ({
      ...prev,
      [data.userId]: data.timestamp,
    }))

    // Also update the users array
    setUsers((prev) =>
      prev.map((u) => {
        const userId = u.firebaseUid || u._id
        if (userId === data.userId) {
          return { ...u, lastSeen: data.timestamp }
        }
        return u
      })
    )
  }, [])

  const handleTypingIndicator = useCallback((data) => {
    const { userId, chatId, isTyping } = data

    console.log('⌨️ Typing indicator received:', {
      userId,
      chatId,
      isTyping,
      platform: Platform.OS,
    })

    if (isTyping) {
      setTypingUsers((prev) => {
        const chatTyping = prev[chatId] || []
        if (!chatTyping.includes(userId)) {
          console.log('✅ Adding user to typing list:', userId)
          return { ...prev, [chatId]: [...chatTyping, userId] }
        }
        return prev
      })

      // Auto-clear typing after 5 seconds
      if (typingTimeoutRef.current[`${chatId}-${userId}`]) {
        clearTimeout(typingTimeoutRef.current[`${chatId}-${userId}`])
      }

      typingTimeoutRef.current[`${chatId}-${userId}`] = setTimeout(() => {
        console.log('⏰ Auto-clearing typing for user:', userId)
        handleTypingStopped({ userId, chatId })
      }, 5000)
    } else {
      setTypingUsers((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] || []).filter((uid) => uid !== userId),
      }))

      // Clear timeout
      if (typingTimeoutRef.current[`${chatId}-${userId}`]) {
        clearTimeout(typingTimeoutRef.current[`${chatId}-${userId}`])
        delete typingTimeoutRef.current[`${chatId}-${userId}`]
      }
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

      // ✅ Extract last seen and online status from users
      const lastSeenData = {}
      const onlineUserIds = new Set()

      data.forEach((user) => {
        const userId = user.firebaseUid || user._id

        // Set last seen
        if (user.lastSeen) {
          lastSeenData[userId] = user.lastSeen
        }

        // Set online status
        if (user.online) {
          onlineUserIds.add(userId)
        }
      })

      console.log('👥 Loaded users with status:', {
        totalUsers: data.length,
        onlineCount: onlineUserIds.size,
        lastSeenCount: Object.keys(lastSeenData).length,
      })

      setLastSeen(lastSeenData)
      setOnlineUsers(onlineUserIds)
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

        // ✅ Ensure all loaded messages have status fields
        const messagesWithStatus = sorted.map((msg) => ({
          ...msg,
          status: msg.status || 'sent',
          deliveredBy: msg.deliveredBy || [],
          readBy: msg.readBy || [],
        }))

        console.log('📥 Loaded messages with status:', {
          chatId,
          count: messagesWithStatus.length,
          sentCount: messagesWithStatus.filter((m) => m.status === 'sent')
            .length,
          deliveredCount: messagesWithStatus.filter(
            (m) => m.status === 'delivered'
          ).length,
          readCount: messagesWithStatus.filter((m) => m.status === 'read')
            .length,
        })

        setMessages((prev) => ({ ...prev, [chatId]: messagesWithStatus }))
        return messagesWithStatus
      } catch (error) {
        console.error('Failed to load messages:', error)
        return []
      }
    },
    [get, isReady]
  )

  const sendMessage = useCallback(
    async ({ chatId, content, files = [], messageType = 'text', replyTo }) => {
      if (!isReady || !chatId) {
        return { success: false, error: 'Invalid parameters' }
      }

      if ((!content || !content.trim()) && files.length === 0) {
        return {
          success: false,
          error: 'Message must have content or files',
        }
      }

      try {
        let data

        if (files.length > 0) {
          console.log('📤 Sending message with files:', {
            filesCount: files.length,
            messageType,
            hasContent: !!(content && content.trim()),
            hasReply: !!replyTo, // ✅ Log reply info
          })

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

          // ✅ ADD REPLY DATA TO FORMDATA
          if (replyTo) {
            console.log('📬 Adding reply data to FormData:', replyTo)
            formData.append('replyTo', JSON.stringify(replyTo))
          }

          for (let i = 0; i < files.length; i++) {
            const file = files[i]

            if (Platform.OS === 'web') {
              if (file instanceof File) {
                formData.append('files', file)
              } else if (file.blob) {
                const webFile = new File(
                  [file.blob],
                  file.name || `audio_${Date.now()}.webm`,
                  { type: file.type || 'audio/webm' }
                )
                formData.append('files', webFile)
              } else if (file.uri && file.uri.startsWith('blob:')) {
                const response = await fetch(file.uri)
                const blob = await response.blob()
                const webFile = new File(
                  [blob],
                  file.name || `file_${Date.now()}.jpg`,
                  { type: file.type || file.mimeType || 'image/jpeg' }
                )
                formData.append('files', webFile)
              }
            } else {
              const fileObject = {
                uri: file.uri,
                name: file.name || `file_${Date.now()}.jpg`,
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
              error: 'Text message must have content',
            }
          }

          // ✅ INCLUDE REPLY DATA IN JSON REQUEST
          const requestBody = {
            chatId,
            content: content.trim(),
            messageType: 'text',
          }

          if (replyTo) {
            console.log('📬 Adding reply data to JSON request:', replyTo)
            requestBody.replyTo = replyTo
          }

          data = await post(`${API_URL}/send-message`, requestBody)
        }

        if (data.success && data.message) {
          console.log('✅ Message created with ID:', data.message._id)

          // ✅ CRITICAL: Ensure status fields are present
          const messageWithStatus = {
            ...data.message,
            status: data.message.status || 'sent',
            sentAt: data.message.sentAt || new Date().toISOString(),
            deliveredBy: data.message.deliveredBy || [],
            readBy: data.message.readBy || [],
            _updateCount: 0,
          }

          console.log('💾 Adding message to local state:', {
            messageId: messageWithStatus._id,
            status: messageWithStatus.status,
            hasReply: !!messageWithStatus.replyTo, // ✅ Log if reply is included
          })

          setMessages((prev) => ({
            ...prev,
            [chatId]: [...(prev[chatId] || []), messageWithStatus],
          }))

          const chat = chats.find((c) => (c._id || c.id) === chatId)
          if (chat) {
            wsSend({
              type: 'new-message',
              chatId,
              message: messageWithStatus,
              participants: chat.participants || [],
            })
          }

          sendTypingIndicator(chatId, false)
          await updateLastSeen(chatId)
        }

        return data
      } catch (error) {
        console.error('❌ sendMessage error:', error)
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

  const markMessagesAsDelivered = useCallback(
    async (chatId, messageIds) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📬 MARK AS DELIVERED - FUNCTION CALLED')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      if (!isReady || !user?.uid) {
        console.log('❌ markMessagesAsDelivered - Auth not ready:', {
          isReady,
          hasUser: !!user,
          uid: user?.uid,
        })
        return { success: false, error: 'Auth not ready' }
      }

      if (!messageIds || messageIds.length === 0) {
        console.log('❌ markMessagesAsDelivered - No message IDs provided')
        return { success: false, error: 'No message IDs' }
      }

      console.log('📬 Mark Delivered Parameters:', {
        chatId,
        messageIds,
        count: messageIds.length,
        userId: user.uid,
      })

      // ✅ Update local state IMMEDIATELY
      setMessages((prev) => {
        const chatMessages = prev[chatId] || []
        let hasChanges = false

        console.log('📬 Current messages in chat:', {
          chatId,
          totalMessages: chatMessages.length,
          messageIds: chatMessages.map((m) => ({
            id: m._id || m.id,
            senderId: m.senderId || m.sender || m.from,
            status: m.status,
            deliveredBy: m.deliveredBy,
          })),
        })

        const updatedMessages = chatMessages.map((msg) => {
          const msgId = msg._id || msg.id
          const senderId = msg.senderId || msg.sender || msg.from

          if (messageIds.includes(msgId)) {
            console.log('📬 Checking message:', {
              msgId,
              senderId,
              currentUserId: user.uid,
              isFromCurrentUser: senderId === user.uid,
              alreadyDelivered: msg.deliveredBy?.includes(user.uid),
              currentStatus: msg.status,
              deliveredBy: msg.deliveredBy,
            })

            if (senderId !== user.uid) {
              const alreadyDelivered = msg.deliveredBy?.includes(user.uid)

              if (!alreadyDelivered) {
                hasChanges = true
                console.log('✅ UPDATING MESSAGE TO DELIVERED:', msgId)

                return {
                  ...msg,
                  status: 'delivered',
                  deliveredAt: new Date().toISOString(),
                  deliveredBy: Array.from(
                    new Set([...(msg.deliveredBy || []), user.uid])
                  ),
                  _updateCount: (msg._updateCount || 0) + 1,
                }
              } else {
                console.log('⏭️ Already delivered:', msgId)
              }
            } else {
              console.log('⏭️ Message is from current user, skipping:', msgId)
            }
          }
          return msg
        })

        if (hasChanges) {
          messageUpdateCounter.current += 1
          console.log(
            '✅ State updated, counter:',
            messageUpdateCounter.current
          )
          return {
            ...prev,
            [chatId]: updatedMessages,
          }
        }

        console.log('⚠️ No changes needed')
        return prev
      })

      // ✅ Make API call
      try {
        console.log('📤 Making API call to mark as delivered...')
        const data = await post(
          `${API_URL}/mark-messages-delivered/${chatId}`,
          { messageIds }
        )

        console.log('📬 Backend response:', data)
        return data
      } catch (error) {
        console.error('❌ markMessagesAsDelivered API error:', error)
        return {
          success: false,
          error: error.message || 'Failed to mark messages as delivered',
        }
      }
    },
    [isReady, post, user?.uid]
  )

  const markMessagesAsRead = useCallback(
    async (chatId, messageIds = null) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('👁️ MARK AS READ - FUNCTION CALLED')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      if (!isReady || !user?.uid) {
        console.log('❌ markMessagesAsRead - Auth not ready:', {
          isReady,
          hasUser: !!user,
          uid: user?.uid,
        })
        return { success: false, error: 'Auth not ready' }
      }

      console.log('👁️ Mark Read Parameters:', {
        chatId,
        messageIds,
        count: messageIds?.length,
        userId: user.uid,
      })

      // ✅ Update local state IMMEDIATELY
      setMessages((prev) => {
        const chatMessages = prev[chatId] || []
        let hasChanges = false

        console.log('👁️ Current messages in chat:', {
          chatId,
          totalMessages: chatMessages.length,
          messageIds: chatMessages.map((m) => ({
            id: m._id || m.id,
            senderId: m.senderId || m.sender || m.from,
            status: m.status,
            readBy: m.readBy,
          })),
        })

        const updatedMessages = chatMessages.map((msg) => {
          const msgId = msg._id || msg.id
          const senderId = msg.senderId || msg.sender || msg.from

          const shouldMark = messageIds
            ? messageIds.includes(msgId)
            : senderId !== user.uid

          if (shouldMark) {
            console.log('👁️ Checking message:', {
              msgId,
              senderId,
              currentUserId: user.uid,
              isFromCurrentUser: senderId === user.uid,
              alreadyRead: msg.readBy?.includes(user.uid),
              currentStatus: msg.status,
              readBy: msg.readBy,
            })

            if (senderId !== user.uid) {
              const alreadyRead = msg.readBy?.includes(user.uid)

              if (!alreadyRead) {
                hasChanges = true
                console.log('✅ UPDATING MESSAGE TO READ:', msgId)

                return {
                  ...msg,
                  status: 'read',
                  readAt: new Date().toISOString(),
                  readBy: Array.from(
                    new Set([...(msg.readBy || []), user.uid])
                  ),
                  _updateCount: (msg._updateCount || 0) + 1,
                }
              } else {
                console.log('⏭️ Already read:', msgId)
              }
            } else {
              console.log('⏭️ Message is from current user, skipping:', msgId)
            }
          }
          return msg
        })

        if (hasChanges) {
          messageUpdateCounter.current += 1
          console.log(
            '✅ State updated, counter:',
            messageUpdateCounter.current
          )
          return {
            ...prev,
            [chatId]: updatedMessages,
          }
        }

        console.log('⚠️ No changes needed')
        return prev
      })

      // ✅ Make API call
      try {
        console.log('📤 Making API call to mark as read...')
        const body = messageIds ? { messageIds } : {}
        const data = await post(`${API_URL}/mark-messages-read/${chatId}`, body)

        console.log('👁️ Backend response:', data)
        return data
      } catch (error) {
        console.error('❌ markMessagesAsRead API error:', error)
        return {
          success: false,
          error: error.message || 'Failed to mark messages as read',
        }
      }
    },
    [isReady, post, user?.uid]
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
      if (!wsConnected) {
        console.warn('⚠️ Cannot send typing - WebSocket not connected')
        return
      }

      const chat = chats.find((c) => (c._id || c.id) === chatId)
      if (!chat) {
        console.warn('⚠️ Cannot send typing - Chat not found')
        return
      }

      console.log('⌨️ Sending typing indicator:', {
        chatId,
        isTyping,
        platform: Platform.OS,
        participants: chat.participants,
      })

      wsSend({
        type: isTyping ? 'typing-start' : 'typing-stop',
        chatId,
        participants: chat.participants,
      })

      if (isTyping) {
        // Clear any existing timeout for this chat
        if (typingTimeoutRef.current[chatId]) {
          clearTimeout(typingTimeoutRef.current[chatId])
        }

        // Auto-stop typing after 5 seconds
        typingTimeoutRef.current[chatId] = setTimeout(() => {
          console.log('⏰ Auto-stopping typing for chat:', chatId)
          sendTypingIndicator(chatId, false)
        }, 5000)
      } else {
        // Clear timeout when explicitly stopping
        if (typingTimeoutRef.current[chatId]) {
          clearTimeout(typingTimeoutRef.current[chatId])
          delete typingTimeoutRef.current[chatId]
        }
      }
    },
    [chats, wsSend, wsConnected]
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
  useEffect(() => {
    if (!isReady || chats.length === 0) return

    chats.forEach((chat) => {
      const chatId = chat._id || chat.id
      getCallHistory(chatId)
    })
  }, [isReady, chats])

  const deleteCallLog = useCallback(
    async (callId) => {
      if (!isReady || !user?.uid) {
        return { success: false, error: 'Auth not ready' }
      }

      try {
        const data = await del(`${API_URL}/delete-call/${callId}`)

        if (data.success) {
          // Update local state - remove from all chats' call logs
          setCalls((prev) => {
            const updated = { ...prev }
            Object.keys(updated).forEach((chatId) => {
              updated[chatId] = updated[chatId].filter(
                (call) => (call._id || call.id) !== callId
              )
            })
            return updated
          })
        }

        return data
      } catch (error) {
        console.error('deleteCallLog error:', error)
        return {
          success: false,
          error: error.message || 'Failed to delete call log',
        }
      }
    },
    [isReady, del, user?.uid]
  )

  const startActiveCall = useCallback((callData) => {
    console.log('📞 Starting active call:', callData)
    setActiveCall({
      ...callData,
      startTime: Date.now(),
    })
  }, [])

  const endActiveCall = useCallback(() => {
    console.log('📞 Ending active call')
    setActiveCall(null)
  }, [])

  const updateActiveCallStatus = useCallback((status) => {
    setActiveCall((prev) => (prev ? { ...prev, status } : null))
  }, [])

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

  // Add this useEffect near the bottom of ChatsProvider, before the cleanup effect

  // ✅ Auto-mark undelivered messages on startup/reconnect
  useEffect(() => {
    // Only run when conditions are ready
    if (!user?.uid || !isReady || loading || !wsConnected) {
      console.log('⏭️ Skipping startup delivery check:', {
        hasUser: !!user?.uid,
        isReady,
        loading,
        wsConnected,
      })
      return
    }

    // Add a small delay to ensure messages are loaded
    const timer = setTimeout(() => {
      console.log('🔄 Running startup delivery check...')
      console.log('📊 Total chats with messages:', Object.keys(messages).length)

      let totalUndelivered = 0

      // Check all chats for undelivered messages
      Object.entries(messages).forEach(([chatId, chatMessages]) => {
        const undelivered = chatMessages.filter((msg) => {
          const senderId = msg.senderId || msg.sender || msg.from
          const isFromOther = senderId !== user.uid
          const notDelivered = !msg.deliveredBy?.includes(user.uid)

          return isFromOther && notDelivered
        })

        if (undelivered.length > 0) {
          totalUndelivered += undelivered.length
          const messageIds = undelivered.map((m) => m._id || m.id)

          console.log(
            `📬 Chat ${chatId}: Found ${undelivered.length} undelivered messages`
          )
          console.log('   Message IDs:', messageIds)

          markMessagesAsDelivered(chatId, messageIds)
            .then((result) => {
              console.log(
                `✅ Marked ${messageIds.length} messages as delivered in chat ${chatId}`
              )
            })
            .catch((err) => {
              console.error(
                `❌ Failed to mark messages as delivered in chat ${chatId}:`,
                err
              )
            })
        }
      })

      if (totalUndelivered === 0) {
        console.log('✅ No undelivered messages found')
      } else {
        console.log(`📬 Total undelivered messages found: ${totalUndelivered}`)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [user?.uid, isReady, wsConnected])

  // Cleanup typing timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(typingTimeoutRef.current).forEach(clearTimeout)
    }
  }, [])

  const contextValue = {
    user,

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
    chatMessages: messages,

    loadMessages,
    sendMessage,
    updateMessage,
    deleteMessage,
    getMessagesForChat,

    markMessagesAsDelivered,
    markMessagesAsRead,

    updateLastSeen,
    getLastSeen,

    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    getCallHistory,
    dismissCallNotification,
    deleteCallLog,

    activeCall,
    startActiveCall,
    endActiveCall,
    updateActiveCallStatus,

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
