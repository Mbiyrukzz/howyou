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
  const hasMarkedInitialRef = useRef(false) // ✅ Track if we've done initial marking

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

  // ✅ FIXED: Mark as delivered
  useEffect(() => {
    console.log('🔄 Mark Delivered Effect Triggered:', {
      hasMessages: messages.length > 0,
      chatId,
      hasUser: !!chatsContext?.user?.uid,
      loading,
      messageCount: messages.length,
    })

    if (!messages.length || !chatId || !chatsContext?.user?.uid || loading) {
      console.log('⏭️ Skipping delivery check - conditions not met')
      return
    }

    // Clear previous timeout
    if (markDeliveredTimeoutRef.current) {
      clearTimeout(markDeliveredTimeoutRef.current)
    }

    // Debounce the marking
    markDeliveredTimeoutRef.current = setTimeout(() => {
      const undelivered = messages.filter((msg) => {
        const msgId = msg._id || msg.id
        const senderId = msg.senderId || msg.sender || msg.from

        const isFromOther = senderId !== chatsContext.user.uid
        const notDelivered = !msg.deliveredBy?.includes(chatsContext.user.uid)
        const notMarked = !markedAsDeliveredRef.current.has(msgId)

        console.log('📬 Checking message for delivery:', {
          msgId,
          senderId,
          currentUser: chatsContext.user.uid,
          isFromOther,
          notDelivered,
          notMarked,
          deliveredBy: msg.deliveredBy,
        })

        return isFromOther && notDelivered && notMarked
      })

      if (undelivered.length > 0) {
        console.log('📬 [useChatMessages] Marking messages as delivered:', {
          count: undelivered.length,
          messageIds: undelivered.map((m) => m._id || m.id),
        })

        const messageIds = undelivered.map((m) => m._id || m.id)
        messageIds.forEach((id) => markedAsDeliveredRef.current.add(id))

        // ✅ Add error handling
        markMessagesAsDelivered?.(chatId, messageIds).catch((err) => {
          console.error('❌ Failed to mark as delivered:', err)
          // Remove from marked set so we can retry
          messageIds.forEach((id) => markedAsDeliveredRef.current.delete(id))
        })
      } else {
        console.log('📬 [useChatMessages] No messages need delivery marking')
      }
    }, 500)

    return () => {
      if (markDeliveredTimeoutRef.current) {
        clearTimeout(markDeliveredTimeoutRef.current)
      }
    }
  }, [
    messages,
    chatId,
    chatsContext?.user?.uid,
    loading,
    markMessagesAsDelivered, // ✅ Added missing dependency
  ])

  // ✅ FIXED: Mark as read
  useEffect(() => {
    console.log('🔄 Mark Read Effect Triggered:', {
      hasMessages: messages.length > 0,
      chatId,
      hasUser: !!chatsContext?.user?.uid,
      loading,
      messageCount: messages.length,
    })

    if (!messages.length || !chatId || !chatsContext?.user?.uid || loading) {
      console.log('⏭️ Skipping read check - conditions not met')
      return
    }

    // Clear previous timeout
    if (markReadTimeoutRef.current) {
      clearTimeout(markReadTimeoutRef.current)
    }

    // Debounce the marking
    markReadTimeoutRef.current = setTimeout(() => {
      const unread = messages.filter((msg) => {
        const msgId = msg._id || msg.id
        const senderId = msg.senderId || msg.sender || msg.from

        const isFromOther = senderId !== chatsContext.user.uid
        const notRead = !msg.readBy?.includes(chatsContext.user.uid)
        const notMarked = !markedAsReadRef.current.has(msgId)

        console.log('👁️ Checking message for read:', {
          msgId,
          senderId,
          currentUser: chatsContext.user.uid,
          isFromOther,
          notRead,
          notMarked,
          readBy: msg.readBy,
        })

        return isFromOther && notRead && notMarked
      })

      if (unread.length > 0) {
        console.log('👁️ [useChatMessages] Marking messages as read:', {
          count: unread.length,
          messageIds: unread.map((m) => m._id || m.id),
        })

        const messageIds = unread.map((m) => m._id || m.id)
        messageIds.forEach((id) => markedAsReadRef.current.add(id))

        // ✅ Add error handling
        markMessagesAsRead?.(chatId, messageIds).catch((err) => {
          console.error('❌ Failed to mark as read:', err)
          // Remove from marked set so we can retry
          messageIds.forEach((id) => markedAsReadRef.current.delete(id))
        })
      } else {
        console.log('👁️ [useChatMessages] No messages need read marking')
      }
    }, 500)

    return () => {
      if (markReadTimeoutRef.current) {
        clearTimeout(markReadTimeoutRef.current)
      }
    }
  }, [
    messages,
    chatId,
    chatsContext?.user?.uid,
    loading,
    markMessagesAsRead, // ✅ Added missing dependency
  ])

  // CLEAN UP REFS WHEN CHAT CHANGES
  useEffect(() => {
    // ✅ Reset flag when chat changes
    hasMarkedInitialRef.current = false

    return () => {
      markedAsDeliveredRef.current.clear()
      markedAsReadRef.current.clear()
    }
  }, [chatId])

  // ✅ Debug message structure
  useEffect(() => {
    if (messages.length > 0) {
      console.log('🔍 MESSAGE STRUCTURE DEBUG:', {
        firstMessage: messages[0],
        allKeys: Object.keys(messages[0]),
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
  }, [messages.length, chatsContext?.user?.uid])

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
