import React from 'react'
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import styled from 'styled-components/native'

const CallLogContainer = styled.View`
  align-items: center;
  margin: 16px 0;
`

const CallLogCard = styled.View`
  background-color: #fff;
  border-radius: 12px;
  padding: 12px 16px;
  flex-direction: row;
  align-items: center;
  max-width: 300px;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 2;
  border-left-width: 4px;
  border-left-color: ${(props) => {
    if (props.status === 'missed') return '#e74c3c'
    if (props.status === 'rejected') return '#e67e22'
    return '#27ae60'
  }};
`

const CallIconContainer = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${(props) => {
    if (props.status === 'missed') return '#ffeaea'
    if (props.status === 'rejected') return '#fff3e6'
    if (props.callType === 'video') return '#e8f5e8'
    return '#e8f4fd'
  }};
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`

const CallInfo = styled.View`
  flex: 1;
`

const CallTypeText = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 2px;
`

const CallDetailsRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 2px;
`

const CallStatusText = styled.Text`
  font-size: 12px;
  color: ${(props) => {
    if (props.status === 'missed') return '#e74c3c'
    if (props.status === 'rejected') return '#e67e22'
    return '#7f8c8d'
  }};
  margin-right: 8px;
`

const CallDurationText = styled.Text`
  font-size: 12px;
  color: #7f8c8d;
`

const CallTimeText = styled.Text`
  font-size: 11px;
  color: #95a5a6;
`

const CallbackButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: #3498db;
  justify-content: center;
  align-items: center;
  margin-left: 8px;
`

const DeleteButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: #fee;
  justify-content: center;
  align-items: center;
  margin-left: 8px;
`

const getCallIcon = (callType, status, direction) => {
  const isVideo = callType === 'video'

  if (status === 'missed') {
    return {
      name: isVideo ? 'videocam-off' : 'call-outline',
      color: '#e74c3c',
      size: 20,
    }
  }

  if (status === 'rejected') {
    return {
      name: 'close-circle',
      color: '#e67e22',
      size: 20,
    }
  }

  if (direction === 'incoming') {
    return {
      name: isVideo ? 'videocam' : 'arrow-down-circle',
      color: '#27ae60',
      size: 20,
    }
  }

  return {
    name: isVideo ? 'videocam' : 'arrow-up-circle',
    color: '#3498db',
    size: 20,
  }
}

const getCallStatusText = (status, direction, duration) => {
  if (status === 'missed') {
    return direction === 'incoming' ? 'Missed call' : 'Call not answered'
  }
  if (status === 'rejected') {
    return direction === 'incoming' ? 'Declined' : 'Call declined'
  }
  if (status === 'completed' && duration > 0) {
    return 'Call ended'
  }
  return 'Call'
}

const formatCallDuration = (seconds) => {
  if (!seconds || seconds === 0) return null

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  if (mins === 0) {
    return `${secs}s`
  }

  return `${mins}m ${secs}s`
}

const formatCallTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
  })
}

const CallLogItem = ({ callLog, onCallback, onDelete }) => {
  const { callType, status, direction, duration, createdAt } = callLog

  const icon = getCallIcon(callType, status, direction)
  const statusText = getCallStatusText(status, direction, duration)
  const durationText = formatCallDuration(duration)
  const timeText = formatCallTime(createdAt)

  const callTypeDisplay = callType === 'video' ? 'Video call' : 'Voice call'
  const directionIcon = direction === 'incoming' ? '↓' : '↑'

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      // Web: Use window.confirm
      const confirmed = window.confirm(
        'Are you sure you want to delete this call log?'
      )
      if (confirmed && onDelete) {
        onDelete(callLog)
      }
    } else {
      // Mobile: Use Alert
      Alert.alert(
        'Delete Call Log',
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

  return (
    <CallLogContainer>
      <CallLogCard status={status}>
        <CallIconContainer status={status} callType={callType}>
          <Ionicons name={icon.name} size={icon.size} color={icon.color} />
        </CallIconContainer>

        <CallInfo>
          <CallTypeText>
            {directionIcon} {callTypeDisplay}
          </CallTypeText>

          <CallDetailsRow>
            <CallStatusText status={status}>{statusText}</CallStatusText>
            {durationText && (
              <CallDurationText>• {durationText}</CallDurationText>
            )}
          </CallDetailsRow>

          <CallTimeText>{timeText}</CallTimeText>
        </CallInfo>

        {/* Callback button */}
        {onCallback && (status === 'missed' || status === 'rejected') && (
          <CallbackButton onPress={onCallback}>
            <Ionicons
              name={callType === 'video' ? 'videocam' : 'call'}
              size={18}
              color="#fff"
            />
          </CallbackButton>
        )}

        {/* Delete button - Fixed for all platforms */}
        {onDelete && (
          <DeleteButton onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color="#e74c3c" />
          </DeleteButton>
        )}
      </CallLogCard>
    </CallLogContainer>
  )
}

export default CallLogItem
