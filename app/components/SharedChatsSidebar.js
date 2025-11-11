// components/SharedChatsSidebar.js - Reusable Chats Sidebar Component
import React, { useState } from 'react'
import { FlatList, Platform } from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'

/* =================== Styled Components =================== */
const Column = styled.View`
  flex: ${(props) => props.flex || 1};
  background-color: ${(props) => props.bgColor || '#fff'};
  border-right-width: ${(props) => (props.borderRight ? '1px' : '0px')};
  border-right-color: #e9ecef;
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

/* =================== Main Component =================== */
export default function SharedChatsSidebar({
  chats = [],
  selectedChatId,
  onSelectChat,
  currentUser,
  isUserOnline,
  users = [],
  showOptionsButton = false,
  onOptionsPress,
}) {
  const [searchQuery, setSearchQuery] = useState('')

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

        {showOptionsButton && Platform.OS === 'web' && (
          <OptionsButton
            onPress={(e) => {
              e.stopPropagation()
              onOptionsPress?.(item)
            }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#64748b" />
          </OptionsButton>
        )}
      </ChatItem>
    )
  }

  return (
    <Column flex={1} borderRight>
      <ColumnHeader>
        <ColumnHeaderTitleRow>
          <ColumnHeaderTitle>Messages</ColumnHeaderTitle>
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
