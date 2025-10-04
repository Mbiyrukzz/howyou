import React, { useContext, useState, useEffect } from 'react'
import {
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Dimensions,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import ChatsContext from '../contexts/ChatsContext'
import { useUser } from '../hooks/useUser'
import LoadingIndicator from '../components/LoadingIndicator'

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
`

const ChatInfo = styled.View`
  flex: 1;
`

const ChatName = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 6px;
`

const LastMessage = styled.Text`
  font-size: 15px;
  color: #64748b;
  line-height: 20px;
  font-weight: 500;
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

// Helper functions
const getLastMessageText = (lastMessage) => {
  if (!lastMessage) return null
  if (typeof lastMessage === 'string') return lastMessage
  if (typeof lastMessage === 'object' && lastMessage.content) {
    return lastMessage.content
  }
  return null
}

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

  const chatsContext = useContext(ChatsContext)
  const { user } = useUser()

  const { chats = [], loading, users = [], reloadChats } = chatsContext || {}

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

  // Show loading indicator when initially loading
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
        <LoadingIndicator
          type="pulse"
          size="large"
          showText={true}
          text="Loading conversations..."
          showCard={true}
          subtext="Please wait while we sync your messages"
        />
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
