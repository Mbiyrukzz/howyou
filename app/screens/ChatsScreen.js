import React, { useContext, useState, useEffect } from 'react'
import {
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import ChatsContext from '../contexts/ChatsContext'
import { useUser } from '../hooks/useUser'

const { width: screenWidth } = Dimensions.get('window')

const Container = styled.View`
  flex: 1;
  background-color: #f8fafc;
`

const HeaderGradient = styled(LinearGradient).attrs({
  colors: ['#3396D3', '#3396D3'],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
})`
  padding: 60px 24px 24px 24px;
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
`

const HeaderContent = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`

const HeaderLeft = styled.View`
  flex: 1;
`

const HeaderTitle = styled.Text`
  font-size: 32px;
  font-weight: 800;
  color: white;
  margin-bottom: 4px;
`

const HeaderSubtitle = styled.Text`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
`

const ProfileButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: rgba(255, 255, 255, 0.2);
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(10px);
`

const SearchContainer = styled.View`
  background-color: white;
  margin: -12px 24px 24px 24px;
  padding: 16px 20px;
  border-radius: 16px;
  flex-direction: row;
  align-items: center;
  shadow-color: #3396d3;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.15;
  shadow-radius: 12px;
  elevation: 8;
  border: 1px solid rgba(102, 126, 234, 0.1);
`

const SearchInput = styled.TextInput`
  flex: 1;
  margin-left: 12px;
  font-size: 16px;
  color: #1e293b;
  font-weight: 500;
`

const SearchIcon = styled.View`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: #f1f5f9;
  justify-content: center;
  align-items: center;
`

const ChatItem = styled.TouchableOpacity`
  background-color: white;
  margin: 6px 24px;
  padding: 20px;
  border-radius: 20px;
  flex-direction: row;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.08;
  shadow-radius: 8px;
  elevation: 4;
  border: 1px solid #f1f5f9;
  position: relative;
  overflow: hidden;
`

const ChatItemGlow = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: ${(props) => props.color || '#3396D3'};
  opacity: 0.6;
`

const AvatarContainer = styled.View`
  position: relative;
  margin-right: 16px;
`

const Avatar = styled.View`
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background-color: ${(props) => props.color || '#3396D3'};
  justify-content: center;
  align-items: center;
  border: 3px solid white;
  shadow-color: ${(props) => props.color || '#3396D3'};
  shadow-offset: 0px 2px;
  shadow-opacity: 0.3;
  shadow-radius: 4px;
  elevation: 3;
`

const AvatarText = styled.Text`
  color: white;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.5px;
`

const OnlineIndicator = styled.View`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border-radius: 9px;
  background-color: #10b981;
  border: 3px solid white;
  shadow-color: #10b981;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.5;
  shadow-radius: 2px;
  elevation: 2;
`

const ChatInfo = styled.View`
  flex: 1;
`

const ChatNameRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 6px;
`

const ChatName = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  flex: 1;
`

const ChatBadge = styled.View`
  background-color: #f59e0b;
  padding: 4px 8px;
  border-radius: 12px;
  margin-left: 8px;
`

const ChatBadgeText = styled.Text`
  color: white;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
`

const LastMessage = styled.Text`
  font-size: 15px;
  color: #64748b;
  line-height: 20px;
  font-weight: 500;
`

const ChatMeta = styled.View`
  align-items: flex-end;
  margin-left: 12px;
`

const TimeStamp = styled.Text`
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 6px;
  font-weight: 600;
`

const UnreadBadge = styled.View`
  background-color: #ef4444;
  border-radius: 12px;
  min-width: 24px;
  height: 24px;
  justify-content: center;
  align-items: center;
  padding-horizontal: 8px;
  shadow-color: #ef4444;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.3;
  shadow-radius: 3px;
  elevation: 3;
`

const UnreadText = styled.Text`
  color: white;
  font-size: 12px;
  font-weight: 800;
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

const EmptyStateContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 48px;
`

const EmptyStateIcon = styled.View`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  background-color: #f1f5f9;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
`

const EmptyStateTitle = styled.Text`
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
  text-align: center;
`

const EmptyStateText = styled.Text`
  font-size: 16px;
  color: #64748b;
  text-align: center;
  line-height: 24px;
  margin-bottom: 32px;
`

const EmptyStateButton = styled.TouchableOpacity`
  background-color: #3396d3;
  padding: 16px 32px;
  border-radius: 16px;
  shadow-color: #3396d3;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 6px;
  elevation: 6;
`

const EmptyStateButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: 700;
`

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 48px;
`

const LoadingIcon = styled(Animated.View)`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  background-color: #3396d3;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
`

const LoadingText = styled.Text`
  font-size: 18px;
  color: #64748b;
  font-weight: 600;
`

const ErrorContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 48px;
`

const ErrorIcon = styled.View`
  width: 100px;
  height: 100px;
  border-radius: 50px;
  background-color: #fee2e2;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
`

const ErrorTitle = styled.Text`
  font-size: 22px;
  font-weight: 700;
  color: #dc2626;
  margin-bottom: 8px;
  text-align: center;
`

const ErrorText = styled.Text`
  font-size: 16px;
  color: #64748b;
  text-align: center;
  margin-bottom: 32px;
  line-height: 24px;
`

const RetryButton = styled.TouchableOpacity`
  background-color: #dc2626;
  padding: 16px 32px;
  border-radius: 16px;
  shadow-color: #dc2626;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 6px;
  elevation: 6;
`

const RetryButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: 700;
`

// Helper function to extract text from lastMessage (handles both string and object formats)
const getLastMessageText = (lastMessage) => {
  if (!lastMessage) return null

  // If it's a string, return it directly
  if (typeof lastMessage === 'string') {
    return lastMessage
  }

  // If it's an object with content property, return the content
  if (typeof lastMessage === 'object' && lastMessage.content) {
    return lastMessage.content
  }

  // Fallback for any other format
  return null
}

// Helper functions
const getUserColor = (userId) => {
  const colors = [
    '#3396D3',
    '#f59e0b',
    '#10b981',
    '#8b5cf6',
    '#ef4444',
    '#06b6d4',
    '#84cc16',
    '#f97316',
    '#ec4899',
    '#6366f1',
    '#14b8a6',
    '#f59e0b',
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
  const diffMinutes = Math.floor(diffTime / (1000 * 60))

  if (diffMinutes < 1) return 'now'
  if (diffMinutes < 60) return `${diffMinutes}m`
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

// Helper: find user regardless of which id field is used
const findUserByAnyId = (users, id) => {
  if (!users || !id) return null
  return (
    users.find((u) => u._id === id || u.id === id || u.firebaseUid === id) ||
    null
  )
}

const ChatItemComponent = ({ item, onPress, users, currentUserId }) => {
  const otherParticipants =
    item.participants?.filter((id) => id !== currentUserId) || []
  const otherUser = otherParticipants.length
    ? findUserByAnyId(users, otherParticipants[0])
    : null

  const chatName = otherUser?.name || 'Unknown'

  const lastMsg = item.lastMessage
  const isOwn = lastMsg?.senderId === currentUserId
  const preview = lastMsg
    ? `${isOwn ? 'You' : chatName}: ${getLastMessageText(lastMsg)}`
    : 'No messages yet - start the conversation!'

  return (
    <ChatItem onPress={() => onPress(item)}>
      <ChatInfo>
        <ChatName>{chatName}</ChatName>
        <LastMessage numberOfLines={1}>{preview}</LastMessage>
      </ChatInfo>
    </ChatItem>
  )
}

export default function ChatsScreen({ navigation }) {
  const [searchText, setSearchText] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const loadingRotation = new Animated.Value(0)

  const chatsContext = useContext(ChatsContext)
  const { user } = useUser()

  const { chats = [], loading, users = [], reloadChats } = chatsContext || {}

  // Animate loading icon
  React.useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.timing(loadingRotation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start()
    }
  }, [loading])

  const rotation = loadingRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  // Filter chats based on search
  const filteredChats = chats.filter((chat) => {
    if (!searchText) return true

    if (chat.name) {
      return chat.name.toLowerCase().includes(searchText.toLowerCase())
    } else {
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
      <EmptyStateIcon>
        <Ionicons name="chatbubbles-outline" size={60} color="#94a3b8" />
      </EmptyStateIcon>
      <EmptyStateTitle>No conversations yet</EmptyStateTitle>
      <EmptyStateText>
        Connect with friends and colleagues by starting your first conversation
      </EmptyStateText>
      <EmptyStateButton onPress={handleNewChat} activeOpacity={0.8}>
        <EmptyStateButtonText>Start Chatting</EmptyStateButtonText>
      </EmptyStateButton>
    </EmptyStateContainer>
  )

  const renderLoadingState = () => (
    <LoadingContainer>
      <LoadingIcon style={{ transform: [{ rotate: rotation }] }}>
        <Ionicons name="refresh" size={32} color="white" />
      </LoadingIcon>
      <LoadingText>Loading your conversations...</LoadingText>
    </LoadingContainer>
  )

  const renderErrorState = () => (
    <ErrorContainer>
      <ErrorIcon>
        <Ionicons name="alert-circle-outline" size={50} color="#dc2626" />
      </ErrorIcon>
      <ErrorTitle>Connection Error</ErrorTitle>
      <ErrorText>
        Unable to load your conversations. Please check your internet connection
        and try again.
      </ErrorText>
      <RetryButton onPress={handleRefresh} activeOpacity={0.8}>
        <RetryButtonText>Try Again</RetryButtonText>
      </RetryButton>
    </ErrorContainer>
  )

  if (loading && chats.length === 0) {
    return (
      <Container>
        <StatusBar barStyle="light-content" backgroundColor="#3396D3" />
        <HeaderGradient>
          <HeaderContent>
            <HeaderLeft>
              <HeaderTitle>Messages</HeaderTitle>
              <HeaderSubtitle>Loading...</HeaderSubtitle>
            </HeaderLeft>
            <ProfileButton activeOpacity={0.8}>
              <Ionicons name="person-outline" size={20} color="white" />
            </ProfileButton>
          </HeaderContent>
        </HeaderGradient>
        {renderLoadingState()}
      </Container>
    )
  }

  if (!chatsContext) {
    return (
      <Container>
        <StatusBar barStyle="light-content" backgroundColor="#3396D3" />
        <HeaderGradient>
          <HeaderContent>
            <HeaderLeft>
              <HeaderTitle>Messages</HeaderTitle>
              <HeaderSubtitle>Error</HeaderSubtitle>
            </HeaderLeft>
          </HeaderContent>
        </HeaderGradient>
        {renderErrorState()}
      </Container>
    )
  }

  return (
    <Container>
      <StatusBar barStyle="light-content" backgroundColor="#3396D3" />

      <HeaderGradient>
        <HeaderContent>
          <HeaderLeft>
            <HeaderTitle>Messages</HeaderTitle>
            <HeaderSubtitle>
              {filteredChats.length === 1
                ? '1 conversation'
                : `${filteredChats.length} conversations`}
            </HeaderSubtitle>
          </HeaderLeft>
          <ProfileButton activeOpacity={0.8}>
            <Ionicons name="person-outline" size={20} color="white" />
          </ProfileButton>
        </HeaderContent>
      </HeaderGradient>

      <SearchContainer>
        <SearchIcon>
          <Ionicons name="search-outline" size={18} color="#64748b" />
        </SearchIcon>
        <SearchInput
          placeholder="Search conversations..."
          placeholderTextColor="#94a3b8"
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
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3396D3']}
            tintColor="#3396D3"
            progressBackgroundColor="white"
          />
        }
      />

      <FloatingActionButton onPress={handleNewChat} activeOpacity={0.8}>
        <FABGradient>
          <Ionicons name="add" size={28} color="white" />
        </FABGradient>
      </FloatingActionButton>
    </Container>
  )
}
