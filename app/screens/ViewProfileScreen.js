import React, { useState, useEffect, useContext } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import { useUser } from '../hooks/useUser'
import useChatHelpers from '../hooks/useChatHelpers'
import ChatsContext from '../contexts/ChatsContext'
import { useWebSidebar } from '../hooks/useWebSidebar'
import { usePosts } from '../providers/PostsProvider'
import SharedChatsSidebar from '../components/SharedChatsSidebar'
import ChatDetailScreen from './ChatDetailScreen' // Import ChatDetailScreen
import { useUserProfile } from '../providers/UserProfileProvider'

const { width } = Dimensions.get('window')
const MEDIA_ITEM_SIZE = (width - 64) / 3

/* =================== Styled Components =================== */

const Container = styled.View`
  flex: 1;
  background-color: #f8f9fa;
`

const ThreeColumnLayout = styled.View`
  flex: 1;
  flex-direction: row;
  background-color: #f8f9fa;
`

const Column = styled.View`
  flex: ${(props) => props.flex || 1};
  background-color: ${(props) => props.bgColor || '#fff'};
  border-right-width: ${(props) => (props.borderRight ? '1px' : '0px')};
  border-right-color: #e9ecef;
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
  background-color: ${(props) => props.color || '#3b82f6'};
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
  margin: 0 4px;
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
  margin: 12px;
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

const MediaSection = styled.View`
  background-color: #fff;
  margin: 12px;
  margin-top: 0;
  border-radius: 12px;
  overflow: hidden;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`

const MediaTabs = styled.View`
  flex-direction: row;
  background-color: #f8f9fa;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
`

const MediaTab = styled.TouchableOpacity`
  flex: 1;
  padding: 12px;
  align-items: center;
  border-bottom-width: 2px;
  border-bottom-color: ${(props) => (props.active ? '#3b82f6' : 'transparent')};
`

const MediaTabText = styled.Text`
  font-size: 14px;
  font-weight: ${(props) => (props.active ? '600' : '400')};
  color: ${(props) => (props.active ? '#3b82f6' : '#7f8c8d')};
`

const MediaGrid = styled.View`
  padding: 8px;
  flex-direction: row;
  flex-wrap: wrap;
`

const MediaItem = styled.TouchableOpacity`
  width: ${MEDIA_ITEM_SIZE}px;
  height: ${MEDIA_ITEM_SIZE}px;
  margin: 4px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f8f9fa;
  position: relative;
`

const MediaImage = styled.Image`
  width: 100%;
  height: 100%;
`

const MediaOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
`

const FileItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 12px 16px;
  border-bottom-width: 1px;
  border-bottom-color: #f8f9fa;
`

const FileIconContainer = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background-color: #e8f4fd;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`

const FileInfo = styled.View`
  flex: 1;
`

const FileName = styled.Text`
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 4px;
`

const FileSize = styled.Text`
  font-size: 12px;
  color: #7f8c8d;
`

const EmptyState = styled.View`
  padding: 40px 16px;
  align-items: center;
  justify-content: center;
`

const EmptyStateText = styled.Text`
  font-size: 14px;
  color: #95a5a6;
  text-align: center;
  margin-top: 8px;
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
  background-color: #3b82f6;
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
    '#3b82f6',
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

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const getFileIcon = (mimetype) => {
  if (mimetype?.startsWith('image/')) return 'image'
  if (mimetype?.startsWith('video/')) return 'videocam'
  if (mimetype?.startsWith('audio/')) return 'musical-notes'
  if (mimetype?.includes('pdf')) return 'document-text'
  if (mimetype?.includes('word') || mimetype?.includes('document'))
    return 'document'
  if (mimetype?.includes('sheet') || mimetype?.includes('excel')) return 'grid'
  return 'document-attach'
}

/* =================== Profile Column Component =================== */
const ProfileColumn = ({
  profileUser,
  loading,
  error,
  isOnline,
  statusText,
  lastSeenText,
  sharedMedia,
  mediaLoading,
  activeMediaTab,
  setActiveMediaTab,
  onSendMessage,
  onVoiceCall,
  onVideoCall,
  onMediaPress,
  otherUserAvatar,
}) => {
  if (loading) {
    return (
      <Column flex={1.2} borderRight bgColor="#f8f9fa">
        <LoadingContainer>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{ marginTop: 16, color: '#7f8c8d' }}>
            Loading profile...
          </Text>
        </LoadingContainer>
      </Column>
    )
  }

  if (error || !profileUser) {
    return (
      <Column flex={1.2} borderRight bgColor="#f8f9fa">
        <ErrorContainer>
          <ErrorText>{error || 'User not found'}</ErrorText>
          <RetryButton>
            <RetryButtonText>Retry</RetryButtonText>
          </RetryButton>
        </ErrorContainer>
      </Column>
    )
  }

  const userColor = getUserColor(profileUser.firebaseUid || profileUser._id)
  const filteredMedia = sharedMedia.filter((item) => {
    switch (activeMediaTab) {
      case 'images':
        return item.mimetype?.startsWith('image/')
      case 'videos':
        return item.mimetype?.startsWith('video/')
      case 'files':
        return (
          !item.mimetype?.startsWith('image/') &&
          !item.mimetype?.startsWith('video/')
        )
      default:
        return true
    }
  })

  const imageCount = sharedMedia.filter((item) =>
    item.mimetype?.startsWith('image/')
  ).length
  const videoCount = sharedMedia.filter((item) =>
    item.mimetype?.startsWith('video/')
  ).length
  const fileCount = sharedMedia.filter(
    (item) =>
      !item.mimetype?.startsWith('image/') &&
      !item.mimetype?.startsWith('video/')
  ).length

  return (
    <Column flex={1.2} borderRight bgColor="#f8f9fa">
      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileHeader>
          <AvatarContainer>
            <Avatar color={userColor}>
              {otherUserAvatar ? (
                <MediaImage
                  source={{ uri: otherUserAvatar }}
                  style={{ width: 120, height: 120, borderRadius: 60 }}
                />
              ) : (
                <AvatarText>{getInitials(profileUser.name)}</AvatarText>
              )}
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
          <ActionButton bgColor="#e8f4fd" onPress={onSendMessage}>
            <Ionicons name="chatbubble" size={20} color="#3b82f6" />
            <ActionButtonText color="#3b82f6">Message</ActionButtonText>
          </ActionButton>

          <ActionButton bgColor="#e8f4fd" onPress={onVoiceCall}>
            <Ionicons name="call" size={20} color="#3b82f6" />
            <ActionButtonText color="#3b82f6">Call</ActionButtonText>
          </ActionButton>

          <ActionButton bgColor="#e8f5e8" onPress={onVideoCall}>
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
                <Ionicons name="mail" size={20} color="#3b82f6" />
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

        <MediaSection>
          <InfoSectionHeader>
            <InfoSectionTitle>Shared Media</InfoSectionTitle>
          </InfoSectionHeader>

          <MediaTabs>
            <MediaTab
              active={activeMediaTab === 'images'}
              onPress={() => setActiveMediaTab('images')}
            >
              <MediaTabText active={activeMediaTab === 'images'}>
                Images ({imageCount})
              </MediaTabText>
            </MediaTab>
            <MediaTab
              active={activeMediaTab === 'videos'}
              onPress={() => setActiveMediaTab('videos')}
            >
              <MediaTabText active={activeMediaTab === 'videos'}>
                Videos ({videoCount})
              </MediaTabText>
            </MediaTab>
            <MediaTab
              active={activeMediaTab === 'files'}
              onPress={() => setActiveMediaTab('files')}
            >
              <MediaTabText active={activeMediaTab === 'files'}>
                Files ({fileCount})
              </MediaTabText>
            </MediaTab>
          </MediaTabs>

          {mediaLoading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text style={{ marginTop: 8, color: '#7f8c8d', fontSize: 12 }}>
                Loading media...
              </Text>
            </View>
          ) : filteredMedia.length === 0 ? (
            <EmptyState>
              <Ionicons
                name={
                  activeMediaTab === 'images'
                    ? 'images-outline'
                    : activeMediaTab === 'videos'
                    ? 'videocam-outline'
                    : 'document-outline'
                }
                size={48}
                color="#95a5a6"
              />
              <EmptyStateText>
                No{' '}
                {activeMediaTab === 'images'
                  ? 'images'
                  : activeMediaTab === 'videos'
                  ? 'videos'
                  : 'files'}{' '}
                shared yet
              </EmptyStateText>
            </EmptyState>
          ) : activeMediaTab === 'files' ? (
            <View>
              {filteredMedia.map((item, index) => (
                <FileItem key={index} onPress={() => onMediaPress(item)}>
                  <FileIconContainer>
                    <Ionicons
                      name={getFileIcon(item.mimetype)}
                      size={24}
                      color="#3b82f6"
                    />
                  </FileIconContainer>
                  <FileInfo>
                    <FileName numberOfLines={1}>
                      {item.originalname || 'Unnamed file'}
                    </FileName>
                    <FileSize>{formatFileSize(item.size)}</FileSize>
                  </FileInfo>
                  <Ionicons name="download-outline" size={20} color="#95a5a6" />
                </FileItem>
              ))}
            </View>
          ) : (
            <MediaGrid>
              {filteredMedia.map((item, index) => (
                <MediaItem key={index} onPress={() => onMediaPress(item)}>
                  <MediaImage source={{ uri: item.url }} resizeMode="cover" />
                  {activeMediaTab === 'videos' && (
                    <MediaOverlay>
                      <Ionicons name="play-circle" size={40} color="#fff" />
                    </MediaOverlay>
                  )}
                </MediaItem>
              ))}
            </MediaGrid>
          )}
        </MediaSection>
      </ScrollView>
    </Column>
  )
}

/* =================== Main Component =================== */
export default function ViewProfileScreen({ navigation, route }) {
  const { userId, chatId: initialChatId } = route?.params || {}
  const [profileUser, setProfileUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sharedMedia, setSharedMedia] = useState([])
  const [mediaLoading, setMediaLoading] = useState(false)
  const [activeMediaTab, setActiveMediaTab] = useState('images')
  const [activeChatId, setActiveChatId] = useState(initialChatId)
  const [selectedChat, setSelectedChat] = useState(null)

  const [otherUserAvatar, setOtherUserAvatar] = useState(null)

  const { getOtherUserAvatar } = useUserProfile()

  const { user: currentUser } = useUser()
  const { createPost } = usePosts()

  const {
    findUserById,
    createChat,
    initiateCall,
    deleteChat,
    chats = [],
    getMessagesForChat,
    loadMessages,
    isUserOnline,
    users = [],
    getTypingUsersForChat,
  } = useContext(ChatsContext) || {}

  const { checkUserOnline, getStatusText, getLastSeenText } =
    useChatHelpers(initialChatId)
  const isWebSidebar = useWebSidebar()

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const found = findUserById(userId)
        if (!found) throw new Error('User not found')

        setProfileUser(found)

        if (currentUser?.uid) {
          const participantId = found.firebaseUid || found._id
          const existing = chats.find((c) => {
            const parts = c.participants || []
            return (
              parts.includes(currentUser.uid) && parts.includes(participantId)
            )
          })

          if (existing) {
            setActiveChatId(existing._id || existing.id)
            setSelectedChat(existing)
          } else if (isWebSidebar) {
            const res = await createChat([currentUser.uid, participantId], null)
            if (res.success) {
              setActiveChatId(res.chat._id || res.chat.id)
              setSelectedChat(res.chat)
            }
          }
        }
      } catch (e) {
        console.error(e)
        setError(e.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId, findUserById, isWebSidebar, currentUser?.uid])

  useEffect(() => {
    const loadOtherUserAvatar = async () => {
      if (profileUser) {
        const userIdToFetch = profileUser.firebaseUid || profileUser._id
        if (userIdToFetch) {
          try {
            const avatar = await getOtherUserAvatar(userIdToFetch)
            setOtherUserAvatar(avatar)
          } catch (error) {
            console.error('Failed to load other user avatar:', error)
            setOtherUserAvatar(null)
          }
        }
      } else {
        // Clear avatar if no profile user
        setOtherUserAvatar(null)
      }
    }

    loadOtherUserAvatar()
  }, [profileUser?.firebaseUid, profileUser?._id, getOtherUserAvatar])

  // Load shared media (existing logic)
  useEffect(() => {
    const loadSharedMedia = async () => {
      if (!profileUser || !currentUser?.uid) return

      setMediaLoading(true)
      try {
        const participantId = profileUser.firebaseUid || profileUser._id
        const existingChat = chats.find((c) => {
          const parts = c.participants || []
          return (
            parts.includes(currentUser.uid) && parts.includes(participantId)
          )
        })

        if (existingChat) {
          const chatId = existingChat._id || existingChat.id
          let messages = getMessagesForChat(chatId)

          if (messages.length === 0) {
            messages = await loadMessages(chatId)
          }

          const mediaItems = []
          messages.forEach((msg) => {
            if (msg.files && msg.files.length > 0) {
              msg.files.forEach((file) => {
                mediaItems.push({
                  ...file,
                  messageId: msg._id || msg.id,
                  createdAt: msg.createdAt,
                  senderId: msg.senderId,
                })
              })
            }
          })

          mediaItems.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )
          setSharedMedia(mediaItems)
        }
      } catch (err) {
        console.error('Failed to load shared media:', err)
      } finally {
        setMediaLoading(false)
      }
    }

    loadSharedMedia()
  }, [profileUser, currentUser, chats, getMessagesForChat, loadMessages])

  /* =================== Handlers =================== */

  const handleSelectChat = (chat) => {
    const chatId = chat._id || chat.id
    setSelectedChat(chat)
    setActiveChatId(chatId)

    // Update profile user based on selected chat
    const otherParticipant = chat.participants?.find(
      (p) => p !== currentUser?.uid
    )

    const otherUser =
      chat.participantDetails?.[otherParticipant] ||
      users.find(
        (u) =>
          u._id === otherParticipant ||
          u.id === otherParticipant ||
          u.firebaseUid === otherParticipant ||
          u.uid === otherParticipant
      )

    if (otherUser) {
      setProfileUser({
        ...otherUser,
        _id: otherUser._id || otherParticipant,
        firebaseUid: otherUser.firebaseUid || otherParticipant,
        name: otherUser.name || otherUser.displayName || 'Unknown User',
      })
    }
  }

  const handleNewChat = () => {
    navigation.navigate('NewChats')
  }

  const handleDeleteChat = async (chatId) => {
    try {
      const result = await deleteChat(chatId)

      // Clear selected chat if it was deleted
      if (result && result.success && activeChatId === chatId) {
        setActiveChatId(null)
        setSelectedChat(null)
      }

      return result
    } catch (error) {
      console.error('Failed to delete chat:', error)
      return { success: false, error: error.message }
    }
  }

  const handleUploadStatus = async (asset) => {
    try {
      await createPost(asset)
    } catch (error) {
      console.error('Failed to upload status:', error)
      throw error
    }
  }

  const handleSendMessage = async () => {
    if (!profileUser || !currentUser?.uid)
      return Alert.alert('Error', 'Cannot send message')

    const participantId = profileUser.firebaseUid || profileUser._id
    const existing = chats.find((c) => {
      const parts = c.participants || []
      return parts.includes(currentUser.uid) && parts.includes(participantId)
    })

    if (existing) {
      setActiveChatId(existing._id || existing.id)
      setSelectedChat(existing)
    } else {
      const res = await createChat([currentUser.uid, participantId], null)
      if (res.success) {
        setActiveChatId(res.chat._id || res.chat.id)
        setSelectedChat(res.chat)
      } else {
        Alert.alert('Error', 'Failed to create chat')
      }
    }
  }

  const startCall = async (callType) => {
    if (!profileUser || !currentUser?.uid)
      return Alert.alert('Error', 'Cannot start call')

    const participantId = profileUser.firebaseUid || profileUser._id
    let targetChatId = activeChatId

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
  const handleMediaPress = (item) => {
    Alert.alert('Media', `View ${item.originalname || 'file'}`)
  }

  const userIdForStatus = profileUser?.firebaseUid || profileUser?._id
  const isOnline = checkUserOnline(userIdForStatus)
  const statusText = getStatusText(userIdForStatus)
  const lastSeenText = getLastSeenText(userIdForStatus)

  /* =================== Mobile View =================== */
  if (!isWebSidebar) {
    return (
      <Container>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Header>
          <BackButton onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </BackButton>
          <HeaderTitle>Profile</HeaderTitle>
        </Header>

        <ProfileColumn
          profileUser={profileUser}
          loading={loading}
          error={error}
          isOnline={isOnline}
          statusText={statusText}
          lastSeenText={lastSeenText}
          sharedMedia={sharedMedia}
          mediaLoading={mediaLoading}
          activeMediaTab={activeMediaTab}
          setActiveMediaTab={setActiveMediaTab}
          onSendMessage={handleSendMessage}
          onVoiceCall={handleVoiceCall}
          onVideoCall={handleVideoCall}
          onMediaPress={handleMediaPress}
          otherUserAvatar={otherUserAvatar}
        />
      </Container>
    )
  }

  // Web view (three-column layout)
  return (
    <Container>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ThreeColumnLayout>
        {/* Complete Self-Contained SharedChatsSidebar */}
        <SharedChatsSidebar
          chats={chats}
          selectedChatId={activeChatId}
          onSelectChat={handleSelectChat}
          currentUser={currentUser}
          isUserOnline={isUserOnline}
          users={users}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          onUploadStatus={handleUploadStatus}
          getTypingUsersForChat={getTypingUsersForChat}
          showFAB={true}
          showCameraButton={true}
          showOptionsButton={true}
        />

        {/* Use ChatDetailScreen directly - it already has all the chat functionality */}
        <Column flex={1.5} bgColor="#f8f9fa">
          <ChatDetailScreen
            navigation={navigation}
            route={{ params: { chatId: activeChatId } }}
            isInSidebar={true}
          />
        </Column>

        {/* Profile Column */}
        <ProfileColumn
          profileUser={profileUser}
          loading={loading}
          error={error}
          isOnline={isOnline}
          statusText={statusText}
          lastSeenText={lastSeenText}
          sharedMedia={sharedMedia}
          mediaLoading={mediaLoading}
          activeMediaTab={activeMediaTab}
          setActiveMediaTab={setActiveMediaTab}
          onSendMessage={handleSendMessage}
          onVoiceCall={handleVoiceCall}
          onVideoCall={handleVideoCall}
          onMediaPress={handleMediaPress}
          otherUserAvatar={otherUserAvatar}
        />
      </ThreeColumnLayout>
    </Container>
  )
}
