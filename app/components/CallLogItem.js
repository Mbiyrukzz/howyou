import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  Vibration,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import styled from 'styled-components/native'

const CallLogContainer = styled.View`
  padding: 0;
  margin-bottom: 0;
`

const CallLogCard = styled.TouchableOpacity`
  background-color: #fff;
  padding: 12px 16px;
  flex-direction: row;
  align-items: center;
  border-bottom-width: 1px;
  border-bottom-color: #f0f0f0;
`

const CallIconContainer = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: ${(props) => {
    if (props.status === 'missed') return '#ffebee'
    if (props.status === 'rejected') return '#fff3e0'
    if (props.callType === 'video') return '#e8f5e9'
    return '#e3f2fd'
  }};
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`

const CallInfo = styled.View`
  flex: 1;
`

const TopRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 2px;
`

const CallTypeText = styled.Text`
  font-size: 16px;
  font-weight: 500;
  color: #000;
  flex: 1;
`

const TimeText = styled.Text`
  font-size: 13px;
  color: #667781;
  margin-left: 8px;
`

const BottomRow = styled.View`
  flex-direction: row;
  align-items: center;
`

const StatusText = styled.Text`
  font-size: 14px;
  color: ${(props) => {
    if (props.status === 'missed') return '#d32f2f'
    if (props.status === 'rejected') return '#f57c00'
    return '#667781'
  }};
  margin-left: 4px;
`

const DurationText = styled.Text`
  font-size: 14px;
  color: #667781;
  margin-left: 4px;
`

const Actions = styled.View`
  flex-direction: row;
  gap: 8px;
  margin-left: 8px;
`

const ActionButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: transparent;
  align-items: center;
  justify-content: center;
`

const getCallIcon = (callType, status, direction) => {
  const isVideo = callType === 'video'

  if (status === 'missed') {
    return {
      name: direction === 'incoming' ? 'call-outline' : 'call-outline',
      color: '#d32f2f',
      size: 24,
      statusIcon: 'arrow-down',
    }
  }

  if (status === 'rejected' || status === 'declined') {
    return {
      name: isVideo ? 'videocam-outline' : 'call-outline',
      color: '#f57c00',
      size: 24,
      statusIcon: 'close',
    }
  }

  if (status === 'cancelled') {
    return {
      name: isVideo ? 'videocam-outline' : 'call-outline',
      color: '#667781',
      size: 24,
      statusIcon: 'arrow-up',
    }
  }

  if (direction === 'incoming') {
    return {
      name: isVideo ? 'videocam' : 'call',
      color: '#00a884',
      size: 24,
      statusIcon: 'arrow-down',
    }
  }

  return {
    name: isVideo ? 'videocam' : 'call',
    color: '#00a884',
    size: 24,
    statusIcon: 'arrow-up',
  }
}

const getCallStatusText = (status, direction) => {
  if (status === 'missed') {
    return 'Missed'
  }
  if (status === 'rejected' || status === 'declined') {
    return 'Declined'
  }
  if (status === 'cancelled') {
    return 'Cancelled'
  }
  if (status === 'completed' || status === 'ended') {
    return direction === 'incoming' ? 'Incoming' : 'Outgoing'
  }
  return direction === 'incoming' ? 'Incoming' : 'Outgoing'
}

const formatCallDuration = (seconds) => {
  if (!seconds || seconds === 0) return null

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  if (mins === 0) {
    return `${secs} seconds`
  }

  if (secs === 0) {
    return `${mins} minute${mins > 1 ? 's' : ''}`
  }

  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatCallTime = (timestamp) => {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const callDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const time = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (callDate.getTime() === today.getTime()) {
    return time
  }

  if (callDate.getTime() === yesterday.getTime()) {
    return 'Yesterday'
  }

  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' })
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const CallLogItem = ({ callLog, onCallback, onDelete, onPress }) => {
  const { callType, status, direction, duration, createdAt } = callLog

  const icon = getCallIcon(callType, status, direction)
  const statusText = getCallStatusText(status, direction)
  const durationText = formatCallDuration(duration)
  const timeText = formatCallTime(createdAt)

  const callTypeDisplay = callType === 'video' ? 'Video call' : 'Voice call'

  const showCallbackButton = [
    'missed',
    'rejected',
    'declined',
    'cancelled',
  ].includes(status)

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Delete this call log?')
      if (confirmed && onDelete) {
        onDelete(callLog)
      }
    } else {
      Alert.alert(
        'Delete call log',
        'Are you sure you want to delete this call log?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => onDelete && onDelete(callLog),
          },
        ]
      )
    }
  }

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Vibration.vibrate(10)
    }
    if (onPress) {
      onPress(callLog)
    }
  }

  const handleActionPress = (action) => {
    if (Platform.OS !== 'web') {
      Vibration.vibrate(10)
    }
    if (action) {
      action()
    }
  }

  return (
    <CallLogContainer>
      <CallLogCard onPress={handlePress} activeOpacity={0.95} status={status}>
        <CallIconContainer status={status} callType={callType}>
          <Ionicons name={icon.name} size={icon.size} color={icon.color} />
        </CallIconContainer>

        <CallInfo>
          <TopRow>
            <CallTypeText>{callTypeDisplay}</CallTypeText>
            <TimeText>{timeText}</TimeText>
          </TopRow>

          <BottomRow>
            <Ionicons
              name={icon.statusIcon}
              size={16}
              color={icon.color}
              style={{
                transform: [
                  { rotate: status === 'cancelled' ? '45deg' : '0deg' },
                ],
              }}
            />
            <StatusText status={status}>{statusText}</StatusText>
            {durationText && (
              <>
                <Text style={{ color: '#667781', fontSize: 14 }}> · </Text>
                <DurationText>{durationText}</DurationText>
              </>
            )}
          </BottomRow>
        </CallInfo>

        <Actions>
          {onCallback && showCallbackButton && (
            <ActionButton
              onPress={(e) => {
                if (e && e.stopPropagation) e.stopPropagation()
                handleActionPress(onCallback)
              }}
            >
              <Ionicons
                name={callType === 'video' ? 'videocam' : 'call'}
                size={24}
                color="#00a884"
              />
            </ActionButton>
          )}

          {onDelete && (
            <ActionButton
              onPress={(e) => {
                if (e && e.stopPropagation) e.stopPropagation()
                handleDelete()
              }}
            >
              <Ionicons name="ellipsis-vertical" size={24} color="#667781" />
            </ActionButton>
          )}
        </Actions>
      </CallLogCard>
    </CallLogContainer>
  )
}

export default CallLogItem
