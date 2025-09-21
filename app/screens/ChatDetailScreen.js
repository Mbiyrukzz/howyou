import React, { useState, useRef, useEffect, useContext } from 'react'
import {
  FlatList,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import ChatsContext from '../contexts/ChatsContext'
import useAuthedRequest from '../hooks/useAuthedRequest'
import { useUser } from '../hooks/useUser'

const { width: screenWidth } = Dimensions.get('window')
const API_URL = 'http://10.216.188.87:5000'

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

/* =================== message item =================== */
const MessageItem = ({ item, previousItem, currentUserId, users }) => {
  const showDate =
    !previousItem ||
    formatMessageDate(previousItem.createdAt) !==
      formatMessageDate(item.createdAt)

  const isOwn = item.senderId === currentUserId
  const sender = findUserByAnyId(users, item.senderId)
  const displayName = isOwn ? 'You' : sender?.name || 'Unknown'

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
          {formatMessageTime(item.createdAt)} • {displayName}
        </MessageTime>
        {isOwn && <MessageStatus>✓✓ sent</MessageStatus>}
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
  const flatListRef = useRef(null)

  const { chatId } = route?.params || {}
  const chatsContext = useContext(ChatsContext)
  const { user } = useUser()
  const { isReady, get, post } = useAuthedRequest()

  const chats = chatsContext?.chats || []
  const users = chatsContext?.users || []

  const currentChat = chats.find((chat) => (chat._id || chat.id) === chatId)

  const participants =
    currentChat?.participants?.filter((id) => id !== user?.uid) || []

  const chatParticipants = participants
    .map((id) => findUserByAnyId(users, id))
    .filter(Boolean)

  /* ---------- FIXED getChatInfo ---------- */
  const getChatInfo = () => {
    if (!currentChat) {
      return {
        name: 'Unknown Chat',
        status: '',
        color: '#95a5a6',
        isGroup: false,
      }
    }

    // Direct chat (2 participants, no custom name)
    if (currentChat.participants?.length === 2 && !currentChat.name) {
      const participant = chatParticipants[0]
      return {
        name: participant?.name || 'Unknown User',
        status: participant?.online ? 'Online now' : 'Last seen recently',
        color: participant
          ? getUserColor(participant._id || participant.id)
          : '#95a5a6',
        isGroup: false,
      }
    }

    // Named group
    if (currentChat?.name) {
      return {
        name: currentChat.name,
        status: `${currentChat.participants?.length || 0} members`,
        color: getUserColor(currentChat._id || currentChat.id),
        isGroup: true,
      }
    }

    // Fallback group
    return {
      name: chatParticipants.length
        ? chatParticipants.map((p) => p?.name || 'Unknown').join(', ')
        : 'Unknown Chat',
      status: `${chatParticipants.length} members`,
      color: getUserColor(currentChat?._id || currentChat?.id),
      isGroup: true,
    }
  }

  const chatInfo = getChatInfo()

  /* ---------- load messages ---------- */
  const loadMessages = async () => {
    if (!isReady || !chatId) return
    try {
      setLoading(true)
      setError(null)
      const data = await get(`${API_URL}/get-messages/${chatId}`)
      const sorted = (data || []).sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      )
      setMessages(sorted)
    } catch (err) {
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
        setTimeout(
          () => flatListRef.current?.scrollToEnd({ animated: true }),
          100
        )
      }
    } catch (err) {
      console.error('send error', err)
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [chatId, isReady])

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
