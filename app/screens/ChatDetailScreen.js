import React, { useState, useRef, useEffect, useContext } from 'react'
import {
  FlatList,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  View,
  Alert,
  ActionSheetIOS,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import * as MediaLibrary from 'expo-media-library'
import { Camera } from 'expo-camera'
import ChatsContext from '../contexts/ChatsContext'
import useAuthedRequest from '../hooks/useAuthedRequest'
import { useUser } from '../hooks/useUser'
import LoadingIndicator from '../components/LoadingIndicator'

const { width: screenWidth } = Dimensions.get('window')

/* =================== styled components =================== */
const Container = styled.View`
  flex: 1;
  background-color: #f8f9fa;
`

const Header = styled.View`
  background-color: #fff;
  padding: 50px 16px 16px 16px;
  flex-direction: row;
  align-items: center;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 5;
`

const BackButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`

const HeaderAvatar = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${(props) => props.color || '#3498db'};
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`

const HeaderAvatarText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: bold;
`

const HeaderInfo = styled.View`
  flex: 1;
`

const HeaderName = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
`

const HeaderStatus = styled.Text`
  font-size: 14px;
  color: #27ae60;
  margin-top: 2px;
`

const HeaderActions = styled.View`
  flex-direction: row;
`

const HeaderActionButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  justify-content: center;
  align-items: center;
  margin-left: 8px;
  background-color: ${(props) => props.bgColor || 'transparent'};
`

const MessagesContainer = styled.View`
  flex: 1;
  padding: 16px;
`

const MessageBubble = styled.View`
  max-width: ${screenWidth * 0.75}px;
  margin-vertical: 4px;
  padding: 12px 16px;
  border-radius: 20px;
  align-self: ${(props) => (props.isOwn ? 'flex-end' : 'flex-start')};
  background-color: ${(props) => (props.isOwn ? '#3498db' : '#fff')};
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 2;
`

const MessageText = styled.Text`
  font-size: 16px;
  line-height: 20px;
  color: ${(props) => (props.isOwn ? '#fff' : '#2c3e50')};
`

const MessageImage = styled.Image`
  width: ${screenWidth * 0.6}px;
  height: 200px;
  border-radius: 10px;
  margin-top: ${(props) => (props.hasText ? '8px' : '0px')};
  background-color: #f0f0f0;
`

const MessageImageContainer = styled.TouchableOpacity`
  position: relative;
`

const ImageLoadingOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  justify-content: center;
  align-items: center;
  border-radius: 10px;
`

const LoadingText = styled.Text`
  color: white;
  font-size: 12px;
  margin-top: 4px;
`

const MessageVideo = styled.View`
  width: ${screenWidth * 0.6}px;
  height: 200px;
  border-radius: 10px;
  margin-top: 8px;
  background-color: #000;
  justify-content: center;
  align-items: center;
`

const MessageFile = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  margin-top: 8px;
  background-color: ${(props) =>
    props.isOwn ? 'rgba(255, 255, 255, 0.2)' : '#f0f0f0'};
  padding: 10px;
  border-radius: 8px;
`

const FileIcon = styled(Ionicons)`
  margin-right: 8px;
`

const FileText = styled.Text`
  font-size: 14px;
  color: ${(props) => (props.isOwn ? '#fff' : '#2c3e50')};
  flex: 1;
`

const MessageTime = styled.Text`
  font-size: 12px;
  color: ${(props) => (props.isOwn ? 'rgba(255, 255, 255, 0.8)' : '#95a5a6')};
  margin-top: 4px;
  align-self: ${(props) => (props.isOwn ? 'flex-end' : 'flex-start')};
`

const MessageStatus = styled.Text`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 2px;
`

const DateSeparator = styled.View`
  align-items: center;
  margin: 20px 0;
`

const DateText = styled.Text`
  background-color: #e9ecef;
  color: #7f8c8d;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 16px;
  overflow: hidden;
`

const InputContainer = styled.View`
  background-color: #fff;
  padding: 16px;
  flex-direction: row;
  align-items: flex-end;
  border-top-width: 1px;
  border-top-color: #e9ecef;
`

const InputWrapper = styled.View`
  flex: 1;
  max-height: 100px;
  margin-right: 12px;
  background-color: #f8f9fa;
  border-radius: 25px;
  padding: 12px 16px;
  border-width: 1px;
  border-color: #e9ecef;
`

const TextInput = styled.TextInput`
  font-size: 16px;
  color: #2c3e50;
  min-height: 20px;
`

const SendButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: ${(props) => (props.disabled ? '#bdc3c7' : '#3498db')};
  justify-content: center;
  align-items: center;
`

const AttachmentButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  justify-content: center;
  align-items: center;
  margin-right: 8px;
  background-color: #f8f9fa;
`

const CameraButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  justify-content: center;
  align-items: center;
  margin-right: 8px;
  background-color: #f8f9fa;
`

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`

const LoadingTextContainer = styled.Text`
  color: #7f8c8d;
  font-size: 16px;
`

const ErrorContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px;
`

const ErrorText = styled.Text`
  color: #e74c3c;
  font-size: 16px;
  text-align: center;
  margin-bottom: 16px;
`

const RetryButton = styled.TouchableOpacity`
  background-color: #3498db;
  padding: 12px 24px;
  border-radius: 8px;
`

const RetryButtonText = styled.Text`
  color: white;
  font-weight: 600;
`

// Image preview modal components
const ImagePreviewModal = styled.Modal``

const ImagePreviewContainer = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.9);
  justify-content: center;
  align-items: center;
`

const ImagePreviewHeader = styled.View`
  position: absolute;
  top: ${Platform.OS === 'ios' ? '50px' : '30px'};
  left: 0;
  right: 0;
  flex-direction: row;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 1;
`

const CloseButton = styled.TouchableOpacity`
  background-color: rgba(255, 255, 255, 0.2);
  padding: 10px;
  border-radius: 20px;
`

const FullScreenImage = styled.Image`
  width: 100%;
  height: 70%;
`

/* =================== helpers =================== */
const getUserColor = (userId) => {
  const colors = [
    '#3498db',
    '#e74c3c',
    '#f39c12',
    '#27ae60',
    '#9b59b6',
    '#1abc9c',
    '#34495e',
    '#e67e22',
    '#2ecc71',
    '#8e44ad',
    '#16a085',
    '#f1c40f',
  ]
  const index = userId ? userId.toString().charCodeAt(0) % colors.length : 0
  return colors[index]
}

const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatMessageDate = (timestamp) => {
  const date = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString()
}

const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const findUserByAnyId = (users, targetId) => {
  return users.find(
    (u) =>
      u.firebaseUid === targetId ||
      (u._id && u._id.toString()) === targetId ||
      (u.id && u.id.toString()) === targetId
  )
}

const MessageItem = ({
  item,
  previousItem,
  currentUserId,
  users,
  onImagePress,
}) => {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  const showDate =
    !previousItem ||
    formatMessageDate(previousItem.createdAt) !==
      formatMessageDate(item.createdAt)

  const isOwn = item.senderId === currentUserId
  const sender = findUserByAnyId(users, item.senderId)
  const displayName = isOwn ? 'You' : sender?.name || 'Unknown'

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
  }

  const timeString = `${formatMessageTime(item.createdAt)} • ${displayName}`

  return (
    <>
      {showDate && (
        <DateSeparator>
          <DateText>{formatMessageDate(item.createdAt)}</DateText>
        </DateSeparator>
      )}
      <MessageBubble isOwn={isOwn}>
        {/* Render content only if there is valid content to display */}
        {[
          item.content && item.content.trim().length > 0 && (
            <MessageText key="text" isOwn={isOwn}>
              {item.content.trim()}
            </MessageText>
          ),
          item.type === 'image' &&
            item.files &&
            item.files[0] &&
            item.files[0].url && (
              <MessageImageContainer
                key="image"
                onPress={() => onImagePress(item.files[0].url)}
              >
                <MessageImage
                  source={{ uri: item.files[0].url }}
                  hasText={!!(item.content && item.content.trim())}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
                {imageLoading && (
                  <ImageLoadingOverlay>
                    <Ionicons name="image-outline" size={24} color="white" />
                    <LoadingText>Loading...</LoadingText>
                  </ImageLoadingOverlay>
                )}
                {imageError && (
                  <ImageLoadingOverlay>
                    <Ionicons
                      name="alert-circle-outline"
                      size={24}
                      color="white"
                    />
                    <LoadingText>Failed to load</LoadingText>
                  </ImageLoadingOverlay>
                )}
              </MessageImageContainer>
            ),
          item.type === 'video' &&
            item.files &&
            item.files[0] &&
            item.files[0].url && (
              <MessageVideo key="video">
                <Ionicons name="play-circle" size={40} color="white" />
              </MessageVideo>
            ),
          item.type === 'file' &&
            item.files &&
            item.files[0] &&
            item.files[0].url && (
              <MessageFile key="file" isOwn={isOwn}>
                <FileIcon
                  name="document"
                  size={20}
                  color={isOwn ? '#fff' : '#2c3e50'}
                />
                <FileText isOwn={isOwn}>
                  {item.files[0].originalname || 'File'}
                </FileText>
              </MessageFile>
            ),
          item.type === 'audio' &&
            item.files &&
            item.files[0] &&
            item.files[0].url && (
              <MessageFile key="audio" isOwn={isOwn}>
                <FileIcon
                  name="mic"
                  size={20}
                  color={isOwn ? '#fff' : '#2c3e50'}
                />
                <FileText isOwn={isOwn}>
                  {item.files[0].originalname || 'Audio'}
                </FileText>
              </MessageFile>
            ),
          <MessageTime key="time" isOwn={isOwn}>
            {timeString}
          </MessageTime>,
          isOwn && <MessageStatus key="status">✓✓ sent</MessageStatus>,
        ].filter(Boolean)}
      </MessageBubble>
    </>
  )
}

/* =================== main screen =================== */
export default function ChatDetailScreen({ navigation, route }) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState('')
  const flatListRef = useRef(null)

  const { chatId } = route?.params || {}
  const chatsContext = useContext(ChatsContext)
  const { user } = useUser()
  const { isReady, get } = useAuthedRequest()

  const {
    chats = [],
    users = [],
    loadMessages,
    sendMessage: contextSendMessage,
    initiateCall,
  } = chatsContext || {}

  const currentChat = chats.find((chat) => (chat._id || chat.id) === chatId)

  // Get the other user in the chat (not the current user)
  const otherUserId = currentChat?.participants?.find((id) => id !== user?.uid)
  const otherUser = findUserByAnyId(users, otherUserId)

  // Get chat info - simplified for direct messages only
  const getChatInfo = () => {
    if (!otherUser) {
      return {
        name: 'Unknown User',
        status: 'Offline',
        color: '#95a5a6',
      }
    }

    return {
      name: otherUser.name || 'Unknown User',
      status: otherUser.online ? 'Online now' : 'Last seen recently',
      color: getUserColor(otherUser._id || otherUser.id),
    }
  }

  const chatInfo = getChatInfo()

  /* ---------- load messages ---------- */
  const loadChatMessages = async () => {
    if (!chatId) return
    try {
      setLoading(true)
      setError(null)

      const messagesData = await loadMessages(chatId)
      setMessages(messagesData || [])
    } catch (err) {
      console.error('Failed to load messages:', err)
      setError('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  /* ---------- image picker ---------- */
  const requestPermissions = async () => {
    const { status: cameraStatus } =
      await Camera.requestCameraPermissionsAsync()
    const { status: libraryStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync()
    const { status: mediaLibraryStatus } =
      await MediaLibrary.requestPermissionsAsync()

    return {
      camera: cameraStatus === 'granted',
      library: libraryStatus === 'granted',
      mediaLibrary: mediaLibraryStatus === 'granted',
    }
  }

  const showImagePickerOptions = () => {
    const options = [
      'Take Photo',
      'Choose from Library',
      'Choose File',
      'Cancel',
    ]

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 3,
        },
        (buttonIndex) => {
          switch (buttonIndex) {
            case 0:
              takePhoto()
              break
            case 1:
              pickImageFromLibrary()
              break
            case 2:
              pickFile()
              break
          }
        }
      )
    } else {
      Alert.alert('Select Image', 'Choose an option', [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImageFromLibrary },
        { text: 'Choose File', onPress: pickFile },
        { text: 'Cancel', style: 'cancel' },
      ])
    }
  }

  // Replace both sendImageMessage and handleSendMessage with this unified function:

  const handleSendMessage = async (files = []) => {
    // Validate input
    if ((!message.trim() && files.length === 0) || sending || !chatId) return

    try {
      setSending(true)

      let messageType = 'text'
      if (files.length > 0) {
        const fileType = files[0].type || files[0].mimeType
        if (fileType?.startsWith('image/')) messageType = 'image'
        else if (fileType?.startsWith('video/')) messageType = 'video'
        else if (fileType?.startsWith('audio/')) messageType = 'audio'
        else messageType = 'file'
      }

      const result = await contextSendMessage({
        chatId,
        content: message.trim() || undefined,
        files,
        messageType,
      })

      if (result.success) {
        setMessages((prev) => [...prev, result.message])
        setMessage('')
        setTimeout(
          () => flatListRef.current?.scrollToEnd({ animated: true }),
          100
        )
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

  // Updated image picker functions
  const takePhoto = async () => {
    try {
      const permissions = await requestPermissions()
      if (!permissions.camera) {
        Alert.alert('Permission denied', 'Camera permission is required')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0]
        await handleSendMessage([
          {
            uri: asset.uri,
            name: asset.fileName || `photo_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
          },
        ])
      }
    } catch (error) {
      console.error('Take photo error:', error)
      Alert.alert('Error', 'Failed to take photo')
    }
  }

  const pickImageFromLibrary = async () => {
    try {
      const permissions = await requestPermissions()
      if (!permissions.library) {
        Alert.alert('Permission denied', 'Media library permission is required')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0]
        await handleSendMessage([
          {
            uri: asset.uri,
            name: asset.fileName || `image_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
          },
        ])
      }
    } catch (error) {
      console.error('Pick image error:', error)
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'video/*', 'audio/*', 'application/pdf'],
        multiple: false,
      })

      if (result.canceled || !result.assets?.length) {
        return
      }

      const asset = result.assets[0]
      if (!asset?.uri) {
        Alert.alert('Error', 'Invalid file selected')
        return
      }

      await handleSendMessage([
        {
          uri: asset.uri,
          name: asset.name || `file_${Date.now()}`,
          type: asset.mimeType || 'application/octet-stream',
        },
      ])
    } catch (err) {
      console.error('File picker error:', err)
      Alert.alert('Error', 'Failed to pick file')
    }
  }

  /* ---------- call functions ---------- */
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
        })
      } else {
        Alert.alert('Error', 'Failed to start audio call')
      }
    } catch (error) {
      console.error('Start audio call error:', error)
      Alert.alert('Error', 'Failed to start audio call')
    }
  }

  /* ---------- image preview ---------- */
  const handleImagePress = (imageUrl) => {
    setPreviewImageUrl(imageUrl)
    setImagePreviewVisible(true)
  }

  const closeImagePreview = () => {
    setImagePreviewVisible(false)
    setPreviewImageUrl('')
  }

  useEffect(() => {
    loadChatMessages()
  }, [chatId])

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100
      )
    }
  }, [messages.length])

  const handleBack = () => navigation.goBack()

  /* ---------- render ---------- */
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
        <Header>
          <BackButton onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </BackButton>
          <HeaderAvatar color={chatInfo.color}>
            <HeaderAvatarText>{getInitials(chatInfo.name)}</HeaderAvatarText>
          </HeaderAvatar>
          <HeaderInfo>
            <HeaderName>{chatInfo.name}</HeaderName>
            <HeaderStatus>Loading...</HeaderStatus>
          </HeaderInfo>
        </Header>
        <LoadingContainer>
          <LoadingIndicator
            type="pulse"
            size="large"
            showText={true}
            text="Loading messages..."
            showCard={true}
            subtext="Please wait while we sync your messages"
          />
        </LoadingContainer>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Header>
          <BackButton onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </BackButton>
          <HeaderAvatar color={chatInfo.color}>
            <HeaderAvatarText>{getInitials(chatInfo.name)}</HeaderAvatarText>
          </HeaderAvatar>
          <HeaderInfo>
            <HeaderName>{chatInfo.name}</HeaderName>
            <HeaderStatus>Error</HeaderStatus>
          </HeaderInfo>
        </Header>
        <ErrorContainer>
          <ErrorText>{error}</ErrorText>
          <RetryButton onPress={loadChatMessages}>
            <RetryButtonText>Retry</RetryButtonText>
          </RetryButton>
        </ErrorContainer>
      </Container>
    )
  }

  return (
    <Container>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Header>
        <BackButton onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </BackButton>
        <HeaderAvatar color={chatInfo.color}>
          <HeaderAvatarText>{getInitials(chatInfo.name)}</HeaderAvatarText>
        </HeaderAvatar>
        <HeaderInfo>
          <HeaderName>{chatInfo.name}</HeaderName>
          <HeaderStatus>{chatInfo.status}</HeaderStatus>
        </HeaderInfo>
        <HeaderActions>
          <HeaderActionButton onPress={startVideoCall} bgColor="#e8f5e8">
            <Ionicons name="videocam" size={24} color="#27ae60" />
          </HeaderActionButton>
          <HeaderActionButton onPress={startAudioCall} bgColor="#e8f4fd">
            <Ionicons name="call" size={24} color="#3498db" />
          </HeaderActionButton>
        </HeaderActions>
      </Header>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <MessagesContainer>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => (item._id || item.id).toString()}
            renderItem={({ item, index }) => (
              <MessageItem
                item={item}
                previousItem={index > 0 ? messages[index - 1] : null}
                currentUserId={user?.uid}
                users={users}
                onImagePress={handleImagePress}
              />
            )}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={() => (
              <ErrorContainer>
                <ErrorText>No messages yet. Start the conversation!</ErrorText>
              </ErrorContainer>
            )}
          />
        </MessagesContainer>

        <InputContainer>
          <CameraButton onPress={showImagePickerOptions}>
            <Ionicons name="camera" size={24} color="#7f8c8d" />
          </CameraButton>
          <AttachmentButton onPress={pickFile}>
            <Ionicons name="attach" size={24} color="#7f8c8d" />
          </AttachmentButton>
          <InputWrapper>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              placeholderTextColor="#bdc3c7"
              multiline
              textAlignVertical="center"
              editable={!sending}
            />
          </InputWrapper>
          {/* <SendButton
            disabled={!message.trim() || sending}
            onPress={handleSendMessage}
          >
            <Ionicons
              name={sending ? 'hourglass' : 'send'}
              size={20}
              color="#fff"
            />
          </SendButton> */}
          <SendButton
            disabled={!message.trim() || sending}
            onPress={() => handleSendMessage()}
          >
            <Ionicons
              name={sending ? 'hourglass' : 'send'}
              size={20}
              color="#fff"
            />
          </SendButton>
        </InputContainer>
      </KeyboardAvoidingView>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        visible={imagePreviewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImagePreview}
      >
        <ImagePreviewContainer>
          <ImagePreviewHeader>
            <View />
            <CloseButton onPress={closeImagePreview}>
              <Ionicons name="close" size={24} color="white" />
            </CloseButton>
          </ImagePreviewHeader>
          <FullScreenImage
            source={{ uri: previewImageUrl }}
            resizeMode="contain"
          />
        </ImagePreviewContainer>
      </ImagePreviewModal>
    </Container>
  )
}
