import React, { useState } from 'react'
import {
  FlatList,
  Platform,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  View,
  Animated,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as ImagePicker from 'expo-image-picker'
import { Swipeable } from 'react-native-gesture-handler'

/* =================== Styled Components =================== */
const Column = styled.View`
  flex: ${(props) => props.flex || 1};
  background-color: #f8fafc;
  border-right-width: ${(props) => (props.borderRight ? '1px' : '0px')};
  border-right-color: #e2e8f0;
  position: relative;
`

const Header = styled.View`
  background-color: white;
  padding: 20px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-bottom-width: 1px;
  border-bottom-color: #e2e8f0;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.08;
  shadow-radius: 8px;
  elevation: 3;
`

const HeaderTitle = styled.Text`
  font-size: 28px;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: -0.5px;
`

const HeaderSubtitle = styled.Text`
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
  font-weight: 500;
`

const CameraButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: #3b82f6;
  justify-content: center;
  align-items: center;
  shadow-color: #3b82f6;
  shadow-offset: 0px 3px;
  shadow-opacity: 0.3;
  shadow-radius: 6px;
  elevation: 4;
`

const SearchContainer = styled.View`
  padding: 16px;
  background-color: #f8fafc;
`

const SearchInputWrapper = styled.View`
  position: relative;
`

const SearchInput = styled.TextInput`
  background-color: #fff;
  border-radius: 16px;
  padding: 12px 16px 12px 44px;
  font-size: 15px;
  color: #1e293b;
  border-width: 1px;
  border-color: #e2e8f0;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.05;
  shadow-radius: 3px;
  elevation: 1;
`

const SearchIcon = styled.View`
  position: absolute;
  left: 14px;
  top: 50%;
  margin-top: -10px;
  z-index: 1;
`

const ChatList = styled.FlatList`
  flex: 1;
  background-color: #f8fafc;
  padding: 0 12px;
`

const ChatItemContainer = styled.View`
  position: relative;
  margin-bottom: 12px;
`

const ChatItem = styled.TouchableOpacity`
  background-color: #fff;
  border-radius: 16px;
  padding: 16px;
  border-width: 1px;
  border-color: #e2e8f0;
  flex-direction: row;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.08;
  shadow-radius: 8px;
  elevation: 3;
`

const ChatAvatar = styled.View`
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background-color: ${(props) => props.color || '#3b82f6'};
  justify-content: center;
  align-items: center;
  margin-right: 14px;
  position: relative;
  shadow-color: ${(props) => props.color || '#3b82f6'};
  shadow-offset: 0px 2px;
  shadow-opacity: 0.3;
  shadow-radius: 4px;
  elevation: 3;
`

const ChatAvatarText = styled.Text`
  color: white;
  font-size: 22px;
  font-weight: 700;
`

const ChatAvatarImage = styled.Image`
  width: 56px;
  height: 56px;
  border-radius: 28px;
`

const OnlineDot = styled.View`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 14px;
  height: 14px;
  border-radius: 7px;
  background-color: #10b981;
  border-width: 3px;
  border-color: #fff;
`

const ChatInfo = styled.View`
  flex: 1;
  margin-right: 8px;
`

const ChatNameRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
`

const ChatName = styled.Text`
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  flex: 1;
`

const ChatTime = styled.Text`
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  margin-left: 8px;
`

const ChatLastMessage = styled.Text`
  font-size: 14px;
  color: ${(props) => (props.isTyping ? '#3b82f6' : '#64748b')};
  line-height: 20px;
  font-style: ${(props) => (props.isTyping ? 'italic' : 'normal')};
  font-weight: 500;
`

const UnreadBadge = styled.View`
  background-color: #3b82f6;
  border-radius: 12px;
  min-width: 24px;
  height: 24px;
  justify-content: center;
  align-items: center;
  padding: 0 8px;
  margin-left: 8px;
  shadow-color: #3b82f6;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.3;
  shadow-radius: 4px;
  elevation: 3;
`

const UnreadText = styled.Text`
  color: #fff;
  font-size: 12px;
  font-weight: 700;
`

const EmptyState = styled.View`
  padding: 60px 24px;
  align-items: center;
  justify-content: center;
`

const EmptyIconWrapper = styled.View`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  background-color: #f1f5f9;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
`

const EmptyStateTitle = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
`

const EmptyStateText = styled.Text`
  font-size: 14px;
  color: #64748b;
  text-align: center;
  font-weight: 500;
  line-height: 20px;
`

const OptionsButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: #f1f5f9;
  justify-content: center;
  align-items: center;
  margin-left: 8px;
`

const DropdownMenu = styled.View`
  position: absolute;
  right: 16px;
  top: 70px;
  background-color: white;
  border-radius: 12px;
  padding: 8px 0;
  min-width: 180px;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.15;
  shadow-radius: 12px;
  elevation: 8;
  border: 1px solid #e2e8f0;
  z-index: 1000;
`

const DropdownItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 12px 16px;
  background-color: ${(props) => (props.danger ? '#fef2f2' : 'transparent')};
`

const DropdownItemText = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: ${(props) => (props.danger ? '#dc2626' : '#1e293b')};
  margin-left: 12px;
`

const FloatingActionButton = styled.TouchableOpacity`
  position: absolute;
  right: 20px;
  bottom: 24px;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: #3b82f6;
  justify-content: center;
  align-items: center;
  shadow-color: #3b82f6;
  shadow-offset: 0px 6px;
  shadow-opacity: 0.4;
  shadow-radius: 12px;
  elevation: 8;
  z-index: 999;
`

// Swipe Action Components
const SwipeActionContainer = styled(Animated.View)`
  flex: 1;
  justify-content: center;
  align-items: flex-end;
  padding-right: 20px;
`

const DeleteButton = styled.TouchableOpacity`
  background-color: #dc2626;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 100%;
  border-radius: 16px;
`

// Modal Components
const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
`

const ModalContent = styled.View`
  background-color: #fff;
  border-radius: 20px;
  width: 85%;
  max-width: 350px;
  padding: 24px;
  shadow-color: #000;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.25;
  shadow-radius: 16px;
  elevation: 10;
`

const ModalTitle = styled.Text`
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  text-align: center;
  margin-bottom: 8px;
`

const ModalSubtitle = styled.Text`
  font-size: 14px;
  color: #64748b;
  text-align: center;
  margin-bottom: 24px;
  font-weight: 500;
`

const ModalButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  border-radius: 16px;
  background-color: ${(props) => props.bgColor || '#f8fafc'};
  margin-bottom: 12px;
  border-width: 1px;
  border-color: ${(props) => props.borderColor || '#e2e8f0'};
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.05;
  shadow-radius: 4px;
  elevation: 2;
`

const ModalButtonText = styled.Text`
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => props.color || '#1e293b'};
  margin-left: 12px;
`

const ModalCancelButton = styled.TouchableOpacity`
  padding: 16px;
  align-items: center;
`

const ModalCancelText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #64748b;
`

const LoadingOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  justify-content: center;
  align-items: center;
  z-index: 9999;
`

const LoadingContent = styled.View`
  background-color: #fff;
  border-radius: 20px;
  padding: 32px;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.3;
  shadow-radius: 16px;
  elevation: 10;
`

const LoadingText = styled.Text`
  color: #1e293b;
  font-size: 16px;
  margin-top: 16px;
  font-weight: 600;
`

/* =================== Helper Functions =================== */
const getUserColor = (userId) => {
  const colors = [
    '#3b82f6',
    '#ef4444',
    '#f59e0b',
    '#10b981',
    '#8b5cf6',
    '#06b6d4',
    '#64748b',
    '#f97316',
    '#22c55e',
    '#a855f7',
  ]
  const index = userId ? userId.toString().charCodeAt(0) % colors.length : 0
  return colors[index]
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

const formatChatTime = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diff = now - d

  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const getLastMessageText = (lastMessage) => {
  if (!lastMessage) return null
  if (typeof lastMessage === 'string') return lastMessage
  if (typeof lastMessage === 'object' && lastMessage.content)
    return lastMessage.content
  return null
}

const findUserByAnyId = (users, userId) => {
  if (!userId || !users) return null
  return (
    users.find(
      (u) =>
        u._id === userId ||
        u.id === userId ||
        u.firebaseUid === userId ||
        u.uid === userId
    ) || null
  )
}

/* =================== Camera Action Modal =================== */
const CameraActionModal = ({ visible, onClose, onCamera, onGallery }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <TouchableWithoutFeedback onPress={onClose}>
      <ModalOverlay>
        <TouchableWithoutFeedback>
          <ModalContent>
            <ModalTitle>Upload Status</ModalTitle>
            <ModalSubtitle>
              Choose how you want to add your status
            </ModalSubtitle>
            <ModalButton
              bgColor="#eff6ff"
              borderColor="#bfdbfe"
              onPress={onCamera}
            >
              <Ionicons name="camera" size={24} color="#3b82f6" />
              <ModalButtonText color="#3b82f6">Take Photo</ModalButtonText>
            </ModalButton>
            <ModalButton
              bgColor="#f0fdf4"
              borderColor="#bbf7d0"
              onPress={onGallery}
            >
              <Ionicons name="images" size={24} color="#10b981" />
              <ModalButtonText color="#10b981">
                Choose from Gallery
              </ModalButtonText>
            </ModalButton>
            <ModalCancelButton onPress={onClose}>
              <ModalCancelText>Cancel</ModalCancelText>
            </ModalCancelButton>
          </ModalContent>
        </TouchableWithoutFeedback>
      </ModalOverlay>
    </TouchableWithoutFeedback>
  </Modal>
)

/* =================== Main Component =================== */
export default function SharedChatsSidebar({
  chats = [],
  selectedChatId,
  onSelectChat,
  currentUser,
  isUserOnline,
  users = [],
  onNewChat,
  onDeleteChat,
  onUploadStatus,
  getTypingUsersForChat,
  showFAB = true,
  showCameraButton = true,
  showOptionsButton = true,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [cameraModalVisible, setCameraModalVisible] = useState(false)
  const [uploading, setUploading] = useState(false)
  const swipeableRefs = React.useRef({})

  const filteredChats = chats.filter((chat) => {
    const otherParticipant = chat.participants?.find(
      (p) => p !== currentUser?.uid
    )

    const otherUser =
      chat.participantDetails?.[otherParticipant] ||
      findUserByAnyId(users, otherParticipant)

    const name = otherUser?.name || otherUser?.displayName || 'Unknown'
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  /* =================== Camera & Upload Handlers =================== */

  const handleCameraPress = () => {
    setCameraModalVisible(true)
  }

  const handleTakePhoto = async () => {
    setCameraModalVisible(false)

    if (Platform.OS === 'web') {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*,video/*'
      input.capture = 'environment'
      input.onchange = async (e) => {
        const file = e.target.files[0]
        if (file) {
          const uri = URL.createObjectURL(file)
          await uploadStatus({ uri, type: file.type, fileName: file.name })
        }
      }
      input.click()
      return
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to take photos')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
      allowsEditing: true,
    })

    if (!result.canceled && result.assets[0]) {
      await uploadStatus(result.assets[0])
    }
  }

  const handleChooseFromGallery = async () => {
    setCameraModalVisible(false)

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to choose images')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
      allowsEditing: true,
    })

    if (!result.canceled && result.assets[0]) {
      await uploadStatus(result.assets[0])
    }
  }

  const uploadStatus = async (asset) => {
    if (!onUploadStatus) {
      Alert.alert('Error', 'Upload function not available')
      return
    }

    setUploading(true)
    try {
      await onUploadStatus(asset)
      Alert.alert('Success', 'Status uploaded successfully!')
    } catch (error) {
      console.error('Failed to upload status:', error)
      if (error.status === 429 || error.message?.includes('Daily limit')) {
        Alert.alert(
          'Daily Limit Reached',
          'You can only post 5 statuses per day. Try again tomorrow!'
        )
      } else {
        Alert.alert('Error', error.message || 'Failed to upload status')
      }
    } finally {
      setUploading(false)
    }
  }

  /* =================== Delete Chat Handlers =================== */

  const handleOptionsPress = (chat) => {
    const chatId = chat._id || chat.id
    setActiveDropdown(activeDropdown === chatId ? null : chatId)
  }

  const handleDeleteChat = (chat) => {
    const chatId = chat._id || chat.id
    const otherParticipant = chat.participants?.find(
      (p) => p !== currentUser?.uid
    )
    const otherUser = findUserByAnyId(users, otherParticipant)
    const chatName = otherUser?.name || 'Unknown'

    setActiveDropdown(null)

    if (swipeableRefs.current[chatId]) {
      swipeableRefs.current[chatId].close()
    }

    if (Platform.OS === 'web') {
      if (
        window.confirm(`Delete chat with ${chatName}? This cannot be undone.`)
      ) {
        performDeleteChat(chatId, chatName)
      }
    } else {
      Alert.alert(
        'Delete Chat',
        `Delete chat with ${chatName}? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => performDeleteChat(chatId, chatName),
          },
        ]
      )
    }
  }

  const performDeleteChat = async (chatId, chatName) => {
    if (!onDeleteChat) {
      Alert.alert('Error', 'Delete function not available')
      return
    }

    try {
      const result = await onDeleteChat(chatId)
      if (result && result.success) {
        if (Platform.OS !== 'web') {
          Alert.alert('Success', 'Chat deleted successfully')
        }
      } else if (result && result.error) {
        Alert.alert('Error', result.error || 'Failed to delete chat')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete chat: ' + error.message)
    }
  }

  /* =================== Swipe Actions for Mobile =================== */

  const renderRightActions = (progress, dragX, chat) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    })

    return (
      <SwipeActionContainer style={{ transform: [{ translateX: trans }] }}>
        <DeleteButton onPress={() => handleDeleteChat(chat)}>
          <Ionicons name="trash-outline" size={24} color="#fff" />
        </DeleteButton>
      </SwipeActionContainer>
    )
  }

  /* =================== Render Chat Item =================== */

  const renderChatItem = ({ item }) => {
    const otherParticipant = item.participants?.find(
      (p) => p !== currentUser?.uid
    )

    const otherUser =
      item.participantDetails?.[otherParticipant] ||
      findUserByAnyId(users, otherParticipant)

    const isOnline = isUserOnline(otherParticipant)
    const userColor = getUserColor(otherParticipant)
    const isActive = selectedChatId === (item._id || item.id)
    const userName = otherUser?.name || otherUser?.displayName || 'Unknown User'
    const chatId = item._id || item.id

    const typingUsers = getTypingUsersForChat
      ? getTypingUsersForChat(chatId)
      : []
    const isTyping = typingUsers.length > 0

    let typingText = ''
    if (isTyping) {
      if (typingUsers.length === 1) {
        typingText = `Typing...`
      } else {
        typingText = `${typingUsers.length} people are typing...`
      }
    }

    const lastMessage = item.lastMessage
    const isOwn = lastMessage?.senderId === currentUser?.uid
    const lastMessageText = getLastMessageText(lastMessage)

    const messagePreview = isTyping
      ? typingText
      : lastMessage && lastMessageText
      ? `${isOwn ? 'You: ' : ''}${lastMessageText}`
      : 'No messages yet'

    const chatItemContent = (
      <ChatItemContainer>
        <ChatItem
          active={isActive}
          onPress={() => onSelectChat(item)}
          onLongPress={() => Platform.OS !== 'web' && handleDeleteChat(item)}
          delayLongPress={500}
          activeOpacity={0.7}
        >
          <ChatAvatar color={userColor}>
            {otherUser?.photoURL ? (
              <ChatAvatarImage source={{ uri: otherUser.photoURL }} />
            ) : (
              <ChatAvatarText>{getInitials(userName)}</ChatAvatarText>
            )}
            {isOnline && <OnlineDot />}
          </ChatAvatar>

          <ChatInfo>
            <ChatNameRow>
              <ChatName numberOfLines={1}>{userName}</ChatName>
              {!isTyping && (
                <ChatTime>
                  {formatChatTime(item.lastMessage?.createdAt)}
                </ChatTime>
              )}
            </ChatNameRow>
            <ChatLastMessage numberOfLines={1} isTyping={isTyping}>
              {messagePreview}
            </ChatLastMessage>
          </ChatInfo>

          {item.unreadCount > 0 && !isTyping && (
            <UnreadBadge>
              <UnreadText>{item.unreadCount}</UnreadText>
            </UnreadBadge>
          )}

          {showOptionsButton && Platform.OS === 'web' && (
            <OptionsButton
              onPress={(e) => {
                e.stopPropagation()
                handleOptionsPress(item)
              }}
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#64748b" />
            </OptionsButton>
          )}
        </ChatItem>

        {Platform.OS === 'web' && activeDropdown === chatId && (
          <DropdownMenu>
            <DropdownItem danger onPress={() => handleDeleteChat(item)}>
              <Ionicons name="trash-outline" size={20} color="#dc2626" />
              <DropdownItemText danger>Delete Chat</DropdownItemText>
            </DropdownItem>
          </DropdownMenu>
        )}
      </ChatItemContainer>
    )

    if (Platform.OS !== 'web') {
      return (
        <Swipeable
          ref={(ref) => {
            if (ref) {
              swipeableRefs.current[chatId] = ref
            }
          }}
          renderRightActions={(progress, dragX) =>
            renderRightActions(progress, dragX, item)
          }
          overshootRight={false}
          friction={2}
          rightThreshold={40}
        >
          {chatItemContent}
        </Swipeable>
      )
    }

    return chatItemContent
  }

  /* =================== Main Render =================== */

  return (
    <Column flex={1} borderRight>
      <Header>
        <View>
          <HeaderTitle>Messages</HeaderTitle>
          <HeaderSubtitle>{chats.length} conversations</HeaderSubtitle>
        </View>
        {showCameraButton && (
          <CameraButton onPress={handleCameraPress} disabled={uploading}>
            <Ionicons name="camera-outline" size={22} color="#fff" />
          </CameraButton>
        )}
      </Header>

      <SearchContainer>
        <SearchInputWrapper>
          <SearchIcon>
            <Ionicons name="search" size={20} color="#64748b" />
          </SearchIcon>
          <SearchInput
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </SearchInputWrapper>
      </SearchContainer>

      {filteredChats.length === 0 ? (
        <EmptyState>
          <EmptyIconWrapper>
            <Ionicons name="chatbubbles-outline" size={40} color="#64748b" />
          </EmptyIconWrapper>
          <EmptyStateTitle>No Conversations</EmptyStateTitle>
          <EmptyStateText>
            {searchQuery
              ? 'No results found'
              : 'Start a conversation to see it here'}
          </EmptyStateText>
        </EmptyState>
      ) : (
        <ChatList
          data={filteredChats}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderChatItem}
        />
      )}

      {showFAB && onNewChat && (
        <FloatingActionButton onPress={onNewChat}>
          <Ionicons name="add" size={28} color="white" />
        </FloatingActionButton>
      )}

      <CameraActionModal
        visible={cameraModalVisible}
        onClose={() => setCameraModalVisible(false)}
        onCamera={handleTakePhoto}
        onGallery={handleChooseFromGallery}
      />

      {uploading && (
        <LoadingOverlay>
          <LoadingContent>
            <Ionicons name="cloud-upload-outline" size={48} color="#3b82f6" />
            <LoadingText>Uploading status...</LoadingText>
          </LoadingContent>
        </LoadingOverlay>
      )}
    </Column>
  )
}
