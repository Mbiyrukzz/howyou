import React, { useState, useRef, useEffect } from 'react'
import styled from 'styled-components/native'
import { FlatList, KeyboardAvoidingView, Platform } from 'react-native'

const Container = styled.View`
  flex: 1;
  background-color: #1a1a2e;
`

const Header = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 60px 20px 20px 20px;
  background-color: rgba(255, 255, 255, 0.05);
  border-bottom-width: 1px;
  border-bottom-color: rgba(255, 255, 255, 0.1);
`

const BackButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.1);
  align-items: center;
  justify-content: center;
  margin-right: 16px;
`

const BackButtonText = styled.Text`
  color: white;
  font-size: 18px;
  font-weight: 600;
`

const RoomAvatar = styled.View`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: ${(props) => props.color || '#0046FF'};
  align-items: center;
  justify-content: center;
  margin-right: 12px;
`

const RoomAvatarText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: 700;
`

const HeaderInfo = styled.View`
  flex: 1;
`

const RoomName = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: white;
  margin-bottom: 2px;
`

const RoomStatus = styled.Text`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
`

const HeaderActions = styled.View`
  flex-direction: row;
  gap: 12px;
`

const ActionButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.1);
  align-items: center;
  justify-content: center;
`

const ActionButtonText = styled.Text`
  color: white;
  font-size: 16px;
`

const MessagesContainer = styled.View`
  flex: 1;
  padding: 16px;
`

const MessageBubble = styled.View`
  max-width: 80%;
  margin-bottom: 16px;
  align-self: ${(props) => (props.isOwn ? 'flex-end' : 'flex-start')};
`

const MessageHeader = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 6px;
`

const SenderAvatar = styled.View`
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background-color: ${(props) => props.color || '#0046FF'};
  align-items: center;
  justify-content: center;
  margin-right: 8px;
`

const SenderAvatarText = styled.Text`
  color: white;
  font-size: 12px;
  font-weight: 600;
`

const SenderName = styled.Text`
  font-size: 13px;
  font-weight: 600;
  color: ${(props) => (props.isOwn ? '#a5b4fc' : '#e2e8f0')};
  margin-right: 8px;
`

const MessageTime = styled.Text`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
`

const MessageContent = styled.View`
  background-color: ${(props) =>
    props.isOwn ? '#0046FF' : 'rgba(255, 255, 255, 0.08)'};
  padding: 12px 16px;
  border-radius: 18px;
  border-top-left-radius: ${(props) => (props.isOwn ? '18px' : '4px')};
  border-top-right-radius: ${(props) => (props.isOwn ? '4px' : '18px')};
  border-width: 1px;
  border-color: ${(props) =>
    props.isOwn ? '#0046FF' : 'rgba(255, 255, 255, 0.1)'};
`

const MessageText = styled.Text`
  color: white;
  font-size: 15px;
  line-height: 20px;
`

const DateSeparator = styled.View`
  align-items: center;
  margin: 20px 0;
`

const DateText = styled.Text`
  background-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 12px;
`

const InputContainer = styled.View`
  flex-direction: row;
  align-items: flex-end;
  padding: 16px 20px;
  background-color: rgba(255, 255, 255, 0.05);
  border-top-width: 1px;
  border-top-color: rgba(255, 255, 255, 0.1);
`

const InputWrapper = styled.View`
  flex: 1;
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.1);
  margin-right: 12px;
  min-height: 48px;
  justify-content: center;
`

const MessageInput = styled.TextInput`
  padding: 12px 16px;
  font-size: 16px;
  color: white;
  max-height: 120px;
`

const SendButton = styled.TouchableOpacity`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: #0046ff;
  align-items: center;
  justify-content: center;
  shadow-color: #0046ff;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 6;
`

const SendButtonText = styled.Text`
  color: white;
  font-size: 18px;
  font-weight: 600;
`

const TypingIndicator = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 8px 20px;
  background-color: rgba(255, 255, 255, 0.02);
`

const TypingText = styled.Text`
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  font-style: italic;
`

export default function RoomsDetailScreen({ route, navigation }) {
  const { room } = route?.params || {
    room: {
      id: 1,
      name: 'React Developers',
      color: '#0046FF',
      members: 1247,
      onlineMembers: 89,
    },
  }

  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'Sarah Chen',
      senderColor: '#10b981',
      content:
        'Hey everyone! Just released a new component library for React. It includes accessible form components and data visualization tools. Would love to get some feedback! 🚀',
      time: '2:34 PM',
      isOwn: false,
      date: 'Today',
    },
    {
      id: 2,
      sender: 'Alex Rodriguez',
      senderColor: '#f59e0b',
      content:
        'That sounds amazing! Do you have any examples or demos we can check out?',
      time: '2:36 PM',
      isOwn: false,
      date: 'Today',
    },
    {
      id: 3,
      sender: 'You',
      senderColor: '#0046FF',
      content:
        "I'd be interested to see the accessibility features. Are you following WCAG guidelines?",
      time: '2:38 PM',
      isOwn: true,
      date: 'Today',
    },
    {
      id: 4,
      sender: 'Sarah Chen',
      senderColor: '#10b981',
      content:
        "Absolutely! Full WCAG 2.1 AA compliance. I'll share the GitHub repo and Storybook documentation in a moment.",
      time: '2:39 PM',
      isOwn: false,
      date: 'Today',
    },
    {
      id: 5,
      sender: 'Mike Johnson',
      senderColor: '#8b5cf6',
      content:
        'This is perfect timing! We were just looking for something like this for our upcoming project.',
      time: '2:41 PM',
      isOwn: false,
      date: 'Today',
    },
  ])

  const [isTyping, setIsTyping] = useState(true)
  const flatListRef = useRef(null)

  useEffect(() => {
    // Auto-scroll to bottom on mount
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }, [])

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: 'You',
        senderColor: '#0046FF',
        content: message.trim(),
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isOwn: true,
        date: 'Today',
      }

      setMessages((prev) => [...prev, newMessage])
      setMessage('')

      // Auto-scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }

  const renderMessage = ({ item, index }) => {
    const showDateSeparator =
      index === 0 || messages[index - 1]?.date !== item.date
    const showSenderInfo =
      !item.isOwn &&
      (index === 0 ||
        messages[index - 1]?.sender !== item.sender ||
        messages[index - 1]?.isOwn)

    return (
      <>
        {showDateSeparator && (
          <DateSeparator>
            <DateText>{item.date}</DateText>
          </DateSeparator>
        )}
        <MessageBubble isOwn={item.isOwn}>
          {showSenderInfo && (
            <MessageHeader>
              <SenderAvatar color={item.senderColor}>
                <SenderAvatarText>{item.sender.charAt(0)}</SenderAvatarText>
              </SenderAvatar>
              <SenderName isOwn={item.isOwn}>{item.sender}</SenderName>
              <MessageTime>{item.time}</MessageTime>
            </MessageHeader>
          )}
          <MessageContent isOwn={item.isOwn}>
            <MessageText>{item.content}</MessageText>
          </MessageContent>
        </MessageBubble>
      </>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Container>
        <Header>
          <BackButton onPress={() => navigation?.goBack()}>
            <BackButtonText>←</BackButtonText>
          </BackButton>

          <RoomAvatar color={room.color}>
            <RoomAvatarText>{room.name.charAt(0)}</RoomAvatarText>
          </RoomAvatar>

          <HeaderInfo>
            <RoomName>{room.name}</RoomName>
            <RoomStatus>
              {room.onlineMembers} online • {room.members} members
            </RoomStatus>
          </HeaderInfo>

          <HeaderActions>
            <ActionButton>
              <ActionButtonText>📞</ActionButtonText>
            </ActionButton>
            <ActionButton>
              <ActionButtonText>⋮</ActionButtonText>
            </ActionButton>
          </HeaderActions>
        </Header>

        <MessagesContainer>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />
        </MessagesContainer>

        {isTyping && (
          <TypingIndicator>
            <TypingText>Sarah Chen is typing...</TypingText>
          </TypingIndicator>
        )}

        <InputContainer>
          <InputWrapper>
            <MessageInput
              placeholder="Type a message..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={message}
              onChangeText={setMessage}
              multiline
              textAlignVertical="center"
            />
          </InputWrapper>
          <SendButton onPress={sendMessage}>
            <SendButtonText>→</SendButtonText>
          </SendButton>
        </InputContainer>
      </Container>
    </KeyboardAvoidingView>
  )
}
