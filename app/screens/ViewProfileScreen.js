import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import { useUser } from '../hooks/useUser'
import useChatHelpers from '../hooks/useChatHelpers' // <-- DIRECT HOOK
import ChatsContext from '../contexts/ChatsContext'

/* =================== Styled Components =================== */
const Container = styled.View`
  flex: 1;
  background-color: #f8f9fa;
`

const Header = styled.View`
  background-color: #fff;
  padding: ${Platform.OS === 'ios' ? '50px' : '20px'} 16px 16px 16px;
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

const HeaderTitle = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
`

const ProfileHeader = styled.View`
  background-color: #fff;
  align-items: center;
  padding: 32px 16px;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
`

const AvatarContainer = styled.View`
  position: relative;
  margin-bottom: 16px;
`

const Avatar = styled.View`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  background-color: ${(props) => props.color || '#3498db'};
  justify-content: center;
  align-items: center;
  border-width: 4px;
  border-color: #fff;
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

const OnlineBadge = styled.View`
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background-color: ${(props) => (props.online ? '#27ae60' : '#95a5a6')};
  border-width: 3px;
  border-color: #fff;
`

const ProfileName = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 8px;
`

const ProfileStatus = styled.Text`
  font-size: 14px;
  color: ${(props) => (props.online ? '#27ae60' : '#95a5a6')};
  margin-bottom: 4px;
`

const ProfileEmail = styled.Text`
  font-size: 14px;
  color: #7f8c8d;
`

const StatusMessage = styled.View`
  background-color: #f8f9fa;
  padding: 12px 16px;
  border-radius: 12px;
  margin-top: 16px;
  max-width: 80%;
`

const StatusMessageText = styled.Text`
  font-size: 14px;
  color: #2c3e50;
  text-align: center;
  font-style: italic;
`

const ActionButtons = styled.View`
  flex-direction: row;
  padding: 16px;
  background-color: #fff;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
  justify-content: space-around;
`

const ActionButton = styled.TouchableOpacity`
  align-items: center;
  flex: 1;
  padding: 12px;
  margin: 0 8px;
  background-color: ${(props) => props.bgColor || '#f8f9fa'};
  border-radius: 12px;
  flex-direction: row;
  justify-content: center;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
`

const ActionButtonText = styled.Text`
  margin-left: 8px;
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => props.color || '#2c3e50'};
`

const InfoSection = styled.View`
  background-color: #fff;
  margin: 16px;
  border-radius: 12px;
  overflow: hidden;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`

const InfoSectionHeader = styled.View`
  padding: 16px;
  background-color: #f8f9fa;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
`

const InfoSectionTitle = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
`

const InfoItem = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: #f8f9fa;
`

const InfoItemIcon = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${(props) => props.bgColor || '#e8f4fd'};
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`

const InfoItemContent = styled.View`
  flex: 1;
`

const InfoItemLabel = styled.Text`
  font-size: 12px;
  color: #7f8c8d;
  margin-bottom: 4px;
`

const InfoItemValue = styled.Text`
  font-size: 14px;
  color: #2c3e50;
  font-weight: 500;
`

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: #f8f9fa;
`

const ErrorContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px;
`

const ErrorText = styled.Text`
  color: #e74c3c;
  font-size: 16px;
  text-align: center;
  margin-bottom: 16px;
`

const RetryButton = styled.TouchableOpacity`
  background-color: #3498db;
  padding: 12px 24px;
  border-radius: 8px;
`

const RetryButtonText = styled.Text`
  color: white;
  font-weight: 600;
`

/* =================== Helper Functions =================== */
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

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/* =================== Main Component =================== */
export default function ViewProfileScreen({ navigation, route }) {
  const { userId, chatId } = route?.params || {}
  const [profileUser, setProfileUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { user: currentUser } = useUser()
  const {
    findUserById,
    createChat,
    initiateCall,
    chats = [],
  } = React.useContext(ChatsContext) || {}

  // NEW: Use the hook directly
  const { checkUserOnline, getStatusText, getLastSeenText } =
    useChatHelpers(chatId) // chatId is optional

  // -----------------------------------------------------------------
  // Load profile
  // -----------------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const found = findUserById(userId)
        if (!found) throw new Error('User not found')

        setProfileUser(found)
      } catch (e) {
        console.error(e)
        setError(e.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId, findUserById])

  // -----------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------
  const handleSendMessage = async () => {
    if (!profileUser || !currentUser?.uid)
      return Alert.alert('Error', 'Cannot send message')

    const participantId = profileUser.firebaseUid || profileUser._id
    const existing = chats.find((c) => {
      const parts = c.participants || []
      return parts.includes(currentUser.uid) && parts.includes(participantId)
    })

    if (existing) {
      navigation.navigate('ChatDetail', { chatId: existing._id || existing.id })
    } else {
      const res = await createChat([currentUser.uid, participantId], null)
      if (res.success) {
        navigation.navigate('ChatDetail', {
          chatId: res.chat._id || res.chat.id,
        })
      } else {
        Alert.alert('Error', 'Failed to create chat')
      }
    }
  }

  const startCall = async (callType) => {
    if (!profileUser || !currentUser?.uid)
      return Alert.alert('Error', 'Cannot start call')

    const participantId = profileUser.firebaseUid || profileUser._id
    let targetChatId = chatId

    if (!targetChatId) {
      const existing = chats.find((c) => {
        const parts = c.participants || []
        return parts.includes(currentUser.uid) && parts.includes(participantId)
      })
      if (existing) {
        targetChatId = existing._id || existing.id
      } else {
        const res = await createChat([currentUser.uid, participantId], null)
        if (res.success) targetChatId = res.chat._id || res.chat.id
      }
    }

    if (!targetChatId) return Alert.alert('Error', 'Cannot start call')

    const res = await initiateCall({
      chatId: targetChatId,
      callType,
      recipientId: participantId,
    })

    if (res.success) {
      navigation.navigate('CallScreen', {
        chatId: targetChatId,
        remoteUserId: participantId,
        remoteUserName: profileUser.name,
        callType,
      })
    } else {
      Alert.alert('Error', `Failed to start ${callType} call`)
    }
  }

  const handleVoiceCall = () => startCall('voice')
  const handleVideoCall = () => startCall('video')

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------
  if (loading) {
    return (
      <LoadingContainer>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={{ marginTop: 16, color: '#7f8c8d' }}>
          Loading profile...
        </Text>
      </LoadingContainer>
    )
  }

  if (error || !profileUser) {
    return (
      <Container>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Header>
          <BackButton onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </BackButton>
          <HeaderTitle>Profile</HeaderTitle>
        </Header>
        <ErrorContainer>
          <ErrorText>{error || 'User not found'}</ErrorText>
          <RetryButton
            onPress={() => navigation.replace('ViewProfile', route.params)}
          >
            <RetryButtonText>Retry</RetryButtonText>
          </RetryButton>
        </ErrorContainer>
      </Container>
    )
  }

  // -----------------------------------------------------------------
  // Status from hook
  // -----------------------------------------------------------------
  const userIdForStatus = profileUser.firebaseUid || profileUser._id
  const isOnline = checkUserOnline(userIdForStatus)
  const statusText = getStatusText(userIdForStatus)
  const lastSeenText = getLastSeenText(userIdForStatus)
  const userColor = getUserColor(userIdForStatus)

  return (
    <Container>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Header>
        <BackButton onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </BackButton>
        <HeaderTitle>Profile</HeaderTitle>
      </Header>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileHeader>
          <AvatarContainer>
            <Avatar color={userColor}>
              <AvatarText>{getInitials(profileUser.name)}</AvatarText>
            </Avatar>
            <OnlineBadge online={isOnline} />
          </AvatarContainer>

          <ProfileName>{profileUser.name || 'Unknown User'}</ProfileName>
          <ProfileStatus online={isOnline}>{statusText}</ProfileStatus>
          {profileUser.email && (
            <ProfileEmail>{profileUser.email}</ProfileEmail>
          )}

          {statusText !== 'Online' && statusText !== 'Offline' && (
            <StatusMessage>
              <StatusMessageText>"{statusText}"</StatusMessageText>
            </StatusMessage>
          )}
        </ProfileHeader>

        <ActionButtons>
          <ActionButton bgColor="#e8f4fd" onPress={handleSendMessage}>
            <Ionicons name="chatbubble" size={20} color="#3498db" />
            <ActionButtonText color="#3498db">Message</ActionButtonText>
          </ActionButton>

          <ActionButton bgColor="#e8f4fd" onPress={handleVoiceCall}>
            <Ionicons name="call" size={20} color="#3498db" />
            <ActionButtonText color="#3498db">Call</ActionButtonText>
          </ActionButton>

          <ActionButton bgColor="#e8f5e8" onPress={handleVideoCall}>
            <Ionicons name="videocam" size={20} color="#27ae60" />
            <ActionButtonText color="#27ae60">Video</ActionButtonText>
          </ActionButton>
        </ActionButtons>

        <InfoSection>
          <InfoSectionHeader>
            <InfoSectionTitle>Information</InfoSectionTitle>
          </InfoSectionHeader>

          {profileUser.email && (
            <InfoItem>
              <InfoItemIcon bgColor="#e8f4fd">
                <Ionicons name="mail" size={20} color="#3498db" />
              </InfoItemIcon>
              <InfoItemContent>
                <InfoItemLabel>Email</InfoItemLabel>
                <InfoItemValue>{profileUser.email}</InfoItemValue>
              </InfoItemContent>
            </InfoItem>
          )}

          {profileUser.phone && (
            <InfoItem>
              <InfoItemIcon bgColor="#e8f5e8">
                <Ionicons name="call" size={20} color="#27ae60" />
              </InfoItemIcon>
              <InfoItemContent>
                <InfoItemLabel>Phone</InfoItemLabel>
                <InfoItemValue>{profileUser.phone}</InfoItemValue>
              </InfoItemContent>
            </InfoItem>
          )}

          <InfoItem>
            <InfoItemIcon bgColor="#fff5e6">
              <Ionicons name="calendar" size={20} color="#f39c12" />
            </InfoItemIcon>
            <InfoItemContent>
              <InfoItemLabel>Joined</InfoItemLabel>
              <InfoItemValue>{formatDate(profileUser.createdAt)}</InfoItemValue>
            </InfoItemContent>
          </InfoItem>

          {!isOnline && (
            <InfoItem>
              <InfoItemIcon bgColor="#f8f9fa">
                <Ionicons name="time" size={20} color="#95a5a6" />
              </InfoItemIcon>
              <InfoItemContent>
                <InfoItemLabel>Last seen</InfoItemLabel>
                <InfoItemValue>{lastSeenText}</InfoItemValue>
              </InfoItemContent>
            </InfoItem>
          )}

          {isOnline && (
            <InfoItem>
              <InfoItemIcon bgColor="#e8f5e8">
                <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
              </InfoItemIcon>
              <InfoItemContent>
                <InfoItemLabel>Status</InfoItemLabel>
                <InfoItemValue>Active now</InfoItemValue>
              </InfoItemContent>
            </InfoItem>
          )}
        </InfoSection>
      </ScrollView>
    </Container>
  )
}
