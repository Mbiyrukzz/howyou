import React, { useEffect, useState, useCallback, useRef } from 'react'
import ChatsContext from '../contexts/ChatsContext'
import useAuthedRequest from '../hooks/useAuthedRequest'
import { useUser } from '../hooks/useUser'
import { Alert, Platform } from 'react-native'

const API_URL = 'http://10.38.189.87:5000'
const WS_URL = 'ws://10.38.189.87:5000'

const ChatsProvider = ({ children }) => {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState({})
  const [calls, setCalls] = useState({})
  const [incomingCall, setIncomingCall] = useState(null)
  const [callNotification, setCallNotification] = useState(null)
  const [wsConnected, setWsConnected] = useState(false)

  const { isReady, get, put, post, del } = useAuthedRequest()
  const { user } = useUser()
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  // WebSocket connection for real-time notifications
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
    }
  }, [user?.uid, isReady])

  const initializeWebSocket = () => {
    try {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close()
      }

      const wsUrl = `${WS_URL}/notifications?userId=${user.uid}`
      console.log('Connecting to WebSocket:', wsUrl)

      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log('WebSocket connected successfully')
        setWsConnected(true)
        reconnectAttemptsRef.current = 0
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleWebSocketMessage(data)
        } catch (error) {
          console.error('WebSocket message parse error:', error)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setWsConnected(false)
      }

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', {
          code: event.code,
          reason: event.reason,
          clean: event.wasClean,
        })
        setWsConnected(false)

        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            30000
          )
          console.log(
            `Reconnecting in ${delay}ms (attempt ${
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
          console.error('Max reconnection attempts reached')
          Alert.alert(
            'Connection Lost',
            'Unable to connect to server. Please check your internet connection and restart the app.',
            [{ text: 'OK' }]
          )
        }
      }
    } catch (error) {
      console.error('WebSocket initialization error:', error)
      setWsConnected(false)
    }
  }

  const handleWebSocketMessage = (data) => {
    console.log('WebSocket message received:', data.type)

    switch (data.type) {
      case 'connected':
        console.log('WebSocket connection confirmed')
        break

      case 'incoming_call':
        handleIncomingCall(data)
        break

      case 'call_ended':
        handleCallEnded(data)
        break

      case 'call_accepted':
        console.log('Call accepted by recipient')
        break

      case 'call_rejected':
        console.log('Call rejected by recipient')
        Alert.alert('Call Declined', 'The other person declined your call')
        break

      case 'new_message':
        handleNewMessage(data)
        break

      case 'typing':
        handleTyping(data)
        break

      case 'ping':
        // Respond to server ping
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'pong' }))
        }
        break

      case 'pong':
        // Server responded to our ping
        break

      case 'error':
        console.error('Server error:', data.message)
        break

      default:
        console.log('Unknown WebSocket message type:', data.type)
    }
  }

  const handleIncomingCall = (callData) => {
    console.log('Incoming call notification:', callData)

    setIncomingCall(callData)
    setCallNotification({
      type: 'incoming_call',
      caller: callData.caller,
      callerName: callData.callerName,
      callType: callData.callType,
      callId: callData.callId,
      chatId: callData.chatId,
    })

    // Show alert
    Alert.alert(
      `Incoming ${callData.callType === 'video' ? 'Video' : 'Voice'} Call`,
      `${callData.callerName || 'Someone'} is calling you`,
      [
        {
          text: 'Decline',
          style: 'cancel',
          onPress: () => rejectCall(callData.callId),
        },
        {
          text: 'Answer',
          onPress: () => {
            // Navigation should be handled by the component consuming this context
            console.log('User wants to answer call:', callData.callId)
          },
        },
      ]
    )

    // Auto-dismiss after 30 seconds
    setTimeout(() => {
      setCallNotification(null)
      setIncomingCall(null)
    }, 30000)
  }

  const handleCallEnded = (data) => {
    console.log('Call ended notification:', data)
    setIncomingCall(null)
    setCallNotification(null)

    Alert.alert('Call Ended', `Call ended after ${data.duration || 0} seconds`)
  }

  const handleNewMessage = (messageData) => {
    console.log('New message received:', messageData)
    const { chatId, message } = messageData
    setMessages((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), message],
    }))
  }

  const handleTyping = (typingData) => {
    console.log('User typing:', typingData)
  }

  /** ──────────────── CHATS ──────────────── **/
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
        console.log('Deleting chat:', chatId)

        // Use the del method from useAuthedRequest
        const data = await del(`${API_URL}/delete-chat/${chatId}`)

        if (data.success) {
          // Remove chat from local state
          setChats((prev) => prev.filter((c) => (c._id || c.id) !== chatId))

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

          console.log('✅ Chat deleted successfully')
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
          // Use FormData for file uploads
          const formData = new FormData()
          formData.append('chatId', chatId)

          // Determine message type from first file if not provided
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

          // Process files - handle both React Native and Web
          for (let i = 0; i < files.length; i++) {
            const file = files[i]

            if (Platform.OS === 'web' && file.uri.startsWith('blob:')) {
              // For web, we need to fetch the blob and convert it to a File
              try {
                const response = await fetch(file.uri)
                const blob = await response.blob()
                const webFile = new File(
                  [blob],
                  file.name || `file_${Date.now()}_${i}.jpg`,
                  { type: file.type || file.mimeType || 'image/jpeg' }
                )
                formData.append('files', webFile)
                console.log(`Appending web file ${i}:`, {
                  name: webFile.name,
                  type: webFile.type,
                  size: webFile.size,
                })
              } catch (blobError) {
                console.error('Failed to convert blob:', blobError)
                throw new Error('Failed to process image file')
              }
            } else {
              // For React Native mobile
              const fileObject = {
                uri: file.uri,
                name: file.name || `file_${Date.now()}_${i}.jpg`,
                type: file.type || file.mimeType || 'image/jpeg',
              }
              formData.append('files', fileObject)
              console.log(`Appending mobile file ${i}:`, fileObject)
            }
          }

          console.log('Sending message with files:', {
            chatId,
            messageType: determinedType,
            filesCount: files.length,
            hasContent: !!(content && content.trim()),
            platform: Platform.OS,
          })

          // Get auth token
          const token = await user.getIdToken()

          // Make the request with FormData using fetch
          const response = await fetch(`${API_URL}/send-message`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              // DO NOT set Content-Type - let the browser set it with boundary
            },
            body: formData,
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `HTTP ${response.status}`)
          }

          data = await response.json()
        } else {
          // Text-only message
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

          // Notify via WebSocket if connected
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: 'message_sent',
                chatId,
                message: data.message,
              })
            )
          }
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
    [isReady, post, user]
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

      if (!wsConnected) {
        Alert.alert(
          'Connection Error',
          'Not connected to server. Please try again.'
        )
        return { success: false, error: 'WebSocket not connected' }
      }

      try {
        console.log('Initiating call:', { chatId, callType, recipientId })
        const data = await post(`${API_URL}/initiate-call`, {
          chatId,
          callType,
          recipientId,
        })

        console.log('Call initiation result:', data)
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
        console.log('Answering call:', { callId, accepted })
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
        console.log('Ending call:', callId)
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

    // Chat functions
    reloadChats: loadChats,
    loadUsers,
    createChat,
    deleteChat,

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
