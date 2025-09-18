import React, { useState, useRef, useEffect } from 'react'
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

const { width: screenWidth } = Dimensions.get('window')

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

// Mock messages data
const mockMessages = [
  {
    id: '1',
    text: 'Hey there! How are you doing today?',
    isOwn: false,
    timestamp: '10:30 AM',
    date: 'Today',
  },
  {
    id: '2',
    text: "I'm doing great! Just finished working on that new project. How about you?",
    isOwn: true,
    timestamp: '10:32 AM',
    status: 'read',
  },
  {
    id: '3',
    text: "That sounds awesome! I'd love to hear more about it sometime.",
    isOwn: false,
    timestamp: '10:35 AM',
  },
  {
    id: '4',
    text: "Absolutely! Let's grab coffee this weekend and I can show you some of the cool features we built.",
    isOwn: true,
    timestamp: '10:36 AM',
    status: 'read',
  },
  {
    id: '5',
    text: 'Perfect! Looking forward to it 😊',
    isOwn: false,
    timestamp: '10:40 AM',
  },
]

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

const MessageItem = ({ item, previousItem }) => {
  const showDate = !previousItem || previousItem.date !== item.date

  return (
    <>
      {showDate && (
        <DateSeparator>
          <DateText>{item.date}</DateText>
        </DateSeparator>
      )}
      <MessageBubble isOwn={item.isOwn}>
        <MessageText isOwn={item.isOwn}>{item.text}</MessageText>
        <MessageTime isOwn={item.isOwn}>{item.timestamp}</MessageTime>
        {item.isOwn && item.status && (
          <MessageStatus>✓✓ {item.status}</MessageStatus>
        )}
      </MessageBubble>
    </>
  )
}

export default function ChatDetailScreen({ navigation, route }) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState(mockMessages)
  const [isTyping, setIsTyping] = useState(true)
  const flatListRef = useRef(null)

  const chat = route?.params?.chat || {
    name: 'Sarah Johnson',
    avatarColor: '#e74c3c',
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: message.trim(),
        isOwn: true,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        date: 'Today',
        status: 'sent',
      }

      setMessages((prev) => [...prev, newMessage])
      setMessage('')

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }

  const handleBack = () => {
    navigation.goBack()
  }

  return (
    <Container>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <Header>
        <BackButton onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </BackButton>

        <HeaderAvatar color={chat.avatarColor}>
          <HeaderAvatarText>{getInitials(chat.name)}</HeaderAvatarText>
        </HeaderAvatar>

        <HeaderInfo>
          <HeaderName>{chat.name}</HeaderName>
          <HeaderStatus>Online now</HeaderStatus>
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
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <MessageItem
                item={item}
                previousItem={index > 0 ? messages[index - 1] : null}
              />
            )}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            ListFooterComponent={isTyping ? <TypingIndicatorComponent /> : null}
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
            />
          </InputWrapper>

          <SendButton disabled={!message.trim()} onPress={sendMessage}>
            <Ionicons name="send" size={20} color="#fff" />
          </SendButton>
        </InputContainer>
      </KeyboardAvoidingView>
    </Container>
  )
}
