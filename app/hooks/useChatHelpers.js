import { useContext, useCallback, useEffect, useRef } from 'react'
import ChatsContext from '../contexts/ChatsContext'

export const useChatHelpers = (chatId = null) => {
  const context = useContext(ChatsContext)
  const typingTimeoutRef = useRef(null)

  if (!context) {
    throw new Error('useChatHelpers must be used within ChatsProvider')
  }

  const {
    sendTypingIndicator,
    getTypingUsersForChat,
    isUserOnline,
    getUserStatus,
    findUserById,
    getChatParticipants,
    wsConnected,
  } = context

  /**
   * Handle input change with automatic typing indicator
   * Call this in your TextInput's onChangeText
   */
  const handleTypingInput = useCallback(
    (text, callback) => {
      if (!chatId || !wsConnected) {
        if (callback) callback(text)
        return
      }

      // Call the actual text change callback
      if (callback) callback(text)

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      if (text.trim().length > 0) {
        // Send typing indicator
        sendTypingIndicator(chatId, true)

        // Auto-stop after 3 seconds of no typing
        typingTimeoutRef.current = setTimeout(() => {
          sendTypingIndicator(chatId, false)
        }, 3000)
      } else {
        // Stop typing if input is empty
        sendTypingIndicator(chatId, false)
      }
    },
    [chatId, wsConnected, sendTypingIndicator]
  )

  /**
   * Stop typing indicator
   * Call this when user sends message or blurs input
   */
  const stopTyping = useCallback(() => {
    if (chatId && wsConnected) {
      sendTypingIndicator(chatId, false)
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }, [chatId, wsConnected, sendTypingIndicator])

  /**
   * Get typing users for current chat
   */
  const typingUsers = chatId ? getTypingUsersForChat(chatId) : []

  /**
   * Get formatted typing text
   * Returns: "John is typing...", "John and Mary are typing...", etc.
   */
  const getTypingText = useCallback(() => {
    if (!typingUsers || typingUsers.length === 0) return ''

    const names = typingUsers.map((u) => u.name || 'Someone')

    if (names.length === 1) {
      return `${names[0]} is typing...`
    } else if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing...`
    } else {
      return `${names[0]}, ${names[1]} and ${
        names.length - 2
      } others are typing...`
    }
  }, [typingUsers])

  /**
   * Check if a user is online
   */
  const checkUserOnline = useCallback(
    (userId) => {
      return isUserOnline(userId)
    },
    [isUserOnline]
  )

  /**
   * Get user status (online/offline/away/busy)
   */
  const getStatus = useCallback(
    (userId) => {
      return getUserStatus(userId)
    },
    [getUserStatus]
  )

  /**
   * Get formatted status text
   */
  const getStatusText = useCallback(
    (userId) => {
      const status = getUserStatus(userId)
      const isOnline = isUserOnline(userId)

      if (!isOnline) return 'Offline'

      switch (status.status) {
        case 'online':
          return status.customMessage || 'Online'
        case 'away':
          return status.customMessage || 'Away'
        case 'busy':
          return status.customMessage || 'Busy'
        case 'dnd':
          return status.customMessage || 'Do not disturb'
        default:
          return 'Online'
      }
    },
    [getUserStatus, isUserOnline]
  )

  /**
   * Get chat participants
   */
  const participants = chatId ? getChatParticipants(chatId) : []

  /**
   * Get other user in a direct chat (assuming 1-on-1 chat)
   */
  const getOtherUser = useCallback(
    (currentUserId) => {
      if (!chatId || !participants.length) return null

      return participants.find(
        (p) =>
          p.firebaseUid !== currentUserId &&
          p._id !== currentUserId &&
          p.id !== currentUserId
      )
    },
    [chatId, participants]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      // Stop typing indicator on unmount
      if (chatId && wsConnected) {
        sendTypingIndicator(chatId, false)
      }
    }
  }, [chatId, wsConnected, sendTypingIndicator])

  return {
    // Typing
    handleTypingInput,
    stopTyping,
    typingUsers,
    getTypingText,
    isTyping: typingUsers.length > 0,

    // Status
    checkUserOnline,
    getStatus,
    getStatusText,

    // Participants
    participants,
    getOtherUser,

    // Connection
    wsConnected,

    // Utilities
    findUserById,
  }
}

export default useChatHelpers
