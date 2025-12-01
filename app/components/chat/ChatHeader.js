import React from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import styled from 'styled-components/native'
import {
  Header,
  BackButton,
  HeaderAvatar,
  HeaderAvatarText,
  HeaderInfo,
  HeaderName,
  HeaderStatus,
  HeaderActions,
  HeaderActionButton,
} from '../../styles/chatStyles'
import { getInitials } from '../../utils/chatHelpers'

// Additional styled components for enhanced design
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

const StatusRow = styled.View`
  flex-direction: row;
  align-items: center;
`

const StatusDot = styled.View`
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background-color: ${(props) => (props.online ? '#10b981' : '#94a3b8')};
  margin-right: 6px;
`

const ConnectionBadge = styled.View`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${(props) => (props.connected ? '#10b981' : '#ef4444')};
  margin-right: 4px;
`

const ProfileTouchable = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  flex: 1;
  margin-left: ${(props) => (props.hasBackButton ? '0px' : '16px')};
`

export const ChatHeader = ({
  showBackButton = true,
  onBack,
  chatInfo = {},
  wsConnected = false,
  onProfilePress,
  onVideoCall,
  onAudioCall,
}) => {
  return (
    <Header>
      {showBackButton && (
        <BackButton onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#64748b" />
        </BackButton>
      )}

      <ProfileTouchable
        hasBackButton={showBackButton}
        onPress={onProfilePress}
        activeOpacity={0.7}
      >
        <HeaderAvatar color={chatInfo.color}>
          <HeaderAvatarText>{getInitials(chatInfo.name)}</HeaderAvatarText>
          {chatInfo.isOnline && <OnlineIndicator />}
        </HeaderAvatar>

        <HeaderInfo>
          <HeaderName>{chatInfo.name || 'Unknown'}</HeaderName>
          <StatusRow>
            <StatusDot online={chatInfo.isOnline} />
            <HeaderStatus online={chatInfo.isOnline}>
              {chatInfo.status || (chatInfo.isOnline ? 'Online' : 'Offline')}
            </HeaderStatus>
          </StatusRow>
        </HeaderInfo>
      </ProfileTouchable>

      <HeaderActions>
        <ConnectionBadge connected={wsConnected} />

        <HeaderActionButton
          onPress={onVideoCall}
          bgColor="#dcfce7"
          shadowColor="#10b981"
          activeOpacity={0.7}
        >
          <Ionicons name="videocam" size={22} color="#16a34a" />
        </HeaderActionButton>

        <HeaderActionButton
          onPress={onAudioCall}
          bgColor="#dbeafe"
          shadowColor="#3b82f6"
          activeOpacity={0.7}
        >
          <Ionicons name="call" size={22} color="#2563eb" />
        </HeaderActionButton>
      </HeaderActions>
    </Header>
  )
}
