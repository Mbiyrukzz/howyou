import React from 'react'
import { Platform } from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'

const HeaderContainer = styled.View`
  padding-top: ${Platform.OS === 'ios' ? '50px' : '30px'};
  padding-horizontal: 20px;
  padding-bottom: 20px;
  flex-direction: row;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.98);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  border-bottom-width: 1px;
  border-bottom-color: #e2e8f0;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.08;
  shadow-radius: 8px;
  elevation: 3;
`

const BackButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: #f1f5f9;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
`

const HeaderInfo = styled.View`
  flex: 1;
`

const UserName = styled.Text`
  color: #1e293b;
  font-size: 18px;
  font-weight: 700;
`

const StatusContainer = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 4px;
`

const StatusDot = styled.View`
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background-color: ${(props) => (props.connected ? '#10b981' : '#94a3b8')};
  margin-right: 6px;
`

const StatusText = styled.Text`
  color: ${(props) => (props.connected ? '#16a34a' : '#64748b')};
  font-size: 14px;
  font-weight: 500;
`

const ActionButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: #f1f5f9;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
`

export function CallScreenHeader({
  remoteUserName,
  callStatus,
  callDuration,
  isConnected,
  showCameraSwitch,
  onBack,
  onSwitchCamera,
}) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`
  }

  const getStatusText = () => {
    if (isConnected) return formatDuration(callDuration)
    return callStatus
  }

  return (
    <HeaderContainer>
      <BackButton onPress={onBack}>
        <Ionicons name="chevron-back" size={24} color="#1e293b" />
      </BackButton>

      <HeaderInfo>
        <UserName>{remoteUserName || 'Unknown'}</UserName>
        <StatusContainer>
          <StatusDot connected={isConnected} />
          <StatusText connected={isConnected}>{getStatusText()}</StatusText>
        </StatusContainer>
      </HeaderInfo>

      {showCameraSwitch && (
        <ActionButton onPress={onSwitchCamera}>
          <Ionicons name="camera-reverse" size={22} color="#1e293b" />
        </ActionButton>
      )}
    </HeaderContainer>
  )
}
