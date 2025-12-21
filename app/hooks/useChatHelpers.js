import { useContext, useCallback, useEffect, useRef } from 'react'
import ChatsContext from '../contexts/ChatsContext'
import LoadingIndicator from '../components/LoadingIndicator'

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

  const { getLastSeen, updateLastSeen } = context
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

  const getTypingText = useCallback(() => {
    if (!typingUsers || typingUsers.length === 0) return ''

    const names = typingUsers.map((u) => u.name || 'Someone')

    if (names.length === 1) {
      return <LoadingIndicator showCard={false} size={8} />
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

    getLastSeen,
    updateLastSeen,
    // Connection
    wsConnected,

    // Utilities
    findUserById,

    getLastSeenText: useCallback(
      (userId) => {
        const timestamp = getLastSeen(userId)
        if (!timestamp) return 'recently'

        const date = new Date(timestamp)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)

        // Format time as "2:45 PM"
        const timeString = date.toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })

        // Less than 1 minute
        if (diffMins < 1) return 'just now'

        // Less than 1 hour - show relative time
        if (diffMins < 60) return `${diffMins} min ago`

        // Today - show "today at 2:45 PM"
        const today = new Date()
        if (date.toDateString() === today.toDateString()) {
          return `today at ${timeString}`
        }

        // Yesterday - show "yesterday at 2:45 PM"
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        if (date.toDateString() === yesterday.toDateString()) {
          return `yesterday at ${timeString}`
        }

        // This week - show "Monday at 2:45 PM"
        const daysAgo = Math.floor(diffMs / 86400000)
        if (daysAgo < 7) {
          const dayName = date.toLocaleDateString([], { weekday: 'long' })
          return `${dayName} at ${timeString}`
        }

        // Older - show "Jan 15 at 2:45 PM"
        const dateString = date.toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
        })
        return `${dateString} at ${timeString}`
      },
      [getLastSeen]
    ),
  }
}

export default useChatHelpers
