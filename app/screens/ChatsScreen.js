import React, { useContext, useState, useEffect } from 'react'
import {
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import ChatsContext from '../contexts/ChatsContext'
import { useUser } from '../hooks/useUser'

const Container = styled.View`
  flex: 1;
  background-color: #f8f9fa;
`

const Header = styled.View`
  background-color: #fff;
  padding: 60px 20px 20px 20px;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 5;
`

const HeaderTitle = styled.Text`
  font-size: 28px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 8px;
`

const HeaderSubtitle = styled.Text`
  font-size: 16px;
  color: #7f8c8d;
`

const SearchContainer = styled.View`
  background-color: #fff;
  margin: 16px 20px;
  padding: 12px 16px;
  border-radius: 25px;
  flex-direction: row;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 3;
`

const SearchInput = styled.TextInput`
  flex: 1;
  margin-left: 12px;
  font-size: 16px;
  color: #2c3e50;
`

const ChatItem = styled.TouchableOpacity`
  background-color: #fff;
  margin: 4px 20px;
  padding: 16px;
  border-radius: 16px;
  flex-direction: row;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 2;
`

const Avatar = styled.View`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  background-color: ${(props) => props.color || '#3498db'};
  justify-content: center;
  align-items: center;
  margin-right: 16px;
`

const AvatarText = styled.Text`
  color: #fff;
  font-size: 18px;
  font-weight: bold;
`

const ChatInfo = styled.View`
  flex: 1;
`

const ChatName = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
`

const LastMessage = styled.Text`
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 4px;
`

const ChatMeta = styled.View`
  align-items: flex-end;
`

const TimeStamp = styled.Text`
  font-size: 12px;
  color: #95a5a6;
  margin-bottom: 4px;
`

const UnreadBadge = styled.View`
  background-color: #e74c3c;
  border-radius: 10px;
  min-width: 20px;
  height: 20px;
  justify-content: center;
  align-items: center;
  padding-horizontal: 6px;
`

const UnreadText = styled.Text`
  color: #fff;
  font-size: 12px;
  font-weight: bold;
`

const FloatingActionButton = styled.TouchableOpacity`
  position: absolute;
  right: 20px;
  bottom: 30px;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: #3498db;
  justify-content: center;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 5px;
  elevation: 8;
`

const EmptyStateContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px;
`

const EmptyStateText = styled.Text`
  font-size: 18px;
  color: #7f8c8d;
  text-align: center;
  margin-top: 16px;
`

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`

const LoadingText = styled.Text`
  font-size: 16px;
  color: #7f8c8d;
  margin-top: 12px;
`

const ErrorContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px;
`

const ErrorText = styled.Text`
  font-size: 16px;
  color: #e74c3c;
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

// Helper functions
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

const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const formatTimestamp = (timestamp) => {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  const now = new Date()
  const diffTime = now - date
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' })
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }
}

const ChatItemComponent = ({ item, onPress, currentUserId, users }) => {
  // Determine chat display info
  const getChatInfo = () => {
    if (item.name) {
      // Named chat/room
      return {
        name: item.name,
        color: getUserColor(item._id || item.id),
      }
    } else {
      // Direct chat - get the other participant
      const otherParticipants =
        item.participants?.filter(
          (participantId) => participantId !== currentUserId
        ) || []

      if (otherParticipants.length === 1) {
        const participant = users.find(
          (u) =>
            (u._id || u.id) === otherParticipants[0] ||
            u.firebaseUid === otherParticipants[0]
        )
        return {
          name: participant?.name || 'Unknown User',
          color: participant?.color || getUserColor(otherParticipants[0]),
        }
      } else {
        // Group chat
        return {
          name: `${otherParticipants.length + 1} participants`,
          color: getUserColor(item._id || item.id),
        }
      }
    }
  }

  const chatInfo = getChatInfo()

  return (
    <ChatItem onPress={() => onPress(item)}>
      <Avatar color={chatInfo.color}>
        <AvatarText>{getInitials(chatInfo.name)}</AvatarText>
      </Avatar>
      <ChatInfo>
        <ChatName>{chatInfo.name}</ChatName>
        <LastMessage numberOfLines={1}>
          {item.lastMessage || 'No messages yet'}
        </LastMessage>
      </ChatInfo>
      <ChatMeta>
        <TimeStamp>{formatTimestamp(item.lastActivity)}</TimeStamp>
        {/* You can add unread count logic here if needed */}
      </ChatMeta>
    </ChatItem>
  )
}

export default function ChatsScreen({ navigation }) {
  const [searchText, setSearchText] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const chatsContext = useContext(ChatsContext)
  const { user } = useUser()

  const { chats = [], loading, users = [], reloadChats } = chatsContext || {}

  // Filter chats based on search
  const filteredChats = chats.filter((chat) => {
    if (!searchText) return true

    if (chat.name) {
      return chat.name.toLowerCase().includes(searchText.toLowerCase())
    } else {
      // For direct chats, search by participant names
      const otherParticipants =
        chat.participants?.filter(
          (participantId) => participantId !== user?.uid
        ) || []

      return otherParticipants.some((participantId) => {
        const participant = users.find(
          (u) =>
            (u._id || u.id) === participantId || u.firebaseUid === participantId
        )
        return participant?.name
          ?.toLowerCase()
          .includes(searchText.toLowerCase())
      })
    }
  })

  const handleChatPress = (chat) => {
    navigation.navigate('ChatDetail', {
      chatId: chat._id || chat.id,
    })
  }

  const handleNewChat = () => {
    navigation.navigate('NewChats')
  }

  const handleRefresh = async () => {
    if (reloadChats) {
      setRefreshing(true)
      await reloadChats()
      setRefreshing(false)
    }
  }

  const renderEmptyState = () => (
    <EmptyStateContainer>
      <Ionicons name="chatbubbles-outline" size={80} color="#bdc3c7" />
      <EmptyStateText>
        No conversations yet{'\n'}Start a new chat to get going!
      </EmptyStateText>
    </EmptyStateContainer>
  )

  const renderLoadingState = () => (
    <LoadingContainer>
      <Ionicons name="refresh" size={40} color="#3498db" />
      <LoadingText>Loading your chats...</LoadingText>
    </LoadingContainer>
  )

  const renderErrorState = () => (
    <ErrorContainer>
      <Ionicons name="alert-circle-outline" size={60} color="#e74c3c" />
      <ErrorText>Failed to load chats</ErrorText>
      <RetryButton onPress={handleRefresh}>
        <RetryButtonText>Try Again</RetryButtonText>
      </RetryButton>
    </ErrorContainer>
  )

  if (loading && chats.length === 0) {
    return (
      <Container>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Header>
          <HeaderTitle>Messages</HeaderTitle>
          <HeaderSubtitle>Loading...</HeaderSubtitle>
        </Header>
        {renderLoadingState()}
      </Container>
    )
  }

  if (!chatsContext) {
    return (
      <Container>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Header>
          <HeaderTitle>Messages</HeaderTitle>
          <HeaderSubtitle>Error</HeaderSubtitle>
        </Header>
        {renderErrorState()}
      </Container>
    )
  }

  return (
    <Container>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <Header>
        <HeaderTitle>Messages</HeaderTitle>
        <HeaderSubtitle>
          {filteredChats.length === 1
            ? '1 conversation'
            : `${filteredChats.length} conversations`}
        </HeaderSubtitle>
      </Header>

      <SearchContainer>
        <Ionicons name="search-outline" size={20} color="#7f8c8d" />
        <SearchInput
          placeholder="Search conversations..."
          placeholderTextColor="#bdc3c7"
          value={searchText}
          onChangeText={setSearchText}
        />
      </SearchContainer>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => (item._id || item.id).toString()}
        renderItem={({ item }) => (
          <ChatItemComponent
            item={item}
            onPress={handleChatPress}
            currentUserId={user?.uid}
            users={users}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3498db']}
            tintColor="#3498db"
          />
        }
      />

      <FloatingActionButton onPress={handleNewChat}>
        <Ionicons name="add" size={28} color="#fff" />
      </FloatingActionButton>
    </Container>
  )
}
