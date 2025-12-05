import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from 'react'
import {
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActionSheetIOS,
} from 'react-native'
import { Container } from '../styles/chatStyles'
import { ChatHeader } from '../components/chat/ChatHeader'
import { MessageList } from '../components/chat/MessageList'
import { ChatInput } from '../components/chat/ChatInput'
import { SelectedFilesBar } from '../components/chat/SelectedFilesBar'
import { AudioRecorder } from '../components/chat/AudioRecorder'
import { ImagePreviewModal } from '../components/chat/ImagePreviewModal'
import {
  MessageActionMenu,
  EditMessageModal,
  WebMessageDropdown,
} from '../components/MessageActions'
import LoadingIndicator from '../components/LoadingIndicator'
import {
  ErrorContainer,
  ErrorText,
  RetryButton,
  RetryButtonText,
} from '../styles/chatStyles'
import ChatsContext from '../contexts/ChatsContext'
import { useUser } from '../hooks/useUser'
import useChatHelpers from '../hooks/useChatHelpers'
import { useChatMessages } from '../hooks/useChatMessages'
import { useMediaPicker } from '../hooks/useMediaPicker'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { useMessageActions } from '../hooks/useMessageActions'
import { getUserColor, getInitials } from '../utils/chatHelpers'
import { useUserProfile } from '../providers/UserProfileProvider'

export default function ChatDetailScreen({
  navigation,
  route,
  isInSidebar = false,
}) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState('')
  const [hoveredMessageId, setHoveredMessageId] = useState(null)

  const { chatId } = route?.params || {}
  const chatsContext = useContext(ChatsContext)
  const { user } = useUser()

  const [otherUserAvatar, setOtherUserAvatar] = useState(null)

  const { getOtherUserAvatar } = useUserProfile()

  const {
    handleTypingInput,
    stopTyping,
    getTypingText,
    isTyping,
    checkUserOnline,
    getStatusText,
    getOtherUser,
    wsConnected,
    updateLastSeen,
    getLastSeenText,
  } = useChatHelpers(chatId)

  const {
    chats = [],
    users = [],
    sendMessage: contextSendMessage,
    updateMessage,
    deleteMessage,
    initiateCall,
    deleteCallLog,
  } = chatsContext || {}

  const {
    messages,
    callLogs,
    combinedItems,
    loading,
    error,
    loadChatMessages,
    setCallLogs,
  } = useChatMessages(chatId)

  const {
    selectedFiles,
    takePhoto,
    recordVideo,
    pickImageFromLibrary,
    pickFile,
    pickMultipleFiles,
    addFiles,
    removeFile,
    clearFiles,
  } = useMediaPicker()

  const {
    recordingDuration,
    showRecordingUI,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder()

  const {
    actionMenuVisible,
    selectedMessage,
    editModalVisible,
    webDropdownVisible,
    dropdownPosition,
    savingEdit,
    handleMessageLongPress,
    handleThreeDotsPress,
    handleEditMessage,
    handleDeleteMessage,
    handleSaveEdit,
    closeActionMenu,
    closeWebDropdown,
    closeEditModal,
  } = useMessageActions(chatId, updateMessage, deleteMessage)

  const currentChat = chats.find((chat) => (chat._id || chat.id) === chatId)
  const otherUserId = currentChat?.participants?.find((id) => id !== user?.uid)
  const otherUser = getOtherUser(user?.uid)

  useEffect(() => {
    const loadOtherUserAvatar = async () => {
      if (otherUserId) {
        try {
          const avatar = await getOtherUserAvatar(otherUserId)
          setOtherUserAvatar(avatar)
        } catch (error) {
          console.error('Failed to load other user avatar:', error)
          setOtherUserAvatar(null)
        }
      }
    }

    loadOtherUserAvatar()
  }, [otherUserId, getOtherUserAvatar])

  const getChatInfo = () => {
    if (!otherUser) {
      return {
        name: 'Unknown User',
        status: 'Last seen recently',
        color: '#95a5a6',
        isOnline: false,
      }
    }

    const userId = otherUser.firebaseUid || otherUser._id
    const isOnline = checkUserOnline(userId)

    let statusText
    if (isOnline) {
      statusText = getStatusText(userId)
    } else {
      const lastSeenText = getLastSeenText(userId)
      statusText =
        lastSeenText !== 'Unknown'
          ? `Last seen ${lastSeenText}`
          : 'Last seen recently'
    }

    return {
      name: otherUser.name || 'Unknown User',
      status: statusText,
      color: getUserColor(otherUser._id || otherUser.id),
      isOnline,
      avatar: otherUserAvatar,
    }
  }

  const chatInfo = getChatInfo()

  useEffect(() => {
    if (chatId && !loading) {
      updateLastSeen(chatId)
      const interval = setInterval(() => {
        updateLastSeen(chatId)
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [chatId, loading, updateLastSeen])

  const handleMessageChange = (text) => {
    handleTypingInput(text, setMessage)
  }

  const handleSendMessage = async (files = []) => {
    const filesToSend = files.length > 0 ? files : selectedFiles

    if ((!message.trim() && filesToSend.length === 0) || sending || !chatId)
      return

    try {
      setSending(true)

      let messageType = 'text'
      if (filesToSend.length > 0) {
        const fileType = filesToSend[0].type || filesToSend[0].mimeType
        if (fileType?.startsWith('image/')) messageType = 'image'
        else if (fileType?.startsWith('video/')) messageType = 'video'
        else if (fileType?.startsWith('audio/')) messageType = 'audio'
        else messageType = 'file'
      }

      const result = await contextSendMessage({
        chatId,
        content: message.trim() || undefined,
        files: filesToSend,
        messageType,
      })

      if (result.success) {
        setMessage('')
        clearFiles()
        stopTyping()
      } else {
        Alert.alert('Error', result.error || 'Failed to send message')
      }
    } catch (err) {
      console.error('Send message error:', err)
      Alert.alert('Error', 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const showImagePickerOptions = () => {
    const options = [
      'Take Photo',
      'Record Video',
      'Choose from Library',
      'Choose File',
      'Cancel',
    ]

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 4 },
        async (buttonIndex) => {
          let file = null
          switch (buttonIndex) {
            case 0:
              file = await takePhoto()
              break
            case 1:
              file = await recordVideo()
              break
            case 2:
              file = await pickImageFromLibrary()
              break
            case 3:
              file = await pickFile()
              break
          }
          if (file) await handleSendMessage([file])
        }
      )
    } else {
      Alert.alert('Select Media', 'Choose an option', [
        {
          text: 'Take Photo',
          onPress: async () => {
            const file = await takePhoto()
            if (file) await handleSendMessage([file])
          },
        },
        {
          text: 'Record Video',
          onPress: async () => {
            const file = await recordVideo()
            if (file) await handleSendMessage([file])
          },
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            const file = await pickImageFromLibrary()
            if (file) await handleSendMessage([file])
          },
        },
        {
          text: 'Choose File',
          onPress: async () => {
            const file = await pickFile()
            if (file) await handleSendMessage([file])
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ])
    }
  }

  const handleAttach = async () => {
    const files = await pickMultipleFiles()
    if (files.length > 0) {
      addFiles(files)
    }
  }

  const sendRecording = async () => {
    const recordingData = await stopRecording()
    if (!recordingData) {
      Alert.alert('Error', 'No recording data available')
      return
    }

    try {
      if (Platform.OS === 'web') {
        await handleSendMessage([
          {
            uri: recordingData.url,
            name: recordingData.name,
            type: recordingData.type,
            blob: recordingData.blob,
          },
        ])
      } else {
        await handleSendMessage([
          {
            uri: recordingData.uri,
            name: recordingData.name,
            type: recordingData.type,
          },
        ])
      }
    } catch (error) {
      console.error('Failed to send recording:', error)
      Alert.alert('Error', 'Failed to send recording')
    }
  }

  const startVideoCall = async () => {
    if (!otherUser || !chatId) {
      Alert.alert('Error', 'Cannot start call')
      return
    }

    try {
      const result = await initiateCall({
        chatId,
        callType: 'video',
        recipientId: otherUserId,
      })

      if (result.success) {
        navigation.navigate('CallScreen', {
          chatId,
          remoteUserId: otherUserId,
          remoteUserName: otherUser.name,
          callType: 'video',
          isIncoming: false,
          callId: result.call._id.toString(),
        })
      } else {
        Alert.alert('Error', 'Failed to start video call')
      }
    } catch (error) {
      console.error('Start video call error:', error)
      Alert.alert('Error', 'Failed to start video call')
    }
  }

  const startAudioCall = async () => {
    if (!otherUser || !chatId) {
      Alert.alert('Error', 'Cannot start call')
      return
    }

    try {
      const result = await initiateCall({
        chatId,
        callType: 'voice',
        recipientId: otherUserId,
      })

      if (result.success) {
        navigation.navigate('CallScreen', {
          chatId,
          remoteUserId: otherUserId,
          remoteUserName: otherUser.name,
          callType: 'voice',
          isIncoming: false,
          callId: result.call._id.toString(),
        })
      } else {
        Alert.alert('Error', 'Failed to start audio call')
      }
    } catch (error) {
      console.error('Start audio call error:', error)
      Alert.alert('Error', 'Failed to start audio call')
    }
  }

  const handleCallCallback = async (callLog) => {
    if (!otherUser || !chatId) {
      Alert.alert('Error', 'Cannot start call')
      return
    }

    try {
      const result = await initiateCall({
        chatId,
        callType: callLog.callType,
        recipientId: otherUserId,
      })

      if (result.success) {
        navigation.navigate('CallScreen', {
          chatId,
          remoteUserId: otherUserId,
          remoteUserName: otherUser.name,
          callType: callLog.callType,
        })
      } else {
        Alert.alert('Error', 'Failed to start call')
      }
    } catch (error) {
      console.error('Start call error:', error)
      Alert.alert('Error', 'Failed to start call')
    }
  }

  const handleDeleteCallLog = async (callLog) => {
    const callId = callLog._id || callLog.id

    const confirmed =
      Platform.OS === 'web'
        ? window.confirm('Are you sure you want to delete this call log?')
        : await new Promise((resolve) => {
            Alert.alert(
              'Delete Call Log',
              'Are you sure you want to delete this call log?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => resolve(false),
                },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => resolve(true),
                },
              ]
            )
          })

    if (!confirmed) return

    const result = await deleteCallLog(callId)
    if (result.success) {
      setCallLogs((prev) => prev.filter((c) => (c._id || c.id) !== callId))
      if (Platform.OS === 'web') {
        alert('Call log deleted successfully')
      } else {
        Alert.alert('Success', 'Call log deleted')
      }
    } else {
      if (Platform.OS === 'web') {
        alert(result.error || 'Failed to delete call log')
      } else {
        Alert.alert('Error', result.error || 'Failed to delete call log')
      }
    }
  }

  const handleImagePress = (imageUrl) => {
    setPreviewImageUrl(imageUrl)
    setImagePreviewVisible(true)
  }

  const closeImagePreview = () => {
    setImagePreviewVisible(false)
    setPreviewImageUrl('')
  }

  const navigateToProfile = () => {
    if (otherUser && otherUserId) {
      navigation.navigate('ViewProfile', {
        userId: otherUserId,
        chatId: chatId,
      })
    }
  }

  const handleBack = useCallback(() => {
    if (isInSidebar && Platform.OS === 'web') {
      if (window?.history) {
        window.history.pushState({}, '', '/chats')
      }
      return
    }

    if (navigation?.goBack) {
      navigation.goBack()
    }
  }, [isInSidebar, navigation])

  const showBackButton = useMemo(() => {
    return !(Platform.OS === 'web' && isInSidebar)
  }, [isInSidebar])

  // Render loading state
  if (!chatId) {
    return (
      <Container>
        <ErrorContainer>
          <ErrorText>Invalid chat selected</ErrorText>
          <RetryButton onPress={handleBack}>
            <RetryButtonText>Go Back</RetryButtonText>
          </RetryButton>
        </ErrorContainer>
      </Container>
    )
  }

  if (loading) {
    return (
      <Container>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ChatHeader
          showBackButton={showBackButton}
          onBack={handleBack}
          chatInfo={chatInfo}
          wsConnected={wsConnected}
          onProfilePress={navigateToProfile}
          onVideoCall={startVideoCall}
          onAudioCall={startAudioCall}
        />
        <LoadingIndicator
          type="pulse"
          size="large"
          showText={true}
          text="Loading messages..."
          showCard={false}
          subtext="Please wait while we sync your messages"
        />
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ChatHeader
          showBackButton={showBackButton}
          onBack={handleBack}
          chatInfo={chatInfo}
          wsConnected={wsConnected}
          onProfilePress={navigateToProfile}
          onVideoCall={startVideoCall}
          onAudioCall={startAudioCall}
        />
        <ErrorContainer>
          <ErrorText>{error}</ErrorText>
          <RetryButton onPress={loadChatMessages}>
            <RetryButtonText>Retry</RetryButtonText>
          </RetryButton>
        </ErrorContainer>
      </Container>
    )
  }

  // Main render
  return (
    <Container>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ChatHeader
        showBackButton={showBackButton}
        onBack={handleBack}
        chatInfo={chatInfo}
        wsConnected={wsConnected}
        onProfilePress={navigateToProfile}
        onVideoCall={startVideoCall}
        onAudioCall={startAudioCall}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <MessageList
          combinedItems={combinedItems}
          currentUserId={user?.uid}
          users={users}
          navigation={navigation}
          onImagePress={handleImagePress}
          onMessageLongPress={handleMessageLongPress}
          onThreeDotsPress={handleThreeDotsPress}
          hoveredMessageId={hoveredMessageId}
          setHoveredMessageId={setHoveredMessageId}
          onCallCallback={handleCallCallback}
          onDeleteCallLog={handleDeleteCallLog}
          isTyping={isTyping}
          typingText={getTypingText()}
        />

        <SelectedFilesBar files={selectedFiles} onRemoveFile={removeFile} />

        {!showRecordingUI && (
          <ChatInput
            message={message}
            onMessageChange={handleMessageChange}
            onBlur={stopTyping}
            onSend={
              selectedFiles.length > 0
                ? () => handleSendMessage()
                : handleSendMessage
            }
            onCamera={showImagePickerOptions}
            onAttach={handleAttach}
            onMicrophone={startRecording}
            sending={sending}
            hasFiles={selectedFiles.length > 0}
          />
        )}

        {showRecordingUI && (
          <AudioRecorder
            duration={recordingDuration}
            onCancel={cancelRecording}
            onStop={stopRecording}
            onSend={sendRecording}
          />
        )}
      </KeyboardAvoidingView>

      <ImagePreviewModal
        visible={imagePreviewVisible}
        imageUrl={previewImageUrl}
        onClose={closeImagePreview}
      />

      <MessageActionMenu
        visible={actionMenuVisible}
        onClose={closeActionMenu}
        onEdit={handleEditMessage}
        onDelete={handleDeleteMessage}
      />

      {Platform.OS === 'web' && webDropdownVisible && (
        <WebMessageDropdown
          visible={true}
          onClose={closeWebDropdown}
          position={dropdownPosition}
          onEdit={handleEditMessage}
          onDelete={handleDeleteMessage}
        />
      )}

      <EditMessageModal
        visible={editModalVisible}
        onClose={closeEditModal}
        initialContent={selectedMessage?.content || ''}
        onSave={handleSaveEdit}
        saving={savingEdit}
      />
    </Container>
  )
}
