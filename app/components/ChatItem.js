import React from 'react'
import { View, Vibration, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import styled from 'styled-components/native'

const Wrapper = styled.TouchableOpacity`
  background-color: #fff;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  border-width: 1px;
  border-color: #e2e8f0;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.08;
  shadow-radius: 8px;
  elevation: 3;
`

const Row = styled.View`
  flex-direction: row;
  align-items: center;
`

const Avatar = styled.View`
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background-color: ${(props) => props.color || '#3b82f6'};
  justify-content: center;
  align-items: center;
  margin-right: 14px;
  position: relative;
  shadow-color: ${(props) => props.color || '#3b82f6'};
  shadow-offset: 0px 2px;
  shadow-opacity: 0.3;
  shadow-radius: 4px;
  elevation: 3;
`

const AvatarText = styled.Text`
  color: white;
  font-size: 22px;
  font-weight: 700;
`

const OnlineIndicator = styled.View`
  width: 14px;
  height: 14px;
  border-radius: 7px;
  background-color: #10b981;
  position: absolute;
  bottom: 0;
  right: 0;
  border-width: 3px;
  border-color: #fff;
`

const Content = styled.View`
  flex: 1;
`

const Header = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
`

const Name = styled.Text`
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  flex: 1;
`

const TimeText = styled.Text`
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  margin-left: 8px;
`

const MessageRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`

const Message = styled.Text`
  font-size: 14px;
  color: ${(props) => (props.unread ? '#1e293b' : '#64748b')};
  font-weight: ${(props) => (props.unread ? '600' : '400')};
  flex: 1;
`

const BadgeContainer = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
`

const UnreadBadge = styled.View`
  background-color: #3b82f6;
  min-width: 22px;
  height: 22px;
  border-radius: 11px;
  justify-content: center;
  align-items: center;
  padding: 0 6px;
`

const UnreadText = styled.Text`
  color: white;
  font-size: 12px;
  font-weight: 700;
`

const TypingIndicator = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #dbeafe;
  padding: 4px 10px;
  border-radius: 12px;
  align-self: flex-start;
  margin-top: 4px;
`

const TypingDot = styled.View`
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background-color: #3b82f6;
  margin-right: 4px;
`

const TypingText = styled.Text`
  font-size: 12px;
  color: #2563eb;
  font-weight: 600;
  font-style: italic;
`

const StatusIcon = styled.View`
  margin-left: 4px;
`

// Generate consistent colors based on name
const getAvatarColor = (name) => {
  if (!name) return '#3b82f6'

  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#8b5cf6', // purple
    '#f59e0b', // amber
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
    '#14b8a6', // teal
  ]

  const charCode = name.charCodeAt(0) + name.length
  return colors[charCode % colors.length]
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'Now'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  if (days < 7) return `${days}d`

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function ChatItem({
  name,
  lastMessage,
  timestamp,
  unreadCount = 0,
  isOnline = false,
  isTyping = false,
  messageStatus, // 'sent', 'delivered', 'read'
  onPress,
}) {
  const initials = name ? name.charAt(0).toUpperCase() : '?'
  const avatarColor = getAvatarColor(name)
  const hasUnread = unreadCount > 0

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Vibration.vibrate(10)
    }
    if (onPress) {
      onPress()
    }
  }

  const getStatusIcon = () => {
    if (!messageStatus) return null

    switch (messageStatus) {
      case 'sent':
        return <Ionicons name="checkmark" size={14} color="#64748b" />
      case 'delivered':
        return <Ionicons name="checkmark-done" size={14} color="#64748b" />
      case 'read':
        return <Ionicons name="checkmark-done" size={14} color="#3b82f6" />
      default:
        return null
    }
  }

  return (
    <Wrapper onPress={handlePress} activeOpacity={0.7}>
      <Row>
        <Avatar color={avatarColor}>
          <AvatarText>{initials}</AvatarText>
          {isOnline && <OnlineIndicator />}
        </Avatar>

        <Content>
          <Header>
            <Name numberOfLines={1}>{name}</Name>
            {timestamp && <TimeText>{formatTime(timestamp)}</TimeText>}
          </Header>

          {isTyping ? (
            <TypingIndicator>
              <TypingDot />
              <TypingDot style={{ marginLeft: 0 }} />
              <TypingDot style={{ marginLeft: 0 }} />
              <TypingText>typing...</TypingText>
            </TypingIndicator>
          ) : (
            <MessageRow>
              <Message numberOfLines={1} unread={hasUnread}>
                {lastMessage}
              </Message>
              <BadgeContainer>
                {messageStatus && <StatusIcon>{getStatusIcon()}</StatusIcon>}
                {hasUnread && (
                  <UnreadBadge>
                    <UnreadText>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </UnreadText>
                  </UnreadBadge>
                )}
              </BadgeContainer>
            </MessageRow>
          )}
        </Content>
      </Row>
    </Wrapper>
  )
}
