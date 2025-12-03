import React from 'react'
import styled from 'styled-components/native'
import { Vibration } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const ContactCardContainer = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: #fff;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  border-width: 1px;
  border-color: #e2e8f0;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.08;
  shadow-radius: 8px;
  elevation: 3;
`

const ContactAvatar = styled.View`
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background-color: ${(props) => props.color || '#3b82f6'};
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  position: relative;
  shadow-color: ${(props) => props.color || '#3b82f6'};
  shadow-offset: 0px 2px;
  shadow-opacity: 0.3;
  shadow-radius: 4px;
  elevation: 3;
`

const ContactAvatarText = styled.Text`
  color: white;
  font-size: 22px;
  font-weight: 700;
`

const ContactInfo = styled.View`
  flex: 1;
`

const ContactName = styled.Text`
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 6px;
`

const ContactStatus = styled.View`
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

const ContactStatusText = styled.Text`
  font-size: 13px;
  color: ${(props) => (props.online ? '#16a34a' : '#64748b')};
  font-weight: 500;
`

const ContactActions = styled.View`
  flex-direction: row;
  gap: 8px;
  margin-left: 8px;
`

const ContactActionButton = styled.TouchableOpacity`
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

export function ContactCard({
  contact,
  onPress,
  onAudioCall,
  onVideoCall,
  onMessage,
  showActions = true,
}) {
  return (
    <ContactCardContainer
      onPress={() => {
        Vibration.vibrate(10)
        onPress?.(contact)
      }}
      activeOpacity={0.7}
    >
      <ContactAvatar color={contact.color}>
        <ContactAvatarText>{contact.name?.charAt(0) || '?'}</ContactAvatarText>
        {contact.isOnline && <OnlineIndicator />}
      </ContactAvatar>

      <ContactInfo>
        <ContactName>{contact.name}</ContactName>
        <ContactStatus>
          <StatusDot online={contact.isOnline} />
          <ContactStatusText online={contact.isOnline}>
            {contact.status || (contact.isOnline ? 'Online' : 'Offline')}
          </ContactStatusText>
        </ContactStatus>
      </ContactInfo>

      {showActions && (
        <ContactActions>
          <ContactActionButton
            color="#3b82f6"
            onPress={(e) => {
              e.stopPropagation()
              Vibration.vibrate(10)
              onAudioCall(contact)
            }}
          >
            <Ionicons name="call" size={20} color="#fff" />
          </ContactActionButton>
          <ContactActionButton
            color="#10b981"
            onPress={(e) => {
              e.stopPropagation()
              Vibration.vibrate(10)
              onVideoCall(contact)
            }}
          >
            <Ionicons name="videocam" size={20} color="#fff" />
          </ContactActionButton>
          {onMessage && (
            <ContactActionButton
              color="#8b5cf6"
              onPress={(e) => {
                e.stopPropagation()
                Vibration.vibrate(10)
                onMessage(contact)
              }}
            >
              <Ionicons name="chatbubble" size={20} color="#fff" />
            </ContactActionButton>
          )}
        </ContactActions>
      )}
    </ContactCardContainer>
  )
}
