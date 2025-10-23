import React, { useContext, useState, useEffect } from 'react'
import {
  FlatList,
  TouchableOpacity,
  Platform,
  StatusBar,
  RefreshControl,
  Dimensions,
  Alert,
  View,
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

const Header = styled.View`
  background-color: white;
  padding: 16px 24px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.05;
  shadow-radius: 8px;
  elevation: 4;
  border-bottom-width: 1px;
  border-bottom-color: #f1f5f9;
`

const HeaderTitle = styled.Text`
  font-size: 28px;
  font-weight: 800;
  color: #3396d3;
  letter-spacing: -0.5px;
`

const CameraButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: #f1f5f9;
  justify-content: center;
  align-items: center;
`

const SearchInput = styled.TextInput`
  flex: 1;
  margin-left: 12px;
  font-size: 16px;
  color: #1e293b;
  font-weight: 500;
  border-width: 0;
  outline: none;
  text-decoration-line: none;
  background-color: transparent;
  &:focus {
    border-bottom-width: 2px;
    border-bottom-color: #3396d3;
  }
`

const SearchContainer = styled.View`
  background-color: white;
  margin: 16px 24px;
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

const SearchIcon = styled.View`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: #f1f5f9;
  justify-content: center;
  align-items: center;
`

const ChatItemContainer = styled.View`
  position: relative;
  margin: 6px 24px;
`

const ChatItem = styled.TouchableOpacity`
  background-color: white;
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

const ChatAvatar = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: ${(props) => props.color || '#3396d3'};
  justify-content: center;
  align-items: center;
  margin-right: 16px;
`

const ChatAvatarText = styled.Text`
  color: white;
  font-size: 18px;
  font-weight: bold;
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

const getUserColor = (userId) => {
  const colors = [
    '#3396d3',
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

const ChatItemComponent = ({
  item,
  onPress,
  onLongPress,
  onOptionsPress,
  users,
  currentUserId,
  showDropdown,
  onDeletePress,
}) => {
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
  const avatarColor = getUserColor(
    otherUser?._id || otherUser?.id || otherUser?.firebaseUid
  )

  const isWeb = Platform.OS === 'web'

  console.log('📱 Rendering chat item:', {
    chatId: item._id || item.id,
    chatName,
    isWeb,
    showDropdown,
  })

  return (
    <ChatItemContainer>
      <ChatItem
        onPress={() => {
          console.log('👆 Chat item pressed:', item._id || item.id)
          onPress(item)
        }}
        onLongPress={
          !isWeb
            ? () => {
                console.log('👆👆 Chat item long pressed:', item._id || item.id)
                onLongPress(item)
              }
            : undefined
        }
        delayLongPress={500}
      >
        <ChatAvatar color={avatarColor}>
          <ChatAvatarText>{getInitials(chatName)}</ChatAvatarText>
        </ChatAvatar>
        <ChatInfo>
          <ChatName>{chatName}</ChatName>
          <LastMessage numberOfLines={1}>{preview}</LastMessage>
        </ChatInfo>
        {isWeb && (
          <OptionsButton
            onPress={(e) => {
              console.log('🔘 Options button clicked')
              e.stopPropagation()
              onOptionsPress(item)
            }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#64748b" />
          </OptionsButton>
        )}
      </ChatItem>
      {isWeb && showDropdown && (
        <DropdownMenu>
          <DropdownItem
            danger
            onPress={() => {
              console.log('🗑️ Delete button in dropdown clicked')
              onDeletePress()
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#dc2626" />
            <DropdownItemText danger>Delete Chat</DropdownItemText>
          </DropdownItem>
        </DropdownMenu>
      )}
    </ChatItemContainer>
  )
}

export default function ChatsScreen({ navigation }) {
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    })
  }, [navigation])

  const [searchText, setSearchText] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)

  const chatsContext = useContext(ChatsContext)
  const { user } = useUser()

  const {
    chats = [],
    loading,
    users = [],
    reloadChats,
    deleteChat,
  } = chatsContext || {}

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
    // Close dropdown if open
    setActiveDropdown(null)

    console.log(
      'handleChatPress: Navigating to ChatDetail, chatId:',
      chat._id || chat.id
    )
    navigation.navigate('ChatDetail', {
      chatId: chat._id || chat.id,
    })
  }

  const handleNewChat = () => {
    navigation.navigate('NewChats')
  }

  const handleStoryUpload = () => {
    console.log('Opening camera for story upload...')
  }

  const handleRefresh = async () => {
    if (reloadChats) {
      setRefreshing(true)
      await reloadChats()
      setRefreshing(false)
    }
  }

  const handleDeleteChat = async (chatId, chatName) => {
    console.log('🎯 handleDeleteChat called')
    console.log('  Chat ID:', chatId)
    console.log('  Chat Name:', chatName)
    console.log('  deleteChat function exists?', !!deleteChat)

    if (!deleteChat) {
      console.error('❌ deleteChat function not available from context')
      Alert.alert('Error', 'Delete function not available')
      return
    }

    // Close dropdown
    setActiveDropdown(null)

    try {
      console.log('🚀 Calling deleteChat...')
      const result = await deleteChat(chatId)
      console.log('✅ deleteChat returned:', result)

      if (result.success) {
        Alert.alert('Success', 'Chat deleted successfully')
      } else {
        Alert.alert('Error', result.error || 'Failed to delete chat')
      }
    } catch (error) {
      console.error('❌ Delete chat error:', error)
      Alert.alert('Error', 'Failed to delete chat: ' + error.message)
    }
  }

  const handleOptionsPress = (chat) => {
    const chatId = chat._id || chat.id
    console.log('🔘 Options button pressed for chat:', chatId)
    console.log('  Current activeDropdown:', activeDropdown)
    // Toggle dropdown
    setActiveDropdown(activeDropdown === chatId ? null : chatId)
    console.log(
      '  New activeDropdown:',
      activeDropdown === chatId ? null : chatId
    )
  }

  const handleChatLongPress = (chat) => {
    const chatId = chat._id || chat.id
    const otherParticipants =
      chat.participants?.filter((id) => id !== user?.uid) || []
    const otherUser = otherParticipants.length
      ? findUserByAnyId(users, otherParticipants[0])
      : null
    const chatName = otherUser?.name || 'Unknown'

    console.log('Long press detected for chat:', chatId)

    Alert.alert(
      'Chat Options',
      `Chat with ${chatName}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Chat',
          style: 'destructive',
          onPress: () => confirmDeleteChat(chatId, chatName),
        },
      ],
      { cancelable: true }
    )
  }

  const confirmDeleteChat = (chatId, chatName) => {
    console.log('⚠️ confirmDeleteChat called')
    console.log('  Chat ID:', chatId)
    console.log('  Chat Name:', chatName)
    console.log('  Platform:', Platform.OS)

    if (Platform.OS === 'web') {
      // For web, use window.confirm
      const confirmed = window.confirm(
        `Are you sure you want to delete your chat with ${chatName}? This will delete all messages and cannot be undone.`
      )

      if (confirmed) {
        console.log('✅ User confirmed delete (web)')
        handleDeleteChat(chatId, chatName)
      } else {
        console.log('❌ User cancelled delete (web)')
      }
    } else {
      // For mobile, use Alert.alert
      Alert.alert(
        'Delete Chat',
        `Are you sure you want to delete your chat with ${chatName}? This will delete all messages and cannot be undone.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => console.log('❌ User cancelled delete'),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              console.log('✅ User confirmed delete (mobile)')
              handleDeleteChat(chatId, chatName)
            },
          },
        ]
      )
    }
  }

  const renderEmptyState = () => (
    <EmptyStateContainer>
      <EmptyStateIcon>
        <Ionicons name="chatbubbles-outline" size={60} color="#94a3b8" />
      </EmptyStateIcon>
      <EmptyStateTitle>No messages yet</EmptyStateTitle>
      <EmptyStateText>
        Connect with friends and colleagues by starting your first conversation
      </EmptyStateText>
      <EmptyStateButton onPress={handleNewChat} activeOpacity={0.8}>
        <EmptyStateButtonText>Start Messaging</EmptyStateButtonText>
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

  if (loading && chats.length === 0) {
    return (
      <Container>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <Header>
          <HeaderTitle>PeepGram</HeaderTitle>
          <CameraButton disabled activeOpacity={0.6}>
            <Ionicons name="camera-outline" size={24} color="#94a3b8" />
          </CameraButton>
        </Header>
        <SearchContainer>
          <SearchIcon>
            <Ionicons name="search-outline" size={18} color="#64748b" />
          </SearchIcon>
          <SearchInput
            placeholder="Search messages..."
            placeholderTextColor="#94a3b8"
            value={searchText}
            onChangeText={setSearchText}
            editable={false}
          />
        </SearchContainer>
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
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <Header>
          <HeaderTitle>PeepGram</HeaderTitle>
          <CameraButton disabled activeOpacity={0.6}>
            <Ionicons name="camera-outline" size={24} color="#94a3b8" />
          </CameraButton>
        </Header>
        <SearchContainer>
          <SearchIcon>
            <Ionicons name="search-outline" size={18} color="#64748b" />
          </SearchIcon>
          <SearchInput
            placeholder="Search messages..."
            placeholderTextColor="#94a3b8"
            value={searchText}
            onChangeText={setSearchText}
            editable={false}
          />
        </SearchContainer>
        {renderErrorState()}
      </Container>
    )
  }

  return (
    <Container>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <Header>
        <HeaderTitle>PeepGram</HeaderTitle>
        <CameraButton onPress={handleStoryUpload} activeOpacity={0.7}>
          <Ionicons name="camera-outline" size={24} color="#3396d3" />
        </CameraButton>
      </Header>
      <SearchContainer>
        <SearchIcon>
          <Ionicons name="search-outline" size={18} color="#64748b" />
        </SearchIcon>
        <SearchInput
          placeholder="Search messages..."
          placeholderTextColor="#94a3b8"
          value={searchText}
          onChangeText={setSearchText}
        />
      </SearchContainer>
      <FlatList
        data={filteredChats}
        keyExtractor={(item) => (item._id || item.id).toString()}
        renderItem={({ item }) => {
          const chatId = item._id || item.id
          const otherParticipants =
            item.participants?.filter((id) => id !== user?.uid) || []
          const otherUser = otherParticipants.length
            ? findUserByAnyId(users, otherParticipants[0])
            : null
          const chatName = otherUser?.name || 'Unknown'

          return (
            <ChatItemComponent
              item={item}
              onPress={handleChatPress}
              onLongPress={handleChatLongPress}
              onOptionsPress={handleOptionsPress}
              currentUserId={user?.uid}
              users={users}
              showDropdown={activeDropdown === chatId}
              onDeletePress={() => confirmDeleteChat(chatId, chatName)}
            />
          )
        }}
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
