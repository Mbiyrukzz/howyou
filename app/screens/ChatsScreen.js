// screens/ChatsScreen.js - Fixed delete function
import React, { useContext, useState, useEffect } from 'react'
import { View, Platform, StatusBar, Alert } from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'

import ChatDetailScreen from './ChatDetailScreen'
import ChatsContext from '../contexts/ChatsContext'
import { useUser } from '../hooks/useUser'
import { usePosts } from '../providers/PostsProvider'
import WebSidebarLayout, {
  shouldShowSidebar,
} from '../components/WebSidebarLayout'
import { useWebNavigation } from '../navigation/WebNavigationHandler'
import LoadingIndicator from '../components/LoadingIndicator'
import SharedChatsSidebar from '../components/SharedChatsSidebar'

/* =================== Styled Components =================== */
const Container = styled.View`
  flex: 1;
  background-color: #f8fafc;
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
`

/* =================== Main ChatsScreen =================== */
export default function ChatsScreen({ navigation, route }) {
  const [selectedChatId, setSelectedChatId] = useState(null)

  const chatsContext = useContext(ChatsContext)
  const { user } = useUser()
  const { createPost } = usePosts()

  const {
    chats = [],
    loading,
    users = [],
    deleteChat,
    isUserOnline,
    getTypingUsersForChat,
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
      setSelectedChatId(routeChatId)
    }
  }, [routeChatId])

  /* =================== Handlers =================== */

  const handleChatPress = (chat) => {
    const chatId = chat._id || chat.id

    if (shouldShowSidebar) {
      setSelectedChatId(chatId)
      if (Platform.OS === 'web') {
        window.history.pushState({}, '', `/chats/${chatId}`)
      }
    } else {
      navigation.navigate('ChatDetail', { chatId })
    }
  }

  const handleNewChat = () => {
    navigation.navigate('NewChats')
  }

  // ✅ FIXED: Proper async/await with confirmation
  const handleDeleteChat = async (chatId) => {
    return new Promise((resolve) => {
      // Show confirmation dialog
      if (Platform.OS === 'web') {
        const confirmed = window.confirm(
          'Are you sure you want to delete this conversation?'
        )
        if (!confirmed) {
          resolve({ success: false, cancelled: true })
          return
        }

        // Perform deletion
        deleteChat(chatId)
          .then((result) => {
            if (result && result.success && selectedChatId === chatId) {
              setSelectedChatId(null)
            }
            resolve(result)
          })
          .catch((error) => {
            console.error('Failed to delete chat:', error)
            resolve({ success: false, error: error.message })
          })
      } else {
        // Mobile: Use Alert
        Alert.alert(
          'Delete Conversation',
          'Are you sure you want to delete this conversation?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve({ success: false, cancelled: true }),
            },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                deleteChat(chatId)
                  .then((result) => {
                    if (result && result.success && selectedChatId === chatId) {
                      setSelectedChatId(null)
                    }
                    resolve(result)
                  })
                  .catch((error) => {
                    console.error('Failed to delete chat:', error)
                    resolve({ success: false, error: error.message })
                  })
              },
            },
          ],
          { cancelable: true }
        )
      }
    })
  }

  const handleUploadStatus = async (asset) => {
    try {
      await createPost(asset)
    } catch (error) {
      console.error('Failed to upload status:', error)
      throw error
    }
  }

  /* =================== Render Functions =================== */

  const renderChatList = () => {
    if (loading && chats.length === 0) {
      return (
        <Container>
          <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
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

    if (!chatsContext) {
      return (
        <Container>
          <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: 48,
            }}
          >
            <Ionicons name="alert-circle-outline" size={50} color="#dc2626" />
            <EmptyStateTitle style={{ color: '#dc2626', marginTop: 16 }}>
              Connection Error
            </EmptyStateTitle>
            <EmptyStateText>
              Unable to load your conversations. Please check your internet
              connection.
            </EmptyStateText>
          </View>
        </Container>
      )
    }

    return (
      <Container>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

        <SharedChatsSidebar
          chats={chats}
          selectedChatId={selectedChatId}
          onSelectChat={handleChatPress}
          currentUser={user}
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
            backgroundColor: '#f8fafc',
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

  /* =================== Main Render =================== */

  // Mobile: Full Screen List
  if (!shouldShowSidebar) {
    return renderChatList()
  }

  // Web: Sidebar Layout
  return (
    <WebSidebarLayout
      sidebar={renderChatList()}
      main={renderChatDetail()}
      sidebarWidth={380}
      emptyStateType="chat"
    />
  )
}
