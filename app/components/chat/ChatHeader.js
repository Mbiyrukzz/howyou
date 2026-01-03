import React, { useState } from 'react'
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
import LoadingIndicator from '../LoadingIndicator'

// Styled components
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

// NEW: Avatar image component
const HeaderAvatarImage = styled.Image`
  width: 44px;
  height: 44px;
  border-radius: 22px;
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
  const {
    name = 'Unknown',
    status = '',
    color = '#95a5a6',
    isOnline = false,
    avatar,
  } = chatInfo

  const [loading, setLoading] = useState(false)

  if (loading) {
    return <LoadingIndicator size="small" message="Loading user's details..." />
  }

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
        <HeaderAvatar color={color}>
          {avatar ? (
            <HeaderAvatarImage source={{ uri: avatar }} />
          ) : (
            <HeaderAvatarText>{getInitials(name)}</HeaderAvatarText>
          )}
          {isOnline && <OnlineIndicator />}
        </HeaderAvatar>

        <HeaderInfo>
          <HeaderName>{name}</HeaderName>
          <StatusRow>
            <StatusDot online={isOnline} />
            <HeaderStatus online={isOnline}>
              {status || (isOnline ? 'Online' : 'Offline')}
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
