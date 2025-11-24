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
    if (!messages.length || !chatId) return

    const undelivered = messages.filter(
      (msg) =>
        msg.senderId !== chatsContext?.user?.uid &&
        !msg.deliveredBy?.includes(chatsContext?.user?.uid)
    )

    if (undelivered.length > 0) {
      markMessagesAsDelivered?.(
        chatId,
        undelivered.map((m) => m._id || m.id)
      )
    }
  }, [messages, chatId])

  useEffect(() => {
    if (!messages.length || !chatId) return

    const unread = messages.filter(
      (msg) =>
        msg.senderId !== chatsContext?.user?.uid &&
        !msg.readBy?.includes(chatsContext?.user?.uid)
    )

    if (unread.length > 0) {
      markMessagesAsRead?.(
        chatId,
        unread.map((m) => m._id || m.id)
      )
    }
  }, [messages, chatId])

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
