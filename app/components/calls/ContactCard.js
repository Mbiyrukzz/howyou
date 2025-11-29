import styled from 'styled-components/native'
import { Vibration } from 'react-native'

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
  shadow-opacity: 0.05;
  shadow-radius: 4px;
  elevation: 2;
`

const ContactAvatar = styled.View`
  width: 52px;
  height: 52px;
  border-radius: 26px;
  background-color: ${(props) => props.color || '#3498db'};
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  position: relative;
`

const ContactAvatarText = styled.Text`
  color: white;
  font-size: 20px;
  font-weight: 700;
`

const ContactInfo = styled.View`
  flex: 1;
`

const ContactName = styled.Text`
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
`

const ContactStatus = styled.Text`
  font-size: 13px;
  color: ${(props) => (props.online ? '#10b981' : '#94a3b8')};
`

const ContactActions = styled.View`
  flex-direction: row;
  gap: 8px;
`

const ContactActionButton = styled.TouchableOpacity`
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
const ContactActionIcon = styled.Text`
  font-size: 20px;
`

export function ContactCard({
  contact,
  onPress,
  onAudioCall,
  onVideoCall,
  showActions = true,
}) {
  return (
    <ContactCardContainer onPress={() => onPress?.(contact)}>
      <ContactAvatar color={contact.color}>
        <ContactAvatarText>{contact.name?.charAt(0) || '?'}</ContactAvatarText>
        {contact.isOnline && <OnlineIndicator />}
      </ContactAvatar>

      <ContactInfo>
        <ContactName>{contact.name}</ContactName>
        <ContactStatus online={contact.isOnline}>
          {contact.status || 'Offline'}
        </ContactStatus>
      </ContactInfo>

      {showActions && (
        <ContactActions>
          <ContactActionButton
            color="#3498db"
            onPress={(e) => {
              e.stopPropagation()
              Vibration.vibrate(10)
              onAudioCall(contact)
            }}
          >
            <ContactActionIcon>📞</ContactActionIcon>
          </ContactActionButton>
          <ContactActionButton
            color="#10b981"
            onPress={(e) => {
              e.stopPropagation()
              Vibration.vibrate(10)
              onVideoCall(contact)
            }}
          >
            <ContactActionIcon>📹</ContactActionIcon>
          </ContactActionButton>
        </ContactActions>
      )}
    </ContactCardContainer>
  )
}
