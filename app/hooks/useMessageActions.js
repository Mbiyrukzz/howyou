import { useState } from 'react'
import { Alert, Platform } from 'react-native'

export const useMessageActions = (
  chatId,
  updateMessage,
  deleteMessage,
  currentUserId
) => {
  const [actionMenuVisible, setActionMenuVisible] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [webDropdownVisible, setWebDropdownVisible] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 })
  const [savingEdit, setSavingEdit] = useState(false)
  const [replyToMessage, setReplyToMessage] = useState(null)

  const handleMessageLongPress = (message) => {
    if (Platform.OS !== 'web') {
      setSelectedMessage(message)
      setActionMenuVisible(true)
    }
  }

  const handleThreeDotsPress = (message, position) => {
    if (Platform.OS === 'web') {
      setSelectedMessage(message)
      setDropdownPosition({
        x: position?.x || window.innerWidth - 200,
        y: position?.y || 150,
      })
      setWebDropdownVisible(true)
    }
  }

  const handleReplyMessage = (message) => {
    const messageToReply = message || selectedMessage
    if (!messageToReply) return

    // ✅ CRITICAL FIX: Store actual sender info, not display name
    // Each user's UI will decide whether to show "You" or the actual name
    setReplyToMessage({
      _id: messageToReply._id || messageToReply.id,
      content: messageToReply.content,
      type: messageToReply.type,
      senderId: messageToReply.senderId, // Store actual senderId
      senderName: messageToReply.senderName || 'Unknown', // Store actual name (not "You")
    })

    // Close menus
    setActionMenuVisible(false)
    setWebDropdownVisible(false)

    // Clear selected message if we're using it
    if (!message) {
      setSelectedMessage(null)
    }
  }

  const handleEditMessage = () => {
    setActionMenuVisible(false)
    setWebDropdownVisible(false)
    setEditModalVisible(true)
  }

  const handleDeleteMessage = async () => {
    const id = selectedMessage._id ?? selectedMessage.id
    const result = await deleteMessage(id, chatId)

    if (result.success) {
      setSelectedMessage(null)
      setActionMenuVisible(false)
      setWebDropdownVisible(false)
    } else {
      Alert.alert('Error', result.error ?? 'Delete failed')
    }
  }

  const handleSaveEdit = async (newContent) => {
    setSavingEdit(true)
    const messageId = selectedMessage._id || selectedMessage.id
    const result = await updateMessage(messageId, chatId, newContent)
    setSavingEdit(false)

    if (result.success) {
      Alert.alert('Success', 'Message updated successfully')
      setEditModalVisible(false)
      setSelectedMessage(null)
    } else {
      Alert.alert('Error', result.error || 'Failed to update message')
    }
  }

  const closeActionMenu = () => {
    setActionMenuVisible(false)
    setSelectedMessage(null)
  }

  const closeWebDropdown = () => {
    setWebDropdownVisible(false)
    setSelectedMessage(null)
  }

  const closeEditModal = () => {
    setEditModalVisible(false)
    if (!actionMenuVisible && !webDropdownVisible) {
      setSelectedMessage(null)
    }
  }

  const clearReply = () => {
    setReplyToMessage(null)
  }

  return {
    actionMenuVisible,
    selectedMessage,
    editModalVisible,
    webDropdownVisible,
    dropdownPosition,
    savingEdit,
    replyToMessage,
    handleMessageLongPress,
    handleThreeDotsPress,
    handleReplyMessage,
    handleEditMessage,
    handleDeleteMessage,
    handleSaveEdit,
    closeActionMenu,
    closeWebDropdown,
    closeEditModal,
    clearReply,
  }
}
