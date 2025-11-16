// components/SharedChatsSidebar.js - Complete Self-Contained Chats Sidebar
import React, { useState } from 'react'
import {
  FlatList,
  Platform,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as ImagePicker from 'expo-image-picker'

/* =================== Styled Components =================== */
const Column = styled.View`
  flex: ${(props) => props.flex || 1};
  background-color: ${(props) => props.bgColor || '#fff'};
  border-right-width: ${(props) => (props.borderRight ? '1px' : '0px')};
  border-right-color: #e9ecef;
  position: relative;
`

const Header = styled.View`
  background-color: white;
  padding: 20px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.05;
  shadow-radius: 8px;
  elevation: 4;
`

const HeaderTitle = styled.Text`
  font-size: 28px;
  font-weight: 800;
  color: #3396d3;
  letter-spacing: -0.5px;
`

const HeaderSubtitle = styled.Text`
  font-size: 13px;
  color: #7f8c8d;
  margin-top: 4px;
`

const CameraButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: #f1f5f9;
  justify-content: center;
  align-items: center;
`

const SearchContainer = styled.View`
  padding: 12px 16px;
  background-color: #fff;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
`

const SearchInput = styled.TextInput`
  background-color: #f8f9fa;
  border-radius: 20px;
  padding: 10px 16px 10px 40px;
  font-size: 14px;
  color: #2c3e50;
`

const SearchIcon = styled.View`
  position: absolute;
  left: 28px;
  top: 22px;
`

const ChatList = styled.FlatList`
  flex: 1;
  background-color: #fff;
`

const ChatItemContainer = styled.View`
  position: relative;
`

const ChatItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: #f8f9fa;
  background-color: ${(props) => (props.active ? '#e3f2fd' : '#fff')};
`

const ChatAvatar = styled.View`
  width: 52px;
  height: 52px;
  border-radius: 26px;
  background-color: ${(props) => props.color || '#3498db'};
  justify-content: center;
  align-items: center;
  margin-right: 12px;
  position: relative;
`

const ChatAvatarText = styled.Text`
  color: #fff;
  font-size: 18px;
  font-weight: bold;
`

const ChatAvatarImage = styled.Image`
  width: 52px;
  height: 52px;
  border-radius: 26px;
`

const OnlineDot = styled.View`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  border-radius: 7px;
  background-color: #27ae60;
  border-width: 2px;
  border-color: #fff;
`

const ChatInfo = styled.View`
  flex: 1;
  margin-right: 8px;
`

const ChatNameRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 4px;
`

const ChatName = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
`

const ChatTime = styled.Text`
  font-size: 12px;
  color: #95a5a6;
`

const ChatLastMessage = styled.Text`
  font-size: 13px;
  color: ${(props) => (props.isTyping ? '#3498db' : '#7f8c8d')};
  line-height: 18px;
  font-style: ${(props) => (props.isTyping ? 'italic' : 'normal')};
`

const UnreadBadge = styled.View`
  background-color: #3498db;
  border-radius: 10px;
  min-width: 20px;
  height: 20px;
  justify-content: center;
  align-items: center;
  padding: 0 6px;
`

const UnreadText = styled.Text`
  color: #fff;
  font-size: 11px;
  font-weight: bold;
`

const EmptyState = styled.View`
  padding: 40px 16px;
  align-items: center;
  justify-content: center;
`

const EmptyStateTitle = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-top: 12px;
  margin-bottom: 8px;
`

const EmptyStateText = styled.Text`
  font-size: 14px;
  color: #95a5a6;
  text-align: center;
  margin-top: 8px;
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
  right: 20px;
  top: 60px;
  background-color: white;
  border-radius: 12px;
  padding: 8px 0;
  min-width: 180px;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.15;
  shadow-radius: 12px;
  elevation: 8;
  border: 1px solid #f1f5f9;
  z-index: 1000;
`

const DropdownItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 12px 16px;
  background-color: ${(props) => (props.danger ? '#fef2f2' : 'transparent')};
`

const DropdownItemText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => (props.danger ? '#dc2626' : '#1e293b')};
  margin-left: 12px;
`

const FloatingActionButton = styled.TouchableOpacity`
  position: absolute;
  right: 24px;
  bottom: 32px;
  width: 64px;
  height: 64px;
  border-radius: 32px;
  justify-content: center;
  align-items: center;
  shadow-color: #3396d3;
  shadow-offset: 0px 6px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 12;
  z-index: 999;
`

const FABGradient = styled(LinearGradient).attrs({
  colors: ['#3396D3', '#3396D3'],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
})`
  width: 64px;
  height: 64px;
  border-radius: 32px;
  justify-content: center;
  align-items: center;
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
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 10;
`

const ModalTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: #2c3e50;
  text-align: center;
  margin-bottom: 8px;
`

const ModalSubtitle = styled.Text`
  font-size: 14px;
  color: #7f8c8d;
  text-align: center;
  margin-bottom: 24px;
`

const ModalButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  background-color: ${(props) => props.bgColor || '#f8f9fa'};
  margin-bottom: 12px;
`

const ModalButtonText = styled.Text`
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => props.color || '#2c3e50'};
  margin-left: 12px;
`

const ModalCancelButton = styled.TouchableOpacity`
  padding: 16px;
  align-items: center;
`

const ModalCancelText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #7f8c8d;
`

const LoadingOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  z-index: 9999;
`

const LoadingText = styled.Text`
  color: white;
  font-size: 16px;
  margin-top: 12px;
  font-weight: 600;
`

/* =================== Helper Functions =================== */
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
            <ModalButton bgColor="#e3f2fd" onPress={onCamera}>
              <Ionicons name="camera" size={24} color="#2196f3" />
              <ModalButtonText color="#2196f3">Take Photo</ModalButtonText>
            </ModalButton>
            <ModalButton bgColor="#f0f4ff" onPress={onGallery}>
              <Ionicons name="images" size={24} color="#5e72e4" />
              <ModalButtonText color="#5e72e4">
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
        Alert.alert('Success', 'Chat deleted successfully')
      } else if (result && result.error) {
        Alert.alert('Error', result.error || 'Failed to delete chat')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete chat: ' + error.message)
    }
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

    // Get typing users for this chat
    const typingUsers = getTypingUsersForChat
      ? getTypingUsersForChat(chatId)
      : []
    const isTyping = typingUsers.length > 0

    // Format typing text
    let typingText = ''
    if (isTyping) {
      if (typingUsers.length === 1) {
        typingText = ` Typing...`
      } else {
        typingText = `${typingUsers.length} people are typing...`
      }
    }

    const lastMessage = item.lastMessage
    const isOwn = lastMessage?.senderId === currentUser?.uid
    const lastMessageText = getLastMessageText(lastMessage)

    // Show typing indicator or last message
    const messagePreview = isTyping
      ? typingText
      : lastMessage && lastMessageText
      ? `${isOwn ? 'You: ' : ''}${lastMessageText}`
      : 'No messages yet - start the conversation!'

    return (
      <ChatItemContainer>
        <ChatItem active={isActive} onPress={() => onSelectChat(item)}>
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

        {/* Dropdown menu for web */}
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
  }

  /* =================== Main Render =================== */

  return (
    <Column flex={1} borderRight>
      {/* Header with PeepGram title and camera button */}
      <Header>
        <View>
          <HeaderTitle>PeepGram</HeaderTitle>
          <HeaderSubtitle>{chats.length} conversations</HeaderSubtitle>
        </View>
        {showCameraButton && (
          <CameraButton onPress={handleCameraPress} disabled={uploading}>
            <Ionicons
              name="camera-outline"
              size={24}
              color={uploading ? '#94a3b8' : '#3396d3'}
            />
          </CameraButton>
        )}
      </Header>

      {/* Search Bar */}
      <SearchContainer>
        <SearchIcon>
          <Ionicons name="search" size={18} color="#95a5a6" />
        </SearchIcon>
        <SearchInput
          placeholder="Search conversations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#95a5a6"
        />
      </SearchContainer>

      {/* Chat List or Empty State */}
      {filteredChats.length === 0 ? (
        <EmptyState>
          <Ionicons name="chatbubbles-outline" size={60} color="#95a5a6" />
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

      {/* Floating Action Button */}
      {showFAB && onNewChat && (
        <FloatingActionButton onPress={onNewChat}>
          <FABGradient>
            <Ionicons name="add" size={28} color="white" />
          </FABGradient>
        </FloatingActionButton>
      )}

      {/* Camera Action Modal */}
      <CameraActionModal
        visible={cameraModalVisible}
        onClose={() => setCameraModalVisible(false)}
        onCamera={handleTakePhoto}
        onGallery={handleChooseFromGallery}
      />

      {/* Upload Loading Overlay */}
      {uploading && (
        <LoadingOverlay>
          <Ionicons name="cloud-upload-outline" size={48} color="white" />
          <LoadingText>Uploading status...</LoadingText>
        </LoadingOverlay>
      )}
    </Column>
  )
}
