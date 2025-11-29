import { useState, useEffect, useContext, useRef } from 'react'
import ChatsContext from '../contexts/ChatsContext'

export const useChatMessages = (chatId) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [callLogs, setCallLogs] = useState([])
  const [combinedItems, setCombinedItems] = useState([])

  const chatsContext = useContext(ChatsContext)
  const {
    loadMessages,
    getCallHistory,
    getMessagesForChat,
    markMessagesAsDelivered,
    markMessagesAsRead,
  } = chatsContext || {}

  const messages = getMessagesForChat(chatId) || []

  const markedAsDeliveredRef = useRef(new Set())
  const markedAsReadRef = useRef(new Set())
  const markDeliveredTimeoutRef = useRef(null)
  const markReadTimeoutRef = useRef(null)

  const loadChatMessages = async () => {
    if (!chatId) return
    try {
      setLoading(true)
      setError(null)
      await loadMessages(chatId)
      const callHistoryData = await getCallHistory(chatId)
      setCallLogs(callHistoryData || [])
    } catch (err) {
      console.error('Failed to load messages:', err)
      setError('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChatMessages()
  }, [chatId])

  // Combine messages and call logs
  useEffect(() => {
    const combined = []

    messages.forEach((msg) => {
      combined.push({
        type: 'message',
        data: msg,
        timestamp: new Date(msg.createdAt),
      })
    })

    callLogs.forEach((call) => {
      combined.push({
        type: 'call',
        data: call,
        timestamp: new Date(call.createdAt),
      })
    })

    combined.sort((a, b) => a.timestamp - b.timestamp)
    setCombinedItems(combined)
  }, [messages, callLogs])

  useEffect(() => {
    if (!messages.length || !chatId || !chatsContext?.user?.uid || loading)
      return

    // Clear previous timeout
    if (markDeliveredTimeoutRef.current) {
      clearTimeout(markDeliveredTimeoutRef.current)
    }

    // Debounce the marking
    markDeliveredTimeoutRef.current = setTimeout(() => {
      const undelivered = messages.filter((msg) => {
        const msgId = msg._id || msg.id
        // ✅ Check multiple possible sender field names
        const senderId = msg.senderId || msg.sender || msg.from

        return (
          senderId !== chatsContext.user.uid &&
          !msg.deliveredBy?.includes(chatsContext.user.uid) &&
          !markedAsDeliveredRef.current.has(msgId)
        )
      })

      if (undelivered.length > 0) {
        console.log('📬 [useChatMessages] Marking messages as delivered:', {
          count: undelivered.length,
          messageIds: undelivered.map((m) => m._id || m.id),
        })

        const messageIds = undelivered.map((m) => m._id || m.id)
        messageIds.forEach((id) => markedAsDeliveredRef.current.add(id))
        markMessagesAsDelivered?.(chatId, messageIds)
      } else {
        console.log('📬 [useChatMessages] No messages need delivery marking')
      }
    }, 500)

    return () => {
      if (markDeliveredTimeoutRef.current) {
        clearTimeout(markDeliveredTimeoutRef.current)
      }
    }
  }, [messages.length, chatId, chatsContext?.user?.uid, loading])

  useEffect(() => {
    if (!messages.length || !chatId || !chatsContext?.user?.uid || loading)
      return

    // Clear previous timeout
    if (markReadTimeoutRef.current) {
      clearTimeout(markReadTimeoutRef.current)
    }

    // Debounce the marking
    markReadTimeoutRef.current = setTimeout(() => {
      const unread = messages.filter((msg) => {
        const msgId = msg._id || msg.id
        // ✅ Check multiple possible sender field names
        const senderId = msg.senderId || msg.sender || msg.from

        return (
          senderId !== chatsContext.user.uid &&
          !msg.readBy?.includes(chatsContext.user.uid) &&
          !markedAsReadRef.current.has(msgId)
        )
      })

      if (unread.length > 0) {
        console.log('👁️ [useChatMessages] Marking messages as read:', {
          count: unread.length,
          messageIds: unread.map((m) => m._id || m.id),
        })

        const messageIds = unread.map((m) => m._id || m.id)
        messageIds.forEach((id) => markedAsReadRef.current.add(id))
        markMessagesAsRead?.(chatId, messageIds)
      } else {
        console.log('👁️ [useChatMessages] No messages need read marking')
      }
    }, 500)

    return () => {
      if (markReadTimeoutRef.current) {
        clearTimeout(markReadTimeoutRef.current)
      }
    }
  }, [messages.length, chatId, chatsContext?.user?.uid, loading])

  // CLEAN UP REFS WHEN CHAT CHANGES
  useEffect(() => {
    return () => {
      markedAsDeliveredRef.current.clear()
      markedAsReadRef.current.clear()
    }
  }, [chatId])

  useEffect(() => {
    if (messages.length > 0) {
      console.log('🔍 MESSAGE STRUCTURE DEBUG:', {
        firstMessage: messages[0],
        senderFields: {
          senderId: messages[0].senderId,
          sender: messages[0].sender,
          from: messages[0].from,
        },
        statusFields: {
          status: messages[0].status,
          deliveredBy: messages[0].deliveredBy,
          readBy: messages[0].readBy,
        },
        currentUserId: chatsContext?.user?.uid,
      })
    }
  }, [messages.length])

  return {
    messages,
    callLogs,
    combinedItems,
    loading,
    error,
    loadChatMessages,
    markMessagesAsDelivered,
    markMessagesAsRead,
    setCallLogs,
  }
}
