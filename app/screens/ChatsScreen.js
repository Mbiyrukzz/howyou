// screens/ChatsScreen.js - Updated with sidebar layout
import React, { useContext, useState, useEffect } from 'react'
import {
  FlatList,
  TouchableOpacity,
  Platform,
  StatusBar,
  RefreshControl,
  Dimensions,
  Alert,
  View,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as ImagePicker from 'expo-image-picker'

import ChatDetailScreen from './ChatDetailScreen'

import ChatsContext from '../contexts/ChatsContext'
import { useUser } from '../hooks/useUser'
import { usePosts } from '../providers/PostsProvider'
import WebSidebarLayout, {
  shouldShowSidebar,
} from '../components/WebSidebarLayout'
import { useWebNavigation } from '../navigation/WebNavigationHandler'
import LoadingIndicator from '../components/LoadingIndicator'

const { width: screenWidth } = Dimensions.get('window')

// ─── Styled Components ────────────────────────────────
const Container = styled.View`
  flex: 1;
  background-color: #f8fafc;
`

const Header = styled.View`
  background-color: white;
  padding: 16px 24px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.05;
  shadow-radius: 8px;
  elevation: 4;
  border-bottom-width: 1px;
  border-bottom-color: #f1f5f9;
`

const HeaderTitle = styled.Text`
  font-size: 28px;
  font-weight: 800;
  color: #3396d3;
  letter-spacing: -0.5px;
`

const CameraButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: #f1f5f9;
  justify-content: center;
  align-items: center;
`

const SearchInput = styled.TextInput`
  flex: 1;
  margin-left: 12px;
  font-size: 16px;
  color: #1e293b;
  font-weight: 500;
  border-width: 0;
  outline: none;
  text-decoration-line: none;
  background-color: transparent;
  &:focus {
    border-bottom-width: 2px;
    border-bottom-color: #3396d3;
  }
`

const SearchContainer = styled.View`
  background-color: white;
  margin: 16px 24px;
  padding: 16px 20px;
  border-radius: 16px;
  flex-direction: row;
  align-items: center;
  shadow-color: #3396d3;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.15;
  shadow-radius: 12px;
  elevation: 8;
  border: 1px solid rgba(102, 126, 234, 0.1);
`

const SearchIcon = styled.View`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: #f1f5f9;
  justify-content: center;
  align-items: center;
`

const ChatItemContainer = styled.View`
  position: relative;
  margin: 6px 24px;
`

const ChatItem = styled.TouchableOpacity`
  background-color: white;
  padding: 20px;
  border-radius: 20px;
  flex-direction: row;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.08;
  shadow-radius: 8px;
  elevation: 4;
  border: 1px solid #f1f5f9;
  ${(props) =>
    props.selected &&
    `
    background-color: #e3f2fd;
    border-color: #3396d3;
  `}
`

const ChatAvatar = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: ${(props) => props.color || '#3396d3'};
  justify-content: center;
  align-items: center;
  margin-right: 16px;
`

const ChatAvatarText = styled.Text`
  color: white;
  font-size: 18px;
  font-weight: bold;
`

const ChatInfo = styled.View`
  flex: 1;
`

const ChatName = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 6px;
`

const LastMessage = styled.Text`
  font-size: 15px;
  color: #64748b;
  line-height: 20px;
  font-weight: 500;
`

const OptionsButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: #f1f5f9;
  justify-content: center;
  align-items: center;
  margin-left: 8px;
`

const DropdownMenu = styled.View`
  position: absolute;
  right: 20px;
  top: 60px;
  background-color: white;
  border-radius: 12px;
  padding: 8px 0;
  min-width: 180px;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.15;
  shadow-radius: 12px;
  elevation: 8;
  border: 1px solid #f1f5f9;
  z-index: 1000;
`

const DropdownItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 12px 16px;
  background-color: ${(props) => (props.danger ? '#fef2f2' : 'transparent')};
`

const DropdownItemText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => (props.danger ? '#dc2626' : '#1e293b')};
  margin-left: 12px;
`

const FloatingActionButton = styled.TouchableOpacity`
  position: absolute;
  right: 24px;
  bottom: 32px;
  width: 64px;
  height: 64px;
  border-radius: 32px;
  justify-content: center;
  align-items: center;
  shadow-color: #3396d3;
  shadow-offset: 0px 6px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 12;
`

const FABGradient = styled(LinearGradient).attrs({
  colors: ['#3396D3', '#3396D3'],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
})`
  width: 64px;
  height: 64px;
  border-radius: 32px;
  justify-content: center;
  align-items: center;
`

const EmptyStateContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 48px;
`

const EmptyStateIcon = styled.View`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  background-color: #f1f5f9;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
`

const EmptyStateTitle = styled.Text`
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
  text-align: center;
`

const EmptyStateText = styled.Text`
  font-size: 16px;
  color: #64748b;
  text-align: center;
  line-height: 24px;
  margin-bottom: 32px;
`

const EmptyStateButton = styled.TouchableOpacity`
  background-color: #3396d3;
  padding: 16px 32px;
  border-radius: 16px;
  shadow-color: #3396d3;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 6px;
  elevation: 6;
`

const EmptyStateButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: 700;
`

const ErrorContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 48px;
`

const ErrorIcon = styled.View`
  width: 100px;
  height: 100px;
  border-radius: 50px;
  background-color: #fee2e2;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
`

const ErrorTitle = styled.Text`
  font-size: 22px;
  font-weight: 700;
  color: #dc2626;
  margin-bottom: 8px;
  text-align: center;
`

const ErrorText = styled.Text`
  font-size: 16px;
  color: #64748b;
  text-align: center;
  margin-bottom: 32px;
  line-height: 24px;
`

const RetryButton = styled.TouchableOpacity`
  background-color: #dc2626;
  padding: 16px 32px;
  border-radius: 16px;
  shadow-color: #dc2626;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 6px;
  elevation: 6;
`

const RetryButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: 700;
`

// ─── Camera Modal Components ────────────────────────────────
const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
`

const ModalContent = styled.View`
  background-color: #fff;
  border-radius: 20px;
  width: 85%;
  max-width: 350px;
  padding: 24px;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 10;
`

const ModalTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: #2c3e50;
  text-align: center;
  margin-bottom: 8px;
`

const ModalSubtitle = styled.Text`
  font-size: 14px;
  color: #7f8c8d;
  text-align: center;
  margin-bottom: 24px;
`

const ModalButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  background-color: ${(props) => props.bgColor || '#f8f9fa'};
  margin-bottom: 12px;
`

const ModalButtonText = styled.Text`
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => props.color || '#2c3e50'};
  margin-left: 12px;
`

const ModalCancelButton = styled.TouchableOpacity`
  padding: 16px;
  align-items: center;
`

const ModalCancelText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #7f8c8d;
`

const CameraActionModal = ({ visible, onClose, onCamera, onGallery }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <TouchableWithoutFeedback onPress={onClose}>
      <ModalOverlay>
        <TouchableWithoutFeedback>
          <ModalContent>
            <ModalTitle>Upload Status</ModalTitle>
            <ModalSubtitle>
              Choose how you want to add your status
            </ModalSubtitle>
            <ModalButton bgColor="#e3f2fd" onPress={onCamera}>
              <Ionicons name="camera" size={24} color="#2196f3" />
              <ModalButtonText color="#2196f3">Take Photo</ModalButtonText>
            </ModalButton>
            <ModalButton bgColor="#f0f4ff" onPress={onGallery}>
              <Ionicons name="images" size={24} color="#5e72e4" />
              <ModalButtonText color="#5e72e4">
                Choose from Gallery
              </ModalButtonText>
            </ModalButton>
            <ModalCancelButton onPress={onClose}>
              <ModalCancelText>Cancel</ModalCancelText>
            </ModalCancelButton>
          </ModalContent>
        </TouchableWithoutFeedback>
      </ModalOverlay>
    </TouchableWithoutFeedback>
  </Modal>
)

// ─── Helper Functions ────────────────────────────────
const getLastMessageText = (lastMessage) => {
  if (!lastMessage) return null
  if (typeof lastMessage === 'string') return lastMessage
  if (typeof lastMessage === 'object' && lastMessage.content)
    return lastMessage.content
  return null
}

const findUserByAnyId = (users, id) => {
  if (!users || !id) return null
  return (
    users.find((u) => u._id === id || u.id === id || u.firebaseUid === id) ||
    null
  )
}

const getUserColor = (userId) => {
  const colors = [
    '#3396d3',
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

// ─── Chat Item Component ────────────────────────────────
const ChatItemComponent = ({
  item,
  onPress,
  onLongPress,
  onOptionsPress,
  users,
  currentUserId,
  showDropdown,
  onDeletePress,
  selected,
}) => {
  const otherParticipants =
    item.participants?.filter((id) => id !== currentUserId) || []
  const otherUser = otherParticipants.length
    ? findUserByAnyId(users, otherParticipants[0])
    : null
  const chatName = otherUser?.name || 'Unknown'
  const lastMsg = item.lastMessage
  const isOwn = lastMsg?.senderId === currentUserId
  const preview = lastMsg
    ? `${isOwn ? 'You' : chatName}: ${getLastMessageText(lastMsg)}`
    : 'No messages yet - start the conversation!'
  const avatarColor = getUserColor(
    otherUser?._id || otherUser?.id || otherUser?.firebaseUid
  )

  const isWeb = Platform.OS === 'web'

  return (
    <ChatItemContainer>
      <ChatItem
        onPress={() => onPress(item)}
        onLongPress={!isWeb ? () => onLongPress(item) : undefined}
        delayLongPress={500}
        selected={selected}
      >
        <ChatAvatar color={avatarColor}>
          <ChatAvatarText>{getInitials(chatName)}</ChatAvatarText>
        </ChatAvatar>
        <ChatInfo>
          <ChatName>{chatName}</ChatName>
          <LastMessage numberOfLines={1}>{preview}</LastMessage>
        </ChatInfo>
        {isWeb && (
          <OptionsButton
            onPress={(e) => {
              e.stopPropagation()
              onOptionsPress(item)
            }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#64748b" />
          </OptionsButton>
        )}
      </ChatItem>
      {isWeb && showDropdown && (
        <DropdownMenu>
          <DropdownItem danger onPress={onDeletePress}>
            <Ionicons name="trash-outline" size={20} color="#dc2626" />
            <DropdownItemText danger>Delete Chat</DropdownItemText>
          </DropdownItem>
        </DropdownMenu>
      )}
    </ChatItemContainer>
  )
}

// ─── Main ChatsScreen ────────────────────────────────
export default function ChatsScreen({ navigation, route }) {
  const [selectedChatId, setSelectedChatId] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [cameraModalVisible, setCameraModalVisible] = useState(false)
  const [uploading, setUploading] = useState(false)

  const chatsContext = useContext(ChatsContext)
  const { user } = useUser()
  const { createPost } = usePosts()

  const {
    chats = [],
    loading,
    users = [],
    reloadChats,
    deleteChat,
  } = chatsContext || {}

  useWebNavigation((type, id) => {
    if (type === 'chat') {
      setSelectedChatId(id || null)
    }
  })

  // Deep linking: Set selected chat from route
  const routeChatId = route?.params?.chatId
  useEffect(() => {
    if (routeChatId && !shouldShowSidebar) {
      // Only apply on mobile (web uses URL)
      setSelectedChatId(routeChatId)
    }
  }, [routeChatId])

  // Filter chats
  const filteredChats = chats.filter((chat) => {
    if (!searchText) return true
    const otherParticipants =
      chat.participants?.filter((id) => id !== user?.uid) || []
    return otherParticipants.some((id) => {
      const participant = findUserByAnyId(users, id)
      return participant?.name?.toLowerCase().includes(searchText.toLowerCase())
    })
  })

  // ─── Handlers ────────────────────────────────

  const handleChatPress = (chat) => {
    const chatId = chat._id || chat.id
    setActiveDropdown(null)

    if (shouldShowSidebar) {
      setSelectedChatId(chatId)
      if (Platform.OS === 'web') {
        window.history.pushState({}, '', `/chats/${chatId}`)
      }
    } else {
      navigation.navigate('ChatDetail', { chatId })
    }
  }

  const handleNewChat = () => navigation.navigate('NewChats')
  const handleCameraPress = () => setCameraModalVisible(true)

  const handleTakePhoto = async () => {
    setCameraModalVisible(false)
    if (Platform.OS === 'web') {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*,video/*'
      input.capture = 'environment'
      input.onchange = async (e) => {
        const file = e.target.files[0]
        if (file) {
          const uri = URL.createObjectURL(file)
          await uploadStatus({ uri, type: file.type, fileName: file.name })
        }
      }
      input.click()
      return
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to take photos')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
      allowsEditing: true,
    })

    if (!result.canceled && result.assets[0]) {
      await uploadStatus(result.assets[0])
    }
  }

  const handleChooseFromGallery = async () => {
    setCameraModalVisible(false)
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to choose images')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
      allowsEditing: true,
    })

    if (!result.canceled && result.assets[0]) {
      await uploadStatus(result.assets[0])
    }
  }

  const uploadStatus = async (asset) => {
    setUploading(true)
    try {
      await createPost(asset)
      Alert.alert('Success', 'Status uploaded successfully!')
    } catch (error) {
      console.error('Failed to upload status:', error)
      if (error.status === 429 || error.message?.includes('Daily limit')) {
        Alert.alert(
          'Daily Limit Reached',
          'You can only post 5 statuses per day. Try again tomorrow!'
        )
      } else {
        Alert.alert('Error', error.message || 'Failed to upload status')
      }
    } finally {
      setUploading(false)
    }
  }

  const handleRefresh = async () => {
    if (reloadChats) {
      setRefreshing(true)
      await reloadChats()
      setRefreshing(false)
    }
  }

  const handleDeleteChat = async (chatId, chatName) => {
    if (!deleteChat)
      return Alert.alert('Error', 'Delete function not available')
    setActiveDropdown(null)
    try {
      const result = await deleteChat(chatId)
      if (result.success) {
        Alert.alert('Success', 'Chat deleted successfully')
        if (selectedChatId === chatId) setSelectedChatId(null)
      } else {
        Alert.alert('Error', result.error || 'Failed to delete chat')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete chat: ' + error.message)
    }
  }

  const handleOptionsPress = (chat) => {
    const chatId = chat._id || chat.id
    setActiveDropdown(activeDropdown === chatId ? null : chatId)
  }

  const confirmDeleteChat = (chatId, chatName) => {
    if (Platform.OS === 'web') {
      if (
        window.confirm(`Delete chat with ${chatName}? This cannot be undone.`)
      ) {
        handleDeleteChat(chatId, chatName)
      }
    } else {
      Alert.alert(
        'Delete Chat',
        `Delete chat with ${chatName}? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => handleDeleteChat(chatId, chatName),
          },
        ]
      )
    }
  }

  // ─── Render Helpers ────────────────────────────────
  const renderEmptyState = () => (
    <EmptyStateContainer>
      <EmptyStateIcon>
        <Ionicons name="chatbubbles-outline" size={60} color="#94a3b8" />
      </EmptyStateIcon>
      <EmptyStateTitle>No messages yet</EmptyStateTitle>
      <EmptyStateText>
        Connect with friends and colleagues by starting your first conversation
      </EmptyStateText>
      <EmptyStateButton onPress={handleNewChat}>
        <EmptyStateButtonText>Start Messaging</EmptyStateButtonText>
      </EmptyStateButton>
    </EmptyStateContainer>
  )

  const renderErrorState = () => (
    <ErrorContainer>
      <ErrorIcon>
        <Ionicons name="alert-circle-outline" size={50} color="#dc2626" />
      </ErrorIcon>
      <ErrorTitle>Connection Error</ErrorTitle>
      <ErrorText>
        Unable to load your conversations. Please check your internet connection
        and try again.
      </ErrorText>
      <RetryButton onPress={handleRefresh}>
        <RetryButtonText>Try Again</RetryButtonText>
      </RetryButton>
    </ErrorContainer>
  )

  const renderChatList = () => {
    if (loading && chats.length === 0) {
      return (
        <Container>
          <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
          <Header>
            <HeaderTitle>PeepGram</HeaderTitle>
            <CameraButton disabled>
              <Ionicons name="camera-outline" size={24} color="#94a3b8" />
            </CameraButton>
          </Header>
          <SearchContainer>
            <SearchIcon>
              <Ionicons name="search-outline" size={18} color="#64748b" />
            </SearchIcon>
            <SearchInput
              placeholder="Search messages..."
              placeholderTextColor="#94a3b8"
              editable={false}
            />
          </SearchContainer>
          <LoadingIndicator
            type="pulse"
            size="large"
            showText
            text="Loading conversations..."
            showCard
            subtext="Please wait while we sync your messages"
          />
        </Container>
      )
    }

    if (!chatsContext) return renderErrorState()

    return (
      <Container>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <Header>
          <HeaderTitle>PeepGram</HeaderTitle>
          <CameraButton onPress={handleCameraPress} disabled={uploading}>
            <Ionicons
              name="camera-outline"
              size={24}
              color={uploading ? '#94a3b8' : '#3396d3'}
            />
          </CameraButton>
        </Header>
        <SearchContainer>
          <SearchIcon>
            <Ionicons name="search-outline" size={18} color="#64748b" />
          </SearchIcon>
          <SearchInput
            placeholder="Search messages..."
            placeholderTextColor="#94a3b8"
            value={searchText}
            onChangeText={setSearchText}
          />
        </SearchContainer>
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => (item._id || item.id).toString()}
          renderItem={({ item }) => {
            const chatId = item._id || item.id
            const otherParticipants =
              item.participants?.filter((id) => id !== user?.uid) || []
            const otherUser = otherParticipants.length
              ? findUserByAnyId(users, otherParticipants[0])
              : null
            const chatName = otherUser?.name || 'Unknown'

            return (
              <ChatItemComponent
                item={item}
                onPress={handleChatPress}
                onLongPress={() => confirmDeleteChat(chatId, chatName)}
                onOptionsPress={handleOptionsPress}
                currentUserId={user?.uid}
                users={users}
                showDropdown={activeDropdown === chatId}
                onDeletePress={() => confirmDeleteChat(chatId, chatName)}
                selected={shouldShowSidebar && selectedChatId === chatId}
              />
            )
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#3396D3']}
              tintColor="#3396D3"
            />
          }
        />
        <FloatingActionButton onPress={handleNewChat}>
          <FABGradient>
            <Ionicons name="add" size={28} color="white" />
          </FABGradient>
        </FloatingActionButton>

        <CameraActionModal
          visible={cameraModalVisible}
          onClose={() => setCameraModalVisible(false)}
          onCamera={handleTakePhoto}
          onGallery={handleChooseFromGallery}
        />

        {uploading && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <LoadingIndicator
              type="pulse"
              size="large"
              showText
              text="Uploading status..."
              showCard
            />
          </View>
        )}
      </Container>
    )
  }

  const renderChatDetail = () => {
    if (!selectedChatId) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 32,
          }}
        >
          <Ionicons name="chatbubble-outline" size={64} color="#94a3b8" />
          <EmptyStateTitle style={{ marginTop: 16 }}>
            Select a chat
          </EmptyStateTitle>
          <EmptyStateText>
            Choose a conversation from the list to start messaging
          </EmptyStateText>
        </View>
      )
    }

    return (
      <ChatDetailScreen
        navigation={navigation}
        route={{ params: { chatId: selectedChatId } }}
        isInSidebar={true}
      />
    )
  }

  // ─── Mobile: Full Screen List ────────────────────────────────
  if (!shouldShowSidebar) {
    return renderChatList()
  }

  // ─── Web: Sidebar Layout ────────────────────────────────
  return (
    <WebSidebarLayout
      sidebar={renderChatList()}
      main={renderChatDetail()}
      sidebarWidth={380}
      emptyStateType="chat"
    />
  )
}
