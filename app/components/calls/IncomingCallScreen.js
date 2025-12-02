import React from 'react'
import { Platform } from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'

const IncomingCallContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: #667eea;
  padding: 40px;
`

const IncomingAvatar = styled.View`
  width: 200px;
  height: 200px;
  border-radius: 100px;
  background-color: rgba(255, 255, 255, 0.2);
  justify-content: center;
  align-items: center;
  margin-bottom: 30px;
  border-width: 4px;
  border-color: rgba(255, 255, 255, 0.3);
`

const IncomingAvatarText = styled.Text`
  font-size: 120px;
  color: #fff;
  font-weight: 700;
`

const IncomingCallerName = styled.Text`
  color: #fff;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 10px;
  text-align: center;
`

const IncomingCallType = styled.Text`
  color: rgba(255, 255, 255, 0.9);
  font-size: 18px;
  margin-bottom: 60px;
  text-align: center;
`

const IncomingCallActions = styled.View`
  flex-direction: row;
  justify-content: space-around;
  width: 100%;
  max-width: 300px;
  margin-top: 40px;
`

const DeclineButton = styled.TouchableOpacity`
  background-color: #ef4444;
  width: 80px;
  height: 80px;
  border-radius: 40px;
  justify-content: center;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.4;
  shadow-radius: 8px;
  elevation: 8;
`

const AcceptButton = styled.TouchableOpacity`
  background-color: #10b981;
  width: 80px;
  height: 80px;
  border-radius: 40px;
  justify-content: center;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.4;
  shadow-radius: 8px;
  elevation: 8;
`

export function IncomingCallScreen({
  remoteUserName,
  callType,
  onAccept,
  onReject,
}) {
  return (
    <IncomingCallContainer>
      <IncomingAvatar>
        <IncomingAvatarText>
          {remoteUserName?.[0]?.toUpperCase() || '?'}
        </IncomingAvatarText>
      </IncomingAvatar>

      <IncomingCallerName>{remoteUserName}</IncomingCallerName>
      <IncomingCallType>
        {callType === 'video' ? 'Video Call' : 'Voice Call'}
      </IncomingCallType>

      <IncomingCallActions>
        <DeclineButton onPress={onReject}>
          <Ionicons name="close" size={36} color="#fff" />
        </DeclineButton>
        <AcceptButton onPress={onAccept}>
          <Ionicons name="call" size={36} color="#fff" />
        </AcceptButton>
      </IncomingCallActions>
    </IncomingCallContainer>
  )
}
