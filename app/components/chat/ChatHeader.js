import React from 'react'
import { View, TouchableOpacity, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
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

export const ChatHeader = ({
  showBackButton,
  onBack,
  chatInfo,
  wsConnected,
  onProfilePress,
  onVideoCall,
  onAudioCall,
}) => {
  return (
    <Header>
      {showBackButton && (
        <BackButton onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </BackButton>
      )}

      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
          marginLeft: showBackButton ? 0 : 16,
        }}
        onPress={onProfilePress}
        activeOpacity={0.7}
      >
        <HeaderAvatar color={chatInfo.color}>
          {chatInfo.isOnline && (
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: '#27ae60',
                borderWidth: 2,
                borderColor: '#fff',
              }}
            />
          )}
          <HeaderAvatarText>{getInitials(chatInfo.name)}</HeaderAvatarText>
        </HeaderAvatar>

        <HeaderInfo>
          <HeaderName>{chatInfo.name}</HeaderName>
          <HeaderStatus
            style={{ color: chatInfo.isOnline ? '#27ae60' : '#95a5a6' }}
          >
            {chatInfo.status}
          </HeaderStatus>
        </HeaderInfo>
      </TouchableOpacity>

      <HeaderActions>
        <View style={{ marginRight: 8 }}>
          <Ionicons
            name={wsConnected ? 'wifi' : 'wifi-off'}
            size={16}
            color={wsConnected ? '#27ae60' : '#e74c3c'}
          />
        </View>
        <HeaderActionButton onPress={onVideoCall} bgColor="#e8f5e8">
          <Ionicons name="videocam" size={24} color="#27ae60" />
        </HeaderActionButton>
        <HeaderActionButton onPress={onAudioCall} bgColor="#e8f4fd">
          <Ionicons name="call" size={24} color="#3498db" />
        </HeaderActionButton>
      </HeaderActions>
    </Header>
  )
}
