// screens/ChatsScreen.js - Updated with SharedChatsSidebar
import React, { useContext, useState, useEffect } from 'react'
import {
  View,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
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
import SharedChatsSidebar from '../components/SharedChatsSidebar' // ✅ Import shared component

// ─── Styled Components (Keep Header, FloatingActionButton, etc.) ────
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

// ─── Main ChatsScreen ────────────────────────────────
export default function ChatsScreen({ navigation, route }) {
  const [selectedChatId, setSelectedChatId] = useState(null)
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
    isUserOnline,
  } = chatsContext || {}

  useWebNavigation((type, id) => {
    if (type === 'chat') {
      setSelectedChatId(id || null)
    }
  })

  const routeChatId = route?.params?.chatId
  useEffect(() => {
    if (routeChatId && !shouldShowSidebar) {
      setSelectedChatId(routeChatId)
    }
  }, [routeChatId])

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
    const otherParticipant = chat.participants?.find((id) => id !== user?.uid)
    const otherUser = users.find(
      (u) =>
        u._id === otherParticipant ||
        u.id === otherParticipant ||
        u.firebaseUid === otherParticipant
    )
    const chatName = otherUser?.name || 'Unknown'

    if (Platform.OS === 'web') {
      setActiveDropdown(activeDropdown === chatId ? null : chatId)
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

  // ─── Render Chat List with SharedChatsSidebar ────────────────────────────────
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

        {/* ✅ Use SharedChatsSidebar component */}
        <SharedChatsSidebar
          chats={chats}
          selectedChatId={selectedChatId}
          onSelectChat={handleChatPress}
          currentUser={user}
          isUserOnline={isUserOnline}
          users={users}
          showOptionsButton={Platform.OS === 'web'}
          onOptionsPress={handleOptionsPress}
        />

        {/* Show dropdown if active */}
        {Platform.OS === 'web' && activeDropdown && (
          <DropdownMenu>
            <DropdownItem
              danger
              onPress={() => {
                const chat = chats.find(
                  (c) => (c._id || c.id) === activeDropdown
                )
                if (chat) {
                  const otherParticipant = chat.participants?.find(
                    (id) => id !== user?.uid
                  )
                  const otherUser = users.find(
                    (u) =>
                      u._id === otherParticipant ||
                      u.id === otherParticipant ||
                      u.firebaseUid === otherParticipant
                  )
                  const chatName = otherUser?.name || 'Unknown'
                  if (
                    window.confirm(
                      `Delete chat with ${chatName}? This cannot be undone.`
                    )
                  ) {
                    handleDeleteChat(activeDropdown, chatName)
                  }
                }
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#dc2626" />
              <DropdownItemText danger>Delete Chat</DropdownItemText>
            </DropdownItem>
          </DropdownMenu>
        )}

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
