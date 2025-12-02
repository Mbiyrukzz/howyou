import React from 'react'
import { View, Platform, Dimensions } from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'

const { width: screenWidth } = Dimensions.get('window')

// Only render sidebar on web with sufficient screen width
const shouldShowSidebar = Platform.OS === 'web' && screenWidth >= 768

const LayoutContainer = styled.View`
  flex: 1;
  flex-direction: row;
  background-color: #f1f5f9;
`

const SidebarContainer = styled.View`
  width: ${(props) => props.width}px;
  background-color: #ffffff;
  border-right-width: 1px;
  border-right-color: #e2e8f0;
  shadow-color: #000;
  shadow-offset: 2px 0px;
  shadow-opacity: 0.08;
  shadow-radius: 12px;
  elevation: 4;
`

const MainContainer = styled.View`
  flex: 1;
  background-color: #f8fafc;
`

const EmptyStateContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 48px;
  background-color: #f8fafc;
`

const EmptyStateIcon = styled.View`
  width: 96px;
  height: 96px;
  border-radius: 48px;
  background-color: ${(props) => props.bgColor || '#dbeafe'};
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
  shadow-color: ${(props) => props.shadowColor || '#3b82f6'};
  shadow-offset: 0px 4px;
  shadow-opacity: 0.2;
  shadow-radius: 16px;
  elevation: 5;
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
  max-width: 420px;
`

const EmptyStateHint = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 28px;
  padding: 14px 24px;
  background-color: #dbeafe;
  border-radius: 16px;
  border-width: 1px;
  border-color: #bfdbfe;
  shadow-color: #3b82f6;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
  elevation: 2;
`

const EmptyStateHintText = styled.Text`
  font-size: 14px;
  color: #1e40af;
  font-weight: 600;
  margin-left: 10px;
`

// Default empty state components for different screens
const ChatEmptyState = () => (
  <EmptyStateContainer>
    <EmptyStateIcon bgColor="#dbeafe" shadowColor="#3b82f6">
      <Ionicons name="chatbubbles" size={52} color="#3b82f6" />
    </EmptyStateIcon>
    <EmptyStateTitle>No chat selected</EmptyStateTitle>
    <EmptyStateText>
      Choose a conversation from the sidebar to start messaging, or create a new
      chat to begin connecting with others
    </EmptyStateText>
    <EmptyStateHint>
      <Ionicons name="arrow-back" size={20} color="#1e40af" />
      <EmptyStateHintText>Select a chat from the list</EmptyStateHintText>
    </EmptyStateHint>
  </EmptyStateContainer>
)

const PostEmptyState = () => (
  <EmptyStateContainer>
    <EmptyStateIcon bgColor="#dcfce7" shadowColor="#10b981">
      <Ionicons name="newspaper" size={52} color="#10b981" />
    </EmptyStateIcon>
    <EmptyStateTitle>No post selected</EmptyStateTitle>
    <EmptyStateText>
      Browse posts from the feed on the left and click to view details,
      comments, and reactions, or create a new post to share
    </EmptyStateText>
    <EmptyStateHint
      style={{ backgroundColor: '#dcfce7', borderColor: '#bbf7d0' }}
    >
      <Ionicons name="arrow-back" size={20} color="#166534" />
      <EmptyStateHintText style={{ color: '#166534' }}>
        Select a post from the feed
      </EmptyStateHintText>
    </EmptyStateHint>
  </EmptyStateContainer>
)

/**
 * WebSidebarLayout - A responsive layout component for web
 *
 * @param {ReactNode} sidebar - Content to show in the sidebar (e.g., chat list, posts feed)
 * @param {ReactNode} main - Content to show in the main area (e.g., chat detail, post detail)
 * @param {number} sidebarWidth - Width of the sidebar in pixels (default: 380)
 * @param {string} emptyStateType - Type of empty state: 'chat' | 'post' | 'custom'
 * @param {ReactNode} customEmptyState - Custom empty state component
 */
export default function WebSidebarLayout({
  sidebar,
  main,
  sidebarWidth = 380,
  emptyStateType = 'chat',
  customEmptyState = null,
}) {
  // On mobile, just show the main content
  if (!shouldShowSidebar) {
    return main || <View style={{ flex: 1 }} />
  }

  // Determine what to show in main area
  let mainContent = main

  if (!mainContent) {
    // Show appropriate empty state
    if (customEmptyState) {
      mainContent = customEmptyState
    } else if (emptyStateType === 'post') {
      mainContent = <PostEmptyState />
    } else {
      mainContent = <ChatEmptyState />
    }
  }

  return (
    <LayoutContainer>
      <SidebarContainer width={sidebarWidth}>{sidebar}</SidebarContainer>
      <MainContainer>{mainContent}</MainContainer>
    </LayoutContainer>
  )
}

// Export helper to check if sidebar should be shown
export { shouldShowSidebar }
