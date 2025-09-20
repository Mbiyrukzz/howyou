import React, { useState, useRef, useEffect, useContext } from 'react'
import {
  FlatList,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import ChatsContext from '../contexts/ChatsContext'
import useAuthedRequest from '../hooks/useAuthedRequest'
import { useUser } from '../hooks/useUser'

const { width: screenWidth } = Dimensions.get('window')
const API_URL = 'http://10.216.188.87:5000'

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

const TypingIndicator = styled.View`
  flex-direction: row;
  align-items: center;
  margin: 8px 0;
  padding: 12px 16px;
  background-color: #fff;
  border-radius: 20px;
  max-width: 80px;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 2;
`

const TypingDot = styled(Animated.View)`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: #bdc3c7;
  margin-horizontal: 2px;
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
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.2;
  shadow-radius: 3px;
  elevation: 4;
`

const AttachmentButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  justify-content: center;
  align-items: center;
  margin-right: 8px;
`

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`

const LoadingText = styled.Text`
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

// Helper function to generate consistent colors
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

// Helper function to format time
const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Helper function to format date
const formatMessageDate = (timestamp) => {
  const date = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString()
  }
}

const TypingIndicatorComponent = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current
  const dot2 = useRef(new Animated.Value(0.3)).current
  const dot3 = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const animateDot = (dot, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: 1,
            duration: 600,
            delay,
            useNativeDriver: false,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: false,
          }),
        ])
      ).start()
    }

    animateDot(dot1, 0)
    animateDot(dot2, 200)
    animateDot(dot3, 400)
  }, [])

  return (
    <TypingIndicator>
      <TypingDot style={{ opacity: dot1 }} />
      <TypingDot style={{ opacity: dot2 }} />
      <TypingDot style={{ opacity: dot3 }} />
    </TypingIndicator>
  )
}

const MessageItem = ({ item, previousItem, currentUserId, users }) => {
  const showDate =
    !previousItem ||
    formatMessageDate(previousItem.createdAt) !==
      formatMessageDate(item.createdAt)

  const isOwn = item.senderId === currentUserId
  const sender = users.find((u) => (u._id || u.id) === item.senderId)

  return (
    <>
      {showDate && (
        <DateSeparator>
          <DateText>{formatMessageDate(item.createdAt)}</DateText>
        </DateSeparator>
      )}
      <MessageBubble isOwn={isOwn}>
        <MessageText isOwn={isOwn}>{item.content}</MessageText>
        <MessageTime isOwn={isOwn}>
          {formatMessageTime(item.createdAt)}
          {!isOwn && sender && ` • ${sender.name || 'Unknown'}`}
        </MessageTime>
        {isOwn && <MessageStatus>✓✓ sent</MessageStatus>}
      </MessageBubble>
    </>
  )
}

export default function ChatDetailScreen({ navigation, route }) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const flatListRef = useRef(null)

  const { chatId } = route?.params || {}
  const chatsContext = useContext(ChatsContext)
  const { user } = useUser()
  const { isReady, get, post } = useAuthedRequest()

  const chats = chatsContext?.chats || []
  const users = chatsContext?.users || []

  // Find the current chat
  const currentChat = chats.find((chat) => (chat._id || chat.id) === chatId)

  // Get chat participants (excluding current user)
  const participants =
    currentChat?.participants?.filter(
      (participantId) => participantId !== user?.uid
    ) || []

  // Get participant details
  const chatParticipants = participants
    .map((participantId) =>
      users.find((u) => (u._id || u.id) === participantId)
    )
    .filter(Boolean)

  // Determine chat display info
  const getChatInfo = () => {
    if (currentChat?.name) {
      // Named chat/room
      return {
        name: currentChat.name,
        status: `${currentChat.participants?.length || 0} members`,
        color: getUserColor(currentChat._id || currentChat.id),
      }
    } else if (chatParticipants.length === 1) {
      // Direct chat
      const participant = chatParticipants[0]
      return {
        name: participant?.name || 'Unknown User',
        status: participant?.online ? 'Online now' : 'Offline',
        color:
          participant?.color ||
          getUserColor(participant?._id || participant?.id),
      }
    } else {
      // Group chat
      return {
        name: chatParticipants.map((p) => p?.name || 'Unknown').join(', '),
        status: `${chatParticipants.length} members`,
        color: getUserColor(chatId),
      }
    }
  }

  const chatInfo = getChatInfo()

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  // Load messages for this chat
  const loadMessages = async () => {
    if (!isReady || !chatId) return

    try {
      setLoading(true)
      setError(null)
      const data = await get(`${API_URL}/get-messages/${chatId}`)

      // Sort messages by creation time
      const sortedMessages = (data || []).sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      )

      setMessages(sortedMessages)
    } catch (error) {
      console.error('❌ Failed to load messages:', error)
      setError('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!message.trim() || sending || !isReady) return

    try {
      setSending(true)

      const newMessage = await post(`${API_URL}/send-message`, {
        chatId,
        content: message.trim(),
      })

      if (newMessage.success) {
        setMessages((prev) => [...prev, newMessage.message])
        setMessage('')

        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true })
        }, 100)
      }
    } catch (error) {
      console.error('❌ Failed to send message:', error)
      // Could show error toast here
    } finally {
      setSending(false)
    }
  }

  const handleBack = () => {
    navigation.goBack()
  }

  const retryLoading = () => {
    loadMessages()
  }

  useEffect(() => {
    loadMessages()
  }, [chatId, isReady])

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages.length])

  if (!chatId) {
    return (
      <Container>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
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
          <LoadingText>Loading messages...</LoadingText>
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
            <HeaderStatus>Error loading</HeaderStatus>
          </HeaderInfo>
        </Header>
        <ErrorContainer>
          <ErrorText>{error}</ErrorText>
          <RetryButton onPress={retryLoading}>
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
          <HeaderActionButton>
            <Ionicons name="videocam" size={24} color="#7f8c8d" />
          </HeaderActionButton>
          <HeaderActionButton>
            <Ionicons name="call" size={24} color="#7f8c8d" />
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
          <AttachmentButton>
            <Ionicons name="add" size={24} color="#7f8c8d" />
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

          <SendButton
            disabled={!message.trim() || sending}
            onPress={sendMessage}
          >
            <Ionicons
              name={sending ? 'hourglass' : 'send'}
              size={20}
              color="#fff"
            />
          </SendButton>
        </InputContainer>
      </KeyboardAvoidingView>
    </Container>
  )
}
