// screens/ChatsScreen.js - Enhanced with Call Card Design
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
  background-color: #f1f5f9;
`

const EmptyStateContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 48px;
  background-color: #f8fafc;
`

const EmptyIconWrapper = styled.View`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  background-color: #e0f2fe;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  shadow-color: #3b82f6;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.15;
  shadow-radius: 12px;
  elevation: 4;
`

const EmptyStateTitle = styled.Text`
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12px;
  text-align: center;
`

const EmptyStateText = styled.Text`
  font-size: 16px;
  color: #64748b;
  text-align: center;
  line-height: 24px;
  max-width: 400px;
`

const ErrorIconWrapper = styled.View`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  background-color: #fee2e2;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  shadow-color: #dc2626;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.15;
  shadow-radius: 12px;
  elevation: 4;
`

const LoadingContainer = styled.View`
  flex: 1;
  background-color: #f8fafc;
`

const SelectChatContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 48px;
  background-color: #f8fafc;
`

const SelectChatIconWrapper = styled.View`
  width: 96px;
  height: 96px;
  border-radius: 48px;
  background-color: #dbeafe;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  shadow-color: #3b82f6;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.2;
  shadow-radius: 16px;
  elevation: 5;
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
          <LoadingContainer>
            <LoadingIndicator
              type="pulse"
              size="large"
              showText
              text="Loading conversations..."
              showCard={false}
              subtext="Please wait while we sync your messages"
            />
          </LoadingContainer>
        </Container>
      )
    }

    if (!chatsContext) {
      return (
        <Container>
          <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
          <EmptyStateContainer>
            <ErrorIconWrapper>
              <Ionicons name="alert-circle" size={44} color="#dc2626" />
            </ErrorIconWrapper>
            <EmptyStateTitle style={{ color: '#dc2626' }}>
              Connection Error
            </EmptyStateTitle>
            <EmptyStateText>
              Unable to load your conversations. Please check your internet
              connection and try again.
            </EmptyStateText>
          </EmptyStateContainer>
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
        <SelectChatContainer>
          <SelectChatIconWrapper>
            <Ionicons name="chatbubbles" size={52} color="#3b82f6" />
          </SelectChatIconWrapper>
          <EmptyStateTitle>Select a conversation</EmptyStateTitle>
          <EmptyStateText>
            Choose a chat from the list to view messages and start chatting
          </EmptyStateText>
        </SelectChatContainer>
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
