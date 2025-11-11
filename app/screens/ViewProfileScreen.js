// screens/ViewProfileScreen.js - Enhanced with 3-Column Layout
import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  FlatList,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import { useUser } from '../hooks/useUser'
import useChatHelpers from '../hooks/useChatHelpers'
import ChatsContext from '../contexts/ChatsContext'
import { useWebSidebar } from '../hooks/useWebSidebar'

const { width } = Dimensions.get('window')
const MEDIA_ITEM_SIZE = (width - 64) / 3

/* =================== Styled Components =================== */
const Container = styled.View`
  flex: 1;
  background-color: #f8f9fa;
`

const ThreeColumnLayout = styled.View`
  flex: 1;
  flex-direction: row;
  background-color: #f8f9fa;
`

const Column = styled.View`
  flex: ${(props) => props.flex || 1};
  background-color: ${(props) => props.bgColor || '#fff'};
  border-right-width: ${(props) => (props.borderRight ? '1px' : '0px')};
  border-right-color: #e9ecef;
`

const Header = styled.View`
  background-color: #fff;
  padding: ${Platform.OS === 'ios' ? '50px' : '20px'} 16px 16px 16px;
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

const HeaderTitle = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
`

const ColumnHeader = styled.View`
  background-color: #fff;
  padding: 20px;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.05;
  shadow-radius: 2px;
  elevation: 2;
`

const ColumnHeaderTitleRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`

const ColumnHeaderTitle = styled.Text`
  font-size: 28px;
  font-weight: 800;
  color: #3396d3;
  letter-spacing: -0.5px;
`

const ColumnHeaderSubtitle = styled.Text`
  font-size: 13px;
  color: #7f8c8d;
  margin-top: 4px;
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
  color: #7f8c8d;
  line-height: 18px;
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

const ProfileHeader = styled.View`
  background-color: #fff;
  align-items: center;
  padding: 32px 16px;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
`

const AvatarContainer = styled.View`
  position: relative;
  margin-bottom: 16px;
`

const Avatar = styled.View`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  background-color: ${(props) => props.color || '#3498db'};
  justify-content: center;
  align-items: center;
  border-width: 4px;
  border-color: #fff;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.15;
  shadow-radius: 8px;
  elevation: 8;
`

const AvatarText = styled.Text`
  color: #fff;
  font-size: 48px;
  font-weight: bold;
`

const OnlineBadge = styled.View`
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background-color: ${(props) => (props.online ? '#27ae60' : '#95a5a6')};
  border-width: 3px;
  border-color: #fff;
`

const ProfileName = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 8px;
`

const ProfileStatus = styled.Text`
  font-size: 14px;
  color: ${(props) => (props.online ? '#27ae60' : '#95a5a6')};
  margin-bottom: 4px;
`

const ProfileEmail = styled.Text`
  font-size: 14px;
  color: #7f8c8d;
`

const StatusMessage = styled.View`
  background-color: #f8f9fa;
  padding: 12px 16px;
  border-radius: 12px;
  margin-top: 16px;
  max-width: 80%;
`

const StatusMessageText = styled.Text`
  font-size: 14px;
  color: #2c3e50;
  text-align: center;
  font-style: italic;
`

const ActionButtons = styled.View`
  flex-direction: row;
  padding: 16px;
  background-color: #fff;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
  justify-content: space-around;
`

const ActionButton = styled.TouchableOpacity`
  align-items: center;
  flex: 1;
  padding: 12px;
  margin: 0 4px;
  background-color: ${(props) => props.bgColor || '#f8f9fa'};
  border-radius: 12px;
  flex-direction: row;
  justify-content: center;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
`

const ActionButtonText = styled.Text`
  margin-left: 8px;
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => props.color || '#2c3e50'};
`

const InfoSection = styled.View`
  background-color: #fff;
  margin: 12px;
  border-radius: 12px;
  overflow: hidden;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`

const InfoSectionHeader = styled.View`
  padding: 16px;
  background-color: #f8f9fa;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
`

const InfoSectionTitle = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
`

const InfoItem = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: #f8f9fa;
`

const InfoItemIcon = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${(props) => props.bgColor || '#e8f4fd'};
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`

const InfoItemContent = styled.View`
  flex: 1;
`

const InfoItemLabel = styled.Text`
  font-size: 12px;
  color: #7f8c8d;
  margin-bottom: 4px;
`

const InfoItemValue = styled.Text`
  font-size: 14px;
  color: #2c3e50;
  font-weight: 500;
`

const MediaSection = styled.View`
  background-color: #fff;
  margin: 12px;
  margin-top: 0;
  border-radius: 12px;
  overflow: hidden;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`

const MediaTabs = styled.View`
  flex-direction: row;
  background-color: #f8f9fa;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
`

const MediaTab = styled.TouchableOpacity`
  flex: 1;
  padding: 12px;
  align-items: center;
  border-bottom-width: 2px;
  border-bottom-color: ${(props) => (props.active ? '#3498db' : 'transparent')};
`

const MediaTabText = styled.Text`
  font-size: 14px;
  font-weight: ${(props) => (props.active ? '600' : '400')};
  color: ${(props) => (props.active ? '#3498db' : '#7f8c8d')};
`

const MediaGrid = styled.View`
  padding: 8px;
  flex-direction: row;
  flex-wrap: wrap;
`

const MediaItem = styled.TouchableOpacity`
  width: ${MEDIA_ITEM_SIZE}px;
  height: ${MEDIA_ITEM_SIZE}px;
  margin: 4px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f8f9fa;
  position: relative;
`

const MediaImage = styled.Image`
  width: 100%;
  height: 100%;
`

const MediaOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
`

const FileItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 12px 16px;
  border-bottom-width: 1px;
  border-bottom-color: #f8f9fa;
`

const FileIconContainer = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background-color: #e8f4fd;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`

const FileInfo = styled.View`
  flex: 1;
`

const FileName = styled.Text`
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 4px;
`

const FileSize = styled.Text`
  font-size: 12px;
  color: #7f8c8d;
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

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: #f8f9fa;
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

// ─── Chat Messages Components ────────────────────────────
const ChatContainer = styled.View`
  flex: 1;
  background-color: #f8f9fa;
`

const ChatHeader = styled.View`
  background-color: #fff;
  padding: 20px;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 5;
`

const ChatHeaderInfo = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
`

const ChatHeaderAvatar = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: ${(props) => props.color || '#3498db'};
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`

const ChatHeaderAvatarText = styled.Text`
  color: #fff;
  font-size: 18px;
  font-weight: bold;
`

const ChatHeaderTextInfo = styled.View`
  flex: 1;
`

const ChatHeaderName = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
`

const ChatHeaderStatus = styled.Text`
  font-size: 14px;
  color: ${(props) => (props.online ? '#27ae60' : '#95a5a6')};
  margin-top: 2px;
`

const ChatHeaderActions = styled.View`
  flex-direction: row;
  gap: 8px;
`

const ChatHeaderButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  justify-content: center;
  align-items: center;
  background-color: #f8f9fa;
`

const MessagesList = styled.FlatList`
  flex: 1;
  padding: 16px;
`

const MessageBubble = styled.View`
  max-width: 70%;
  margin-bottom: 12px;
  align-self: ${(props) => (props.isOwn ? 'flex-end' : 'flex-start')};
`

const MessageContent = styled.View`
  background-color: ${(props) => (props.isOwn ? '#3498db' : '#fff')};
  padding: 12px 16px;
  border-radius: 18px;
  border-bottom-right-radius: ${(props) => (props.isOwn ? '4px' : '18px')};
  border-bottom-left-radius: ${(props) => (props.isOwn ? '18px' : '4px')};
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 2;
`

const MessageText = styled.Text`
  font-size: 16px;
  color: ${(props) => (props.isOwn ? '#fff' : '#2c3e50')};
  line-height: 22px;
`

const MessageImage = styled.View`
  width: 200px;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 8px;
`

const MessageTime = styled.Text`
  font-size: 11px;
  color: ${(props) => (props.isOwn ? 'rgba(255,255,255,0.7)' : '#95a5a6')};
  margin-top: 4px;
  align-self: ${(props) => (props.isOwn ? 'flex-end' : 'flex-start')};
`

const MessageInputContainer = styled.View`
  background-color: #fff;
  padding: 12px 16px;
  border-top-width: 1px;
  border-top-color: #e9ecef;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`

const MessageInput = styled.TextInput`
  flex: 1;
  background-color: #f8f9fa;
  border-radius: 24px;
  padding: 12px 16px;
  font-size: 16px;
  color: #2c3e50;
  max-height: 100px;
`

const SendButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: #3498db;
  justify-content: center;
  align-items: center;
`

const AttachButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  justify-content: center;
  align-items: center;
  background-color: #f8f9fa;
`

const TypingIndicator = styled.View`
  padding: 8px 16px;
  background-color: #fff;
  border-top-width: 1px;
  border-top-color: #e9ecef;
`

const TypingText = styled.Text`
  font-size: 14px;
  color: #3498db;
  font-style: italic;
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

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const getFileIcon = (mimetype) => {
  if (mimetype?.startsWith('image/')) return 'image'
  if (mimetype?.startsWith('video/')) return 'videocam'
  if (mimetype?.startsWith('audio/')) return 'musical-notes'
  if (mimetype?.includes('pdf')) return 'document-text'
  if (mimetype?.includes('word') || mimetype?.includes('document'))
    return 'document'
  if (mimetype?.includes('sheet') || mimetype?.includes('excel')) return 'grid'
  return 'document-attach'
}

const formatMessageTime = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

/* =================== Components =================== */

// Chat List Column Component
const ChatsColumn = ({
  chats,
  selectedChatId,
  onSelectChat,
  currentUser,
  isUserOnline,
  users = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('')

  // Helper to find user by any ID
  const findUserByAnyId = (userId) => {
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

  // Helper to get last message text
  const getLastMessageText = (lastMessage) => {
    if (!lastMessage) return null
    if (typeof lastMessage === 'string') return lastMessage
    if (typeof lastMessage === 'object' && lastMessage.content)
      return lastMessage.content
    return null
  }

  const filteredChats = chats.filter((chat) => {
    const otherParticipant = chat.participants?.find(
      (p) => p !== currentUser?.uid
    )

    // Try multiple sources for user data
    const otherUser =
      chat.participantDetails?.[otherParticipant] ||
      findUserByAnyId(otherParticipant)

    const name = otherUser?.name || otherUser?.displayName || 'Unknown'
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const renderChatItem = ({ item }) => {
    const otherParticipant = item.participants?.find(
      (p) => p !== currentUser?.uid
    )

    // Try multiple sources for user data
    const otherUser =
      item.participantDetails?.[otherParticipant] ||
      findUserByAnyId(otherParticipant)

    const isOnline = isUserOnline(otherParticipant)
    const userColor = getUserColor(otherParticipant)
    const isActive = selectedChatId === (item._id || item.id)
    const userName = otherUser?.name || otherUser?.displayName || 'Unknown User'

    // Format last message with proper preview
    const lastMessage = item.lastMessage
    const isOwn = lastMessage?.senderId === currentUser?.uid
    const lastMessageText = getLastMessageText(lastMessage)

    const messagePreview =
      lastMessage && lastMessageText
        ? `${isOwn ? 'You: ' : ''}${lastMessageText}`
        : 'No messages yet - start the conversation!'

    return (
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
            <ChatTime>{formatChatTime(item.lastMessage?.createdAt)}</ChatTime>
          </ChatNameRow>
          <ChatLastMessage numberOfLines={1}>{messagePreview}</ChatLastMessage>
        </ChatInfo>

        {item.unreadCount > 0 && (
          <UnreadBadge>
            <UnreadText>{item.unreadCount}</UnreadText>
          </UnreadBadge>
        )}
      </ChatItem>
    )
  }

  return (
    <Column flex={1} borderRight>
      <ColumnHeader>
        <ColumnHeaderTitleRow>
          <ColumnHeaderTitle>PeepGram</ColumnHeaderTitle>
        </ColumnHeaderTitleRow>
        <ColumnHeaderSubtitle>
          {chats.length} conversations
        </ColumnHeaderSubtitle>
      </ColumnHeader>

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
    </Column>
  )
}

// Profile Details Column Component
const ProfileColumn = ({
  profileUser,
  loading,
  error,
  isOnline,
  statusText,
  lastSeenText,
  sharedMedia,
  mediaLoading,
  activeMediaTab,
  setActiveMediaTab,
  onSendMessage,
  onVoiceCall,
  onVideoCall,
  onMediaPress,
}) => {
  if (loading) {
    return (
      <Column flex={1.2} borderRight bgColor="#f8f9fa">
        <LoadingContainer>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={{ marginTop: 16, color: '#7f8c8d' }}>
            Loading profile...
          </Text>
        </LoadingContainer>
      </Column>
    )
  }

  if (error || !profileUser) {
    return (
      <Column flex={1.2} borderRight bgColor="#f8f9fa">
        <ErrorContainer>
          <ErrorText>{error || 'User not found'}</ErrorText>
          <RetryButton>
            <RetryButtonText>Retry</RetryButtonText>
          </RetryButton>
        </ErrorContainer>
      </Column>
    )
  }

  const userColor = getUserColor(profileUser.firebaseUid || profileUser._id)
  const filteredMedia = sharedMedia.filter((item) => {
    switch (activeMediaTab) {
      case 'images':
        return item.mimetype?.startsWith('image/')
      case 'videos':
        return item.mimetype?.startsWith('video/')
      case 'files':
        return (
          !item.mimetype?.startsWith('image/') &&
          !item.mimetype?.startsWith('video/')
        )
      default:
        return true
    }
  })

  const imageCount = sharedMedia.filter((item) =>
    item.mimetype?.startsWith('image/')
  ).length
  const videoCount = sharedMedia.filter((item) =>
    item.mimetype?.startsWith('video/')
  ).length
  const fileCount = sharedMedia.filter(
    (item) =>
      !item.mimetype?.startsWith('image/') &&
      !item.mimetype?.startsWith('video/')
  ).length

  return (
    <Column flex={1.2} borderRight bgColor="#f8f9fa">
      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileHeader>
          <AvatarContainer>
            <Avatar color={userColor}>
              <AvatarText>{getInitials(profileUser.name)}</AvatarText>
            </Avatar>
            <OnlineBadge online={isOnline} />
          </AvatarContainer>

          <ProfileName>{profileUser.name || 'Unknown User'}</ProfileName>
          <ProfileStatus online={isOnline}>{statusText}</ProfileStatus>
          {profileUser.email && (
            <ProfileEmail>{profileUser.email}</ProfileEmail>
          )}

          {statusText !== 'Online' && statusText !== 'Offline' && (
            <StatusMessage>
              <StatusMessageText>"{statusText}"</StatusMessageText>
            </StatusMessage>
          )}
        </ProfileHeader>

        <ActionButtons>
          <ActionButton bgColor="#e8f4fd" onPress={onSendMessage}>
            <Ionicons name="chatbubble" size={20} color="#3498db" />
            <ActionButtonText color="#3498db">Message</ActionButtonText>
          </ActionButton>

          <ActionButton bgColor="#e8f4fd" onPress={onVoiceCall}>
            <Ionicons name="call" size={20} color="#3498db" />
            <ActionButtonText color="#3498db">Call</ActionButtonText>
          </ActionButton>

          <ActionButton bgColor="#e8f5e8" onPress={onVideoCall}>
            <Ionicons name="videocam" size={20} color="#27ae60" />
            <ActionButtonText color="#27ae60">Video</ActionButtonText>
          </ActionButton>
        </ActionButtons>

        <InfoSection>
          <InfoSectionHeader>
            <InfoSectionTitle>Information</InfoSectionTitle>
          </InfoSectionHeader>

          {profileUser.email && (
            <InfoItem>
              <InfoItemIcon bgColor="#e8f4fd">
                <Ionicons name="mail" size={20} color="#3498db" />
              </InfoItemIcon>
              <InfoItemContent>
                <InfoItemLabel>Email</InfoItemLabel>
                <InfoItemValue>{profileUser.email}</InfoItemValue>
              </InfoItemContent>
            </InfoItem>
          )}

          {profileUser.phone && (
            <InfoItem>
              <InfoItemIcon bgColor="#e8f5e8">
                <Ionicons name="call" size={20} color="#27ae60" />
              </InfoItemIcon>
              <InfoItemContent>
                <InfoItemLabel>Phone</InfoItemLabel>
                <InfoItemValue>{profileUser.phone}</InfoItemValue>
              </InfoItemContent>
            </InfoItem>
          )}

          <InfoItem>
            <InfoItemIcon bgColor="#fff5e6">
              <Ionicons name="calendar" size={20} color="#f39c12" />
            </InfoItemIcon>
            <InfoItemContent>
              <InfoItemLabel>Joined</InfoItemLabel>
              <InfoItemValue>{formatDate(profileUser.createdAt)}</InfoItemValue>
            </InfoItemContent>
          </InfoItem>

          {!isOnline && (
            <InfoItem>
              <InfoItemIcon bgColor="#f8f9fa">
                <Ionicons name="time" size={20} color="#95a5a6" />
              </InfoItemIcon>
              <InfoItemContent>
                <InfoItemLabel>Last seen</InfoItemLabel>
                <InfoItemValue>{lastSeenText}</InfoItemValue>
              </InfoItemContent>
            </InfoItem>
          )}

          {isOnline && (
            <InfoItem>
              <InfoItemIcon bgColor="#e8f5e8">
                <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
              </InfoItemIcon>
              <InfoItemContent>
                <InfoItemLabel>Status</InfoItemLabel>
                <InfoItemValue>Active now</InfoItemValue>
              </InfoItemContent>
            </InfoItem>
          )}
        </InfoSection>

        <MediaSection>
          <InfoSectionHeader>
            <InfoSectionTitle>Shared Media</InfoSectionTitle>
          </InfoSectionHeader>

          <MediaTabs>
            <MediaTab
              active={activeMediaTab === 'images'}
              onPress={() => setActiveMediaTab('images')}
            >
              <MediaTabText active={activeMediaTab === 'images'}>
                Images ({imageCount})
              </MediaTabText>
            </MediaTab>
            <MediaTab
              active={activeMediaTab === 'videos'}
              onPress={() => setActiveMediaTab('videos')}
            >
              <MediaTabText active={activeMediaTab === 'videos'}>
                Videos ({videoCount})
              </MediaTabText>
            </MediaTab>
            <MediaTab
              active={activeMediaTab === 'files'}
              onPress={() => setActiveMediaTab('files')}
            >
              <MediaTabText active={activeMediaTab === 'files'}>
                Files ({fileCount})
              </MediaTabText>
            </MediaTab>
          </MediaTabs>

          {mediaLoading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#3498db" />
              <Text style={{ marginTop: 8, color: '#7f8c8d', fontSize: 12 }}>
                Loading media...
              </Text>
            </View>
          ) : filteredMedia.length === 0 ? (
            <EmptyState>
              <Ionicons
                name={
                  activeMediaTab === 'images'
                    ? 'images-outline'
                    : activeMediaTab === 'videos'
                    ? 'videocam-outline'
                    : 'document-outline'
                }
                size={48}
                color="#95a5a6"
              />
              <EmptyStateText>
                No{' '}
                {activeMediaTab === 'images'
                  ? 'images'
                  : activeMediaTab === 'videos'
                  ? 'videos'
                  : 'files'}{' '}
                shared yet
              </EmptyStateText>
            </EmptyState>
          ) : activeMediaTab === 'files' ? (
            <View>
              {filteredMedia.map((item, index) => (
                <FileItem key={index} onPress={() => onMediaPress(item)}>
                  <FileIconContainer>
                    <Ionicons
                      name={getFileIcon(item.mimetype)}
                      size={24}
                      color="#3498db"
                    />
                  </FileIconContainer>
                  <FileInfo>
                    <FileName numberOfLines={1}>
                      {item.originalname || 'Unnamed file'}
                    </FileName>
                    <FileSize>{formatFileSize(item.size)}</FileSize>
                  </FileInfo>
                  <Ionicons name="download-outline" size={20} color="#95a5a6" />
                </FileItem>
              ))}
            </View>
          ) : (
            <MediaGrid>
              {filteredMedia.map((item, index) => (
                <MediaItem key={index} onPress={() => onMediaPress(item)}>
                  <MediaImage source={{ uri: item.url }} resizeMode="cover" />
                  {activeMediaTab === 'videos' && (
                    <MediaOverlay>
                      <Ionicons name="play-circle" size={40} color="#fff" />
                    </MediaOverlay>
                  )}
                </MediaItem>
              ))}
            </MediaGrid>
          )}
        </MediaSection>
      </ScrollView>
    </Column>
  )
}

// Chat Messages Column Component
const MessagesColumn = ({ chatId, profileUser, currentUser, navigation }) => {
  const {
    messages = {},
    loadMessages,
    sendMessage,
    isUserOnline,
    getTypingUsersForChat,
    sendTypingIndicator,
    initiateCall,
  } = React.useContext(ChatsContext) || {}

  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const flatListRef = useRef(null)

  const chatMessages = messages[chatId] || []
  const isOnline = isUserOnline(profileUser?.firebaseUid || profileUser?._id)
  const typingUsers = getTypingUsersForChat ? getTypingUsersForChat(chatId) : []
  const isTyping = typingUsers.length > 0

  // Load messages when chatId changes
  useEffect(() => {
    const loadChatMessages = async () => {
      if (chatId && loadMessages) {
        setLoading(true)
        try {
          await loadMessages(chatId)
        } catch (error) {
          console.error('Failed to load messages:', error)
        } finally {
          setLoading(false)
        }
      }
    }

    loadChatMessages()
  }, [chatId])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatMessages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [chatMessages.length])

  const handleSend = async () => {
    if (!messageText.trim() || sending || !sendMessage) return

    const text = messageText.trim()
    setMessageText('')
    setSending(true)

    try {
      await sendMessage({
        chatId,
        content: text,
        messageType: 'text',
      })

      if (sendTypingIndicator) {
        sendTypingIndicator(chatId, false)
      }

      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    } catch (error) {
      console.error('Send message error:', error)
      Alert.alert('Error', 'Failed to send message')
      setMessageText(text)
    } finally {
      setSending(false)
    }
  }

  const handleTyping = (text) => {
    setMessageText(text)
    if (sendTypingIndicator) {
      if (text.length > 0) {
        sendTypingIndicator(chatId, true)
      } else {
        sendTypingIndicator(chatId, false)
      }
    }
  }

  const handleVoiceCall = async () => {
    if (!initiateCall) return

    const participantId = profileUser.firebaseUid || profileUser._id
    const res = await initiateCall({
      chatId,
      callType: 'voice',
      recipientId: participantId,
    })

    if (res.success) {
      navigation.navigate('CallScreen', {
        chatId,
        remoteUserId: participantId,
        remoteUserName: profileUser.name,
        callType: 'voice',
      })
    }
  }

  const handleVideoCall = async () => {
    if (!initiateCall) return

    const participantId = profileUser.firebaseUid || profileUser._id
    const res = await initiateCall({
      chatId,
      callType: 'video',
      recipientId: participantId,
    })

    if (res.success) {
      navigation.navigate('CallScreen', {
        chatId,
        remoteUserId: participantId,
        remoteUserName: profileUser.name,
        callType: 'video',
      })
    }
  }

  const renderMessage = ({ item }) => {
    const isOwn = item.senderId === currentUser?.uid
    const hasImage =
      item.files &&
      item.files.length > 0 &&
      item.files[0].mimetype?.startsWith('image/')

    return (
      <MessageBubble isOwn={isOwn}>
        <MessageContent isOwn={isOwn}>
          {item.content && (
            <MessageText isOwn={isOwn}>{item.content}</MessageText>
          )}
          {hasImage && (
            <MessageImage>
              <Image
                source={{ uri: item.files[0].url }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </MessageImage>
          )}
        </MessageContent>
        <MessageTime isOwn={isOwn}>
          {formatMessageTime(item.createdAt)}
        </MessageTime>
      </MessageBubble>
    )
  }

  if (!chatId || !profileUser) {
    return (
      <Column flex={1.5} bgColor="#f8f9fa">
        <EmptyState style={{ flex: 1 }}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={80}
            color="#94a3b8"
          />
          <EmptyStateTitle>Select a conversation</EmptyStateTitle>
          <EmptyStateText>
            Choose a chat from the list to start messaging
          </EmptyStateText>
        </EmptyState>
      </Column>
    )
  }

  if (loading && chatMessages.length === 0) {
    return (
      <Column flex={1.5} bgColor="#f8f9fa">
        <ChatHeader>
          <ChatHeaderInfo>
            <ChatHeaderAvatar
              color={getUserColor(profileUser?.firebaseUid || profileUser?._id)}
            >
              <ChatHeaderAvatarText>
                {getInitials(profileUser?.name)}
              </ChatHeaderAvatarText>
            </ChatHeaderAvatar>
            <ChatHeaderTextInfo>
              <ChatHeaderName>
                {profileUser?.name || 'Unknown User'}
              </ChatHeaderName>
              <ChatHeaderStatus online={isOnline}>
                {isOnline ? 'Online' : 'Offline'}
              </ChatHeaderStatus>
            </ChatHeaderTextInfo>
          </ChatHeaderInfo>
          <ChatHeaderActions>
            <ChatHeaderButton onPress={handleVoiceCall}>
              <Ionicons name="call-outline" size={20} color="#3498db" />
            </ChatHeaderButton>
            <ChatHeaderButton onPress={handleVideoCall}>
              <Ionicons name="videocam-outline" size={20} color="#3498db" />
            </ChatHeaderButton>
            <ChatHeaderButton>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#3498db"
              />
            </ChatHeaderButton>
          </ChatHeaderActions>
        </ChatHeader>
        <EmptyState style={{ flex: 1 }}>
          <ActivityIndicator size="large" color="#3498db" />
          <EmptyStateText style={{ marginTop: 16 }}>
            Loading messages...
          </EmptyStateText>
        </EmptyState>
      </Column>
    )
  }

  return (
    <Column flex={1.5} bgColor="#f8f9fa">
      <ChatHeader>
        <ChatHeaderInfo>
          <ChatHeaderAvatar
            color={getUserColor(profileUser?.firebaseUid || profileUser?._id)}
          >
            <ChatHeaderAvatarText>
              {getInitials(profileUser?.name)}
            </ChatHeaderAvatarText>
          </ChatHeaderAvatar>
          <ChatHeaderTextInfo>
            <ChatHeaderName>
              {profileUser?.name || 'Unknown User'}
            </ChatHeaderName>
            <ChatHeaderStatus online={isOnline}>
              {isOnline ? 'Online' : 'Offline'}
            </ChatHeaderStatus>
          </ChatHeaderTextInfo>
        </ChatHeaderInfo>
        <ChatHeaderActions>
          <ChatHeaderButton onPress={handleVoiceCall}>
            <Ionicons name="call-outline" size={20} color="#3498db" />
          </ChatHeaderButton>
          <ChatHeaderButton onPress={handleVideoCall}>
            <Ionicons name="videocam-outline" size={20} color="#3498db" />
          </ChatHeaderButton>
          <ChatHeaderButton>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#3498db"
            />
          </ChatHeaderButton>
        </ChatHeaderActions>
      </ChatHeader>

      {chatMessages.length === 0 ? (
        <EmptyState style={{ flex: 1 }}>
          <Ionicons name="chatbubbles-outline" size={60} color="#94a3b8" />
          <EmptyStateTitle>No messages yet</EmptyStateTitle>
          <EmptyStateText>
            Send a message to start the conversation
          </EmptyStateText>
        </EmptyState>
      ) : (
        <MessagesList
          ref={flatListRef}
          data={chatMessages}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}

      {isTyping && (
        <TypingIndicator>
          <TypingText>{profileUser?.name} is typing...</TypingText>
        </TypingIndicator>
      )}

      <MessageInputContainer>
        <AttachButton>
          <Ionicons name="attach-outline" size={24} color="#7f8c8d" />
        </AttachButton>
        <MessageInput
          value={messageText}
          onChangeText={handleTyping}
          placeholder="Type a message..."
          multiline
          editable={!sending}
        />
        <SendButton
          onPress={handleSend}
          disabled={!messageText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </SendButton>
      </MessageInputContainer>
    </Column>
  )
}

/* =================== Main Component =================== */
export default function ViewProfileScreen({ navigation, route }) {
  const { userId, chatId: initialChatId } = route?.params || {}
  const [profileUser, setProfileUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sharedMedia, setSharedMedia] = useState([])
  const [mediaLoading, setMediaLoading] = useState(false)
  const [activeMediaTab, setActiveMediaTab] = useState('images')
  const [activeChatId, setActiveChatId] = useState(initialChatId)
  const [selectedChat, setSelectedChat] = useState(null)

  const { user: currentUser } = useUser()
  const {
    findUserById,
    createChat,
    initiateCall,
    chats = [],
    getMessagesForChat,
    loadMessages,
    isUserOnline,
    users = [], // ✅ Add users array from context
  } = React.useContext(ChatsContext) || {}

  const { checkUserOnline, getStatusText, getLastSeenText } =
    useChatHelpers(initialChatId)
  const isWebSidebar = useWebSidebar()

  // Load profile
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const found = findUserById(userId)
        if (!found) throw new Error('User not found')

        setProfileUser(found)

        // Auto-find or create chat
        if (currentUser?.uid) {
          const participantId = found.firebaseUid || found._id
          const existing = chats.find((c) => {
            const parts = c.participants || []
            return (
              parts.includes(currentUser.uid) && parts.includes(participantId)
            )
          })

          if (existing) {
            setActiveChatId(existing._id || existing.id)
            setSelectedChat(existing)
          } else if (isWebSidebar) {
            // Auto-create chat for web sidebar
            const res = await createChat([currentUser.uid, participantId], null)
            if (res.success) {
              setActiveChatId(res.chat._id || res.chat.id)
              setSelectedChat(res.chat)
            }
          }
        }
      } catch (e) {
        console.error(e)
        setError(e.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId, findUserById, isWebSidebar, currentUser?.uid])

  // Load shared media
  useEffect(() => {
    const loadSharedMedia = async () => {
      if (!profileUser || !currentUser?.uid) return

      setMediaLoading(true)
      try {
        const participantId = profileUser.firebaseUid || profileUser._id
        const existingChat = chats.find((c) => {
          const parts = c.participants || []
          return (
            parts.includes(currentUser.uid) && parts.includes(participantId)
          )
        })

        if (existingChat) {
          const chatId = existingChat._id || existingChat.id
          let messages = getMessagesForChat(chatId)

          if (messages.length === 0) {
            messages = await loadMessages(chatId)
          }

          const mediaItems = []
          messages.forEach((msg) => {
            if (msg.files && msg.files.length > 0) {
              msg.files.forEach((file) => {
                mediaItems.push({
                  ...file,
                  messageId: msg._id || msg.id,
                  createdAt: msg.createdAt,
                  senderId: msg.senderId,
                })
              })
            }
          })

          mediaItems.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )
          setSharedMedia(mediaItems)
        }
      } catch (err) {
        console.error('Failed to load shared media:', err)
      } finally {
        setMediaLoading(false)
      }
    }

    loadSharedMedia()
  }, [profileUser, currentUser, chats, getMessagesForChat, loadMessages])

  // Handlers
  const handleSelectChat = (chat) => {
    const chatId = chat._id || chat.id
    setSelectedChat(chat)
    setActiveChatId(chatId)

    // Update profile user based on selected chat
    const otherParticipant = chat.participants?.find(
      (p) => p !== currentUser?.uid
    )

    // Try multiple sources for user data
    const otherUser =
      chat.participantDetails?.[otherParticipant] ||
      users.find(
        (u) =>
          u._id === otherParticipant ||
          u.id === otherParticipant ||
          u.firebaseUid === otherParticipant ||
          u.uid === otherParticipant
      )

    if (otherUser) {
      setProfileUser({
        ...otherUser,
        _id: otherUser._id || otherParticipant,
        firebaseUid: otherUser.firebaseUid || otherParticipant,
        name: otherUser.name || otherUser.displayName || 'Unknown User',
      })
    }

    // Load messages for this chat
    if (loadMessages) {
      loadMessages(chatId)
    }
  }

  const handleSendMessage = async () => {
    if (!profileUser || !currentUser?.uid)
      return Alert.alert('Error', 'Cannot send message')

    const participantId = profileUser.firebaseUid || profileUser._id
    const existing = chats.find((c) => {
      const parts = c.participants || []
      return parts.includes(currentUser.uid) && parts.includes(participantId)
    })

    if (existing) {
      setActiveChatId(existing._id || existing.id)
      setSelectedChat(existing)
    } else {
      const res = await createChat([currentUser.uid, participantId], null)
      if (res.success) {
        setActiveChatId(res.chat._id || res.chat.id)
        setSelectedChat(res.chat)
      } else {
        Alert.alert('Error', 'Failed to create chat')
      }
    }
  }

  const startCall = async (callType) => {
    if (!profileUser || !currentUser?.uid)
      return Alert.alert('Error', 'Cannot start call')

    const participantId = profileUser.firebaseUid || profileUser._id
    let targetChatId = activeChatId

    if (!targetChatId) {
      const existing = chats.find((c) => {
        const parts = c.participants || []
        return parts.includes(currentUser.uid) && parts.includes(participantId)
      })

      if (existing) {
        targetChatId = existing._id || existing.id
      } else {
        const res = await createChat([currentUser.uid, participantId], null)
        if (res.success) targetChatId = res.chat._id || res.chat.id
      }
    }

    if (!targetChatId) return Alert.alert('Error', 'Cannot start call')

    const res = await initiateCall({
      chatId: targetChatId,
      callType,
      recipientId: participantId,
    })

    if (res.success) {
      navigation.navigate('CallScreen', {
        chatId: targetChatId,
        remoteUserId: participantId,
        remoteUserName: profileUser.name,
        callType,
      })
    } else {
      Alert.alert('Error', `Failed to start ${callType} call`)
    }
  }

  const handleVoiceCall = () => startCall('voice')
  const handleVideoCall = () => startCall('video')
  const handleMediaPress = (item) => {
    Alert.alert('Media', `View ${item.originalname || 'file'}`)
  }

  const userIdForStatus = profileUser?.firebaseUid || profileUser?._id
  const isOnline = checkUserOnline(userIdForStatus)
  const statusText = getStatusText(userIdForStatus)
  const lastSeenText = getLastSeenText(userIdForStatus)

  // Mobile view (single screen)
  if (!isWebSidebar) {
    return (
      <Container>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Header>
          <BackButton onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </BackButton>
          <HeaderTitle>Profile</HeaderTitle>
        </Header>

        <ProfileColumn
          profileUser={profileUser}
          loading={loading}
          error={error}
          isOnline={isOnline}
          statusText={statusText}
          lastSeenText={lastSeenText}
          sharedMedia={sharedMedia}
          mediaLoading={mediaLoading}
          activeMediaTab={activeMediaTab}
          setActiveMediaTab={setActiveMediaTab}
          onSendMessage={handleSendMessage}
          onVoiceCall={handleVoiceCall}
          onVideoCall={handleVideoCall}
          onMediaPress={handleMediaPress}
        />
      </Container>
    )
  }

  // Web view (three-column layout)
  return (
    <Container>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ThreeColumnLayout>
        <ChatsColumn
          chats={chats}
          selectedChatId={activeChatId}
          onSelectChat={handleSelectChat}
          currentUser={currentUser}
          isUserOnline={isUserOnline}
          users={users}
        />

        <ProfileColumn
          profileUser={profileUser}
          loading={loading}
          error={error}
          isOnline={isOnline}
          statusText={statusText}
          lastSeenText={lastSeenText}
          sharedMedia={sharedMedia}
          mediaLoading={mediaLoading}
          activeMediaTab={activeMediaTab}
          setActiveMediaTab={setActiveMediaTab}
          onSendMessage={handleSendMessage}
          onVoiceCall={handleVoiceCall}
          onVideoCall={handleVideoCall}
          onMediaPress={handleMediaPress}
        />

        <MessagesColumn
          chatId={activeChatId}
          profileUser={profileUser}
          currentUser={currentUser}
          navigation={navigation}
        />
      </ThreeColumnLayout>
    </Container>
  )
}
