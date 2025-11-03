import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import { useUser } from '../hooks/useUser'
import ChatsContext from '../contexts/ChatsContext'
import { useContext } from 'react'

const Container = styled.View`
  flex: 1;
  background-color: #f8f9fa;
`

const Header = styled.View`
  background-color: #fff;
  padding: 50px 16px 16px 16px;
  flex-direction: row;
  align-items: center;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 5;
`

const BackButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`

const ProfileContent = styled.View`
  flex: 1;
  align-items: center;
  padding: 32px 24px;
`

const Avatar = styled.View`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  background-color: ${(props) => props.color || '#3498db'};
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.15;
  shadow-radius: 8px;
  elevation: 8;
`

const AvatarText = styled.Text`
  color: #fff;
  font-size: 48px;
  font-weight: bold;
`

const Name = styled.Text`
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 6px;
`

const Status = styled.Text`
  font-size: 16px;
  color: #27ae60;
  margin-bottom: 24px;
`

const InfoSection = styled.View`
  width: 100%;
  background-color: #fff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.08;
  shadow-radius: 4px;
  elevation: 3;
`

const InfoRow = styled.View`
  flex-direction: row;
  align-items: center;
  padding-vertical: 12px;
  border-bottom-width: ${(props) => (props.last ? '0' : '1px')};
  border-bottom-color: #e9ecef;
`

const InfoLabel = styled.Text`
  font-size: 14px;
  color: #7f8c8d;
  flex: 1;
`

const InfoValue = styled.Text`
  font-size: 16px;
  color: #2c3e50;
  flex: 2;
  text-align: right;
`

const ActionButtons = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 32px;
  padding-horizontal: 24px;
`

const ActionButton = styled.TouchableOpacity`
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => props.bgColor || '#3498db'};
  padding: 14px;
  border-radius: 12px;
  margin-horizontal: 6px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 4;
`

const ActionButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin-left: 8px;
`

const getUserColor = (userId) => {
  const colors = [
    '#3498db',
    '#e74c3c',
    '#f39c12',
    '#27ae60',
    '#9b59b6',
    '#1abc9c',
    '#34495e',
    '#e67e22',
    '#2ecc71',
    '#8e44ad',
    '#16a085',
    '#f1c40f',
  ]
  const index = userId ? userId.toString().charCodeAt(0) % colors.length : 0
  return colors[index]
}

const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const findUserByAnyId = (users, targetId) => {
  return users.find(
    (u) =>
      u.firebaseUid === targetId ||
      (u._id && u._id.toString()) === targetId ||
      (u.id && u.id.toString()) === targetId
  )
}

export default function ViewProfileScreen({ navigation, route }) {
  const { userId } = route?.params || {}
  const { user: currentUser } = useUser()
  const chatsContext = useContext(ChatsContext)
  const { users = [], initiateCall, chats = [] } = chatsContext || {}

  const profileUser = findUserByAnyId(users, userId)
  const isOwnProfile = currentUser?.uid === userId

  if (!profileUser) {
    return (
      <Container>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Header>
          <BackButton onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </BackButton>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#2c3e50' }}>
            Profile
          </Text>
        </Header>
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={{ color: '#e74c3c', fontSize: 16 }}>User not found</Text>
        </View>
      </Container>
    )
  }

  const userColor = getUserColor(profileUser._id || profileUser.id)
  const displayStatus = profileUser.online ? 'Online now' : 'Last seen recently'

  // Find existing chat with this user
  const existingChat = chats.find(
    (chat) =>
      chat.participants?.includes(currentUser?.uid) &&
      chat.participants?.includes(userId)
  )

  const handleMessage = () => {
    if (existingChat) {
      navigation.navigate('ChatDetail', {
        chatId: existingChat._id || existingChat.id,
      })
    } else {
      Alert.alert(
        'Start Chat',
        `Start a new conversation with ${profileUser.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Message',
            onPress: () => {
              // In a real app, you'd create a new chat here
              navigation.navigate('Chats') // or create new chat
            },
          },
        ]
      )
    }
  }

  const handleCall = async (callType) => {
    if (!existingChat) {
      Alert.alert('No Chat', 'Start a conversation first to make a call.')
      return
    }

    try {
      const result = await initiateCall({
        chatId: existingChat._id || existingChat.id,
        callType,
        recipientId: userId,
      })

      if (result.success) {
        navigation.navigate('CallScreen', {
          chatId: existingChat._id || existingChat.id,
          remoteUserId: userId,
          remoteUserName: profileUser.name,
          callType,
        })
      } else {
        Alert.alert('Error', 'Failed to start call')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start call')
    }
  }

  return (
    <Container>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <Header>
        <BackButton onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </BackButton>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#2c3e50' }}>
          {isOwnProfile ? 'My Profile' : 'Contact Info'}
        </Text>
      </Header>

      <ProfileContent>
        <Avatar color={userColor}>
          <AvatarText>{getInitials(profileUser.name)}</AvatarText>
        </Avatar>

        <Name>{profileUser.name || 'Unknown User'}</Name>
        <Status>{displayStatus}</Status>

        <InfoSection>
          <InfoRow>
            <InfoLabel>Email</InfoLabel>
            <InfoValue>{profileUser.email || 'Not provided'}</InfoValue>
          </InfoRow>
          <InfoRow last>
            <InfoLabel>Phone</InfoLabel>
            <InfoValue>{profileUser.phone || 'Not provided'}</InfoValue>
          </InfoRow>
        </InfoSection>

        {!isOwnProfile && (
          <ActionButtons>
            <ActionButton bgColor="#3498db" onPress={handleMessage}>
              <Ionicons name="chatbubble" size={22} color="white" />
              <ActionButtonText>Message</ActionButtonText>
            </ActionButton>

            <ActionButton bgColor="#27ae60" onPress={() => handleCall('voice')}>
              <Ionicons name="call" size={22} color="white" />
              <ActionButtonText>Call</ActionButtonText>
            </ActionButton>

            <ActionButton bgColor="#9b59b6" onPress={() => handleCall('video')}>
              <Ionicons name="videocam" size={22} color="white" />
              <ActionButtonText>Video</ActionButtonText>
            </ActionButton>
          </ActionButtons>
        )}
      </ProfileContent>
    </Container>
  )
}
