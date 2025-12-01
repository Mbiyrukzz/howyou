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
  padding: 0 16px;
  margin-bottom: 12px;
`

const CallLogCard = styled.TouchableOpacity`
  background-color: #fff;
  border-radius: 16px;
  padding: 16px;
  flex-direction: row;
  align-items: center;
  border-width: 1px;
  border-color: #e2e8f0;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.08;
  shadow-radius: 8px;
  elevation: 3;
`

const CallIconContainer = styled.View`
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background-color: ${(props) => {
    if (props.status === 'missed') return '#fee2e2'
    if (props.status === 'rejected') return '#fef3c7'
    if (props.callType === 'video') return '#dcfce7'
    return '#dbeafe'
  }};
  justify-content: center;
  align-items: center;
  margin-right: 14px;
  position: relative;
  shadow-color: ${(props) => {
    if (props.status === 'missed') return '#ef4444'
    if (props.status === 'rejected') return '#f59e0b'
    if (props.callType === 'video') return '#10b981'
    return '#3b82f6'
  }};
  shadow-offset: 0px 2px;
  shadow-opacity: 0.3;
  shadow-radius: 4px;
  elevation: 3;
`

const CallInfo = styled.View`
  flex: 1;
`

const CallTypeText = styled.Text`
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 6px;
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
    switch (props.status) {
      case 'missed':
        return '#fee2e2'
      case 'rejected':
        return '#fef3c7'
      default:
        return '#dcfce7'
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
    switch (props.status) {
      case 'missed':
        return '#dc2626'
      case 'rejected':
        return '#d97706'
      default:
        return '#16a34a'
    }
  }};
  margin-left: 4px;
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

const TimeText = styled.Text`
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
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

const getCallIcon = (callType, status, direction) => {
  const isVideo = callType === 'video'

  if (status === 'missed') {
    return {
      name: isVideo ? 'videocam-off' : 'call-outline',
      color: '#dc2626',
      size: 22,
    }
  }

  if (status === 'rejected') {
    return {
      name: 'close-circle-outline',
      color: '#d97706',
      size: 22,
    }
  }

  if (direction === 'incoming') {
    return {
      name: isVideo ? 'videocam' : 'call',
      color: '#16a34a',
      size: 22,
    }
  }

  return {
    name: isVideo ? 'videocam' : 'call',
    color: '#2563eb',
    size: 22,
  }
}

const getCallStatusText = (status, direction) => {
  if (status === 'missed') {
    return direction === 'incoming' ? 'Missed' : 'Not answered'
  }
  if (status === 'rejected') {
    return direction === 'incoming' ? 'Declined' : 'Declined'
  }
  if (status === 'completed') {
    return 'Completed'
  }
  return direction === 'incoming' ? 'Incoming' : 'Outgoing'
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
  if (!timestamp) return ''

  const date = new Date(timestamp)
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

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const CallLogItem = ({ callLog, onCallback, onDelete, onPress }) => {
  const { callType, status, direction, duration, createdAt } = callLog

  const icon = getCallIcon(callType, status, direction)
  const statusText = getCallStatusText(status, direction)
  const durationText = formatCallDuration(duration)
  const timeText = formatCallTime(createdAt)

  const callTypeDisplay = callType === 'video' ? 'Video Call' : 'Voice Call'

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Are you sure you want to delete this call log?'
      )
      if (confirmed && onDelete) {
        onDelete(callLog)
      }
    } else {
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
      <CallLogCard onPress={handlePress} activeOpacity={0.7}>
        <CallIconContainer status={status} callType={callType}>
          <Ionicons name={icon.name} size={icon.size} color={icon.color} />
        </CallIconContainer>

        <CallInfo>
          <CallTypeText>{callTypeDisplay}</CallTypeText>

          <MetaRow>
            {(status === 'missed' ||
              status === 'rejected' ||
              status === 'completed') && (
              <StatusBadge status={status}>
                <Ionicons name={icon.name} size={14} color={icon.color} />
                <StatusText status={status}>{statusText}</StatusText>
              </StatusBadge>
            )}

            {durationText && (
              <DurationBadge>
                <DurationText>{durationText}</DurationText>
              </DurationBadge>
            )}

            <TimeText>{timeText}</TimeText>
          </MetaRow>
        </CallInfo>

        <Actions>
          {onCallback && (status === 'missed' || status === 'rejected') && (
            <ActionButton
              color={callType === 'video' ? '#10b981' : '#3b82f6'}
              onPress={(e) => {
                if (e && e.stopPropagation) e.stopPropagation()
                handleActionPress(onCallback)
              }}
            >
              <Ionicons
                name={callType === 'video' ? 'videocam' : 'call'}
                size={20}
                color="#fff"
              />
            </ActionButton>
          )}

          {onDelete && (
            <ActionButton
              color="#ef4444"
              onPress={(e) => {
                if (e && e.stopPropagation) e.stopPropagation()
                handleDelete()
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
            </ActionButton>
          )}
        </Actions>
      </CallLogCard>
    </CallLogContainer>
  )
}

export default CallLogItem
