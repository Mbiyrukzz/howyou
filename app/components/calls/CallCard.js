import React from 'react'
import styled from 'styled-components/native'
import { Vibration } from 'react-native'

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
  shadow-opacity: 0.05;
  shadow-radius: 4px;
  elevation: 2;
`

const Avatar = styled.View`
  width: 52px;
  height: 52px;
  border-radius: 26px;
  background-color: ${(props) => props.color || '#3498db'};
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  position: relative;
`

const AvatarText = styled.Text`
  color: white;
  font-size: 20px;
  font-weight: 700;
`

const OnlineIndicator = styled.View`
  width: 12px;
  height: 12px;
  border-radius: 6px;
  background-color: #10b981;
  position: absolute;
  bottom: 0;
  right: 0;
  border-width: 2px;
  border-color: #fff;
`

const Info = styled.View`
  flex: 1;
`

const CallName = styled.Text`
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
`

const Meta = styled.View`
  flex-direction: row;
  align-items: center;
`

const TypeIcon = styled.Text`
  font-size: 14px;
  margin-right: 6px;
`

const Status = styled.Text`
  font-size: 14px;
  color: ${(props) => {
    switch (props.type) {
      case 'missed':
        return '#ef4444'
      case 'rejected':
        return '#f59e0b'
      case 'incoming':
        return '#10b981'
      case 'outgoing':
        return '#3b82f6'
      default:
        return '#64748b'
    }
  }};
  margin-right: 8px;
`

const Time = styled.Text`
  font-size: 13px;
  color: #94a3b8;
`

const Actions = styled.View`
  flex-direction: row;
  gap: 8px;
`

const ActionButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: ${(props) => props.color || '#3498db'};
  align-items: center;
  justify-content: center;
  shadow-color: ${(props) => props.color || '#3498db'};
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 6;
`

const ActionIcon = styled.Text`
  font-size: 20px;
`

const getStatusText = (type) => {
  switch (type) {
    case 'missed':
      return 'Missed'
    case 'rejected':
      return 'Rejected'
    case 'incoming':
      return 'Incoming'
    case 'outgoing':
      return 'Outgoing'
    default:
      return ''
  }
}

export function CallCard({ call, onPress, onAudioCall, onVideoCall }) {
  return (
    <Card
      onPress={() => {
        Vibration.vibrate(10)
        onPress(call)
      }}
    >
      <Avatar color={call.color}>
        <AvatarText>{call.name?.charAt(0) || '?'}</AvatarText>
        {call.isOnline && <OnlineIndicator />}
      </Avatar>

      <Info>
        <CallName>{call.name}</CallName>
        <Meta>
          <TypeIcon>{call.callType === 'video' ? '📹' : '📞'}</TypeIcon>
          <Status type={call.type}>{getStatusText(call.type)}</Status>
          <Time>
            {call.duration && call.duration !== '0:00'
              ? `${call.duration} • `
              : ''}
            {call.time ||
              new Date(call.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
          </Time>
        </Meta>
      </Info>

      <Actions>
        <ActionButton
          color="#3498db"
          onPress={(e) => {
            e.stopPropagation()
            Vibration.vibrate(10)
            onAudioCall(call)
          }}
        >
          <ActionIcon>📞</ActionIcon>
        </ActionButton>
        <ActionButton
          color="#10b981"
          onPress={(e) => {
            e.stopPropagation()
            Vibration.vibrate(10)
            onVideoCall(call)
          }}
        >
          <ActionIcon>📹</ActionIcon>
        </ActionButton>
      </Actions>
    </Card>
  )
}
