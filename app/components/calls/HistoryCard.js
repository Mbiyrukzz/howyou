import React from 'react'
import styled from 'styled-components/native'
import { Vibration, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const HistoryCard = styled.TouchableOpacity`
  background-color: #fff;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  border-width: 1px;
  border-color: #e2e8f0;
  flex-direction: row;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.08;
  shadow-radius: 8px;
  elevation: 2;
`

const AvatarContainer = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: ${(props) => props.color || '#3b82f6'};
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  overflow: hidden;
`

const AvatarImage = styled.Image`
  width: 100%;
  height: 100%;
  border-radius: 24px;
`

const AvatarText = styled.Text`
  color: white;
  font-size: 18px;
  font-weight: 700;
`

const Content = styled.View`
  flex: 1;
`

const NameRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
`

const ContactName = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
`

const DurationBadge = styled.View`
  background-color: #dcfce7;
  padding: 4px 8px;
  border-radius: 8px;
`

const DurationText = styled.Text`
  font-size: 12px;
  font-weight: 700;
  color: #16a34a;
`

const MetaRow = styled.View`
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
`

const StatusBadge = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: ${(props) => {
    switch (props.type) {
      case 'missed':
        return '#fee2e2'
      case 'rejected':
        return '#fef3c7'
      case 'incoming':
        return '#dcfce7'
      case 'outgoing':
        return '#dbeafe'
      case 'completed':
        return '#f0f9ff'
      default:
        return '#f1f5f9'
    }
  }};
  padding: 2px 8px;
  border-radius: 8px;
  margin-right: 8px;
  margin-bottom: 4px;
`

const StatusText = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: ${(props) => {
    switch (props.type) {
      case 'missed':
        return '#dc2626'
      case 'rejected':
        return '#d97706'
      case 'incoming':
        return '#16a34a'
      case 'outgoing':
        return '#2563eb'
      case 'completed':
        return '#0284c7'
      default:
        return '#64748b'
    }
  }};
  margin-left: 4px;
`

const TimeText = styled.Text`
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  margin-left: 4px;
`

const CallTypeIndicator = styled.View`
  flex-direction: row;
  align-items: center;
  margin-right: 8px;
  margin-bottom: 4px;
`

// Helper functions
const getContactName = (call) => {
  // Try different property names for name
  if (call.name) return call.name
  if (call.contactName) return call.contactName
  if (call.participantName) return call.participantName
  if (call.userName) return call.userName

  // If we have a participantId, show a generic name with ID
  if (call.participantId) {
    return `User ${call.participantId.substring(0, 6)}`
  }

  return 'Unknown Contact'
}

const getAvatarInitial = (name) => {
  return name?.charAt(0)?.toUpperCase() || '?'
}

const getStatusText = (type) => {
  switch (type) {
    case 'missed':
      return 'Missed'
    case 'rejected':
    case 'declined':
      return 'Declined'
    case 'incoming':
    case 'received':
      return 'Incoming'
    case 'outgoing':
    case 'sent':
      return 'Outgoing'
    case 'completed':
    case 'answered':
      return 'Completed'
    case 'ended':
      return 'Ended'
    default:
      return type?.charAt(0)?.toUpperCase() + type?.slice(1) || 'Unknown'
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'Recently'

  try {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    if (days < 7) return `${days}d ago`

    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: days < 365 ? undefined : 'numeric',
    })
  } catch (error) {
    return 'Recently'
  }
}

const getStatusIconColor = (type, callType) => {
  if (type === 'missed') return '#dc2626'
  if (type === 'rejected' || type === 'declined') return '#d97706'
  if (callType === 'video') return '#10b981'
  if (type === 'incoming' || type === 'received') return '#16a34a'
  if (type === 'outgoing' || type === 'sent') return '#2563eb'
  return '#64748b'
}

const getStatusIcon = (type, callType) => {
  const isVideo = callType === 'video'

  if (type === 'missed') return 'call-missed-outline'
  if (type === 'rejected' || type === 'declined') return 'close-circle-outline'

  if (isVideo) {
    return type === 'incoming' ? 'videocam' : 'videocam-outline'
  }

  return type === 'incoming' ? 'call' : 'call-outline'
}

const getCallTypeDisplay = (callType) => {
  return callType === 'video' ? 'Video ' : ''
}

export function CallHistoryCard({
  call,
  onPress,
  onLongPress,
  showDuration = true,
}) {
  // Extract call details with fallbacks
  const contactName = getContactName(call)
  const callType = call.callType || 'voice'
  const status = call.status || call.type
  const hasDuration =
    showDuration &&
    call.duration &&
    call.duration !== '0:00' &&
    call.duration !== '00:00' &&
    call.duration !== '0s' &&
    call.duration !== '0'

  const renderAvatar = () => {
    if (call.avatar) {
      return <AvatarImage source={{ uri: call.avatar }} />
    }

    // Try different avatar property names
    const avatarUrl = call.avatarUrl || call.avatarUri || call.image
    if (avatarUrl) {
      return <AvatarImage source={{ uri: avatarUrl }} />
    }

    return <AvatarText>{getAvatarInitial(contactName)}</AvatarText>
  }

  const handlePress = () => {
    if (onPress) {
      Vibration.vibrate(10)
      onPress(call)
    }
  }

  return (
    <HistoryCard
      onPress={handlePress}
      onLongPress={() => onLongPress?.(call)}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <AvatarContainer color={call.color}>{renderAvatar()}</AvatarContainer>

      <Content>
        <NameRow>
          <ContactName>{contactName}</ContactName>
          {hasDuration && (
            <DurationBadge>
              <DurationText>{call.duration}</DurationText>
            </DurationBadge>
          )}
        </NameRow>

        <MetaRow>
          {status && (
            <StatusBadge type={status}>
              <Ionicons
                name={getStatusIcon(status, callType)}
                size={12}
                color={getStatusIconColor(status, callType)}
              />
              <StatusText type={status}>
                {getCallTypeDisplay(callType)}
                {getStatusText(status)}
              </StatusText>
            </StatusBadge>
          )}

          <CallTypeIndicator>
            <Ionicons
              name={callType === 'video' ? 'videocam-outline' : 'call-outline'}
              size={12}
              color="#94a3b8"
            />
          </CallTypeIndicator>

          <TimeText>
            {formatDate(
              call.createdAt || call.date || call.timestamp || call.time
            )}
          </TimeText>
        </MetaRow>
      </Content>
    </HistoryCard>
  )
}
