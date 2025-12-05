import React from 'react'
import styled from 'styled-components/native'
import { Vibration, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const Card = styled.TouchableOpacity`
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
  elevation: 3;
`

const AvatarContainer = styled.View`
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background-color: ${(props) => props.color || '#3b82f6'};
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  position: relative;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.3;
  shadow-radius: 4px;
  elevation: 3;
  overflow: hidden;
`

const AvatarImage = styled.Image`
  width: 100%;
  height: 100%;
  border-radius: 28px;
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
  z-index: 1;
`

const Info = styled.View`
  flex: 1;
`

const CallName = styled.Text`
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 6px;
`

const Meta = styled.View`
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
`

const MetaBadge = styled.View`
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
      default:
        return '#f1f5f9'
    }
  }};
  padding: 4px 10px;
  border-radius: 12px;
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
`

const DurationBadge = styled.View`
  background-color: #dcfce7;
  padding: 4px 10px;
  border-radius: 12px;
  margin-right: 8px;
  margin-bottom: 4px;
`

const DurationText = styled.Text`
  font-size: 12px;
  font-weight: 700;
  color: #16a34a;
`

const Actions = styled.View`
  flex-direction: row;
  gap: 8px;
  margin-left: 8px;
`

const ActionButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: ${(props) => props.color || '#3b82f6'};
  align-items: center;
  justify-content: center;
  shadow-color: ${(props) => props.color || '#3b82f6'};
  shadow-offset: 0px 3px;
  shadow-opacity: 0.3;
  shadow-radius: 6px;
  elevation: 4;
`

const getStatusText = (type) => {
  switch (type) {
    case 'missed':
      return 'Missed'
    case 'rejected':
      return 'Declined'
    case 'incoming':
      return 'Incoming'
    case 'outgoing':
      return 'Outgoing'
    default:
      return ''
  }
}

const formatTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(minutes / 60)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const getStatusIcon = (type, callType) => {
  const isVideo = callType === 'video'

  switch (type) {
    case 'missed':
      return 'call-outline'
    case 'rejected':
      return 'close-circle-outline'
    case 'incoming':
      return isVideo ? 'videocam' : 'call'
    case 'outgoing':
      return isVideo ? 'videocam' : 'call'
    default:
      return isVideo ? 'videocam-outline' : 'call-outline'
  }
}

const getStatusIconColor = (type) => {
  switch (type) {
    case 'missed':
      return '#dc2626'
    case 'rejected':
      return '#d97706'
    case 'incoming':
      return '#16a34a'
    case 'outgoing':
      return '#2563eb'
    default:
      return '#64748b'
  }
}

export function CallCard({ call, onPress, onAudioCall, onVideoCall }) {
  const hasDuration =
    call.duration && call.duration !== '0:00' && call.duration !== '00:00'

  const renderAvatar = () => {
    if (call.avatar) {
      return <AvatarImage source={{ uri: call.avatar }} />
    }
    return <AvatarText>{call.name?.charAt(0)?.toUpperCase() || '?'}</AvatarText>
  }

  return (
    <Card
      onPress={() => {
        Vibration.vibrate(10)
        onPress(call)
      }}
      activeOpacity={0.7}
    >
      <AvatarContainer color={call.color}>
        {renderAvatar()}
        {call.isOnline && <OnlineIndicator />}
      </AvatarContainer>

      <Info>
        <CallName>{call.name}</CallName>
        <Meta>
          {call.type && (
            <MetaBadge type={call.type}>
              <Ionicons
                name={getStatusIcon(call.type, call.callType)}
                size={14}
                color={getStatusIconColor(call.type)}
              />
              <StatusText type={call.type}>
                {getStatusText(call.type)}
              </StatusText>
            </MetaBadge>
          )}

          {hasDuration && (
            <DurationBadge>
              <DurationText>{call.duration}</DurationText>
            </DurationBadge>
          )}

          <TimeText>{call.time || formatTime(call.createdAt)}</TimeText>
        </Meta>
      </Info>

      <Actions>
        <ActionButton
          color="#3b82f6"
          onPress={(e) => {
            e.stopPropagation()
            Vibration.vibrate(10)
            onAudioCall(call)
          }}
        >
          <Ionicons name="call" size={20} color="#fff" />
        </ActionButton>
        <ActionButton
          color="#10b981"
          onPress={(e) => {
            e.stopPropagation()
            Vibration.vibrate(10)
            onVideoCall(call)
          }}
        >
          <Ionicons name="videocam" size={20} color="#fff" />
        </ActionButton>
      </Actions>
    </Card>
  )
}
