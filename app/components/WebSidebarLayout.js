// components/WebSidebarLayout.js
import React from 'react'
import { View, Text, Platform, Dimensions } from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'

const { width: screenWidth } = Dimensions.get('window')

// Only render sidebar on web with sufficient screen width
const shouldShowSidebar = Platform.OS === 'web' && screenWidth >= 768

const LayoutContainer = styled.View`
  flex: 1;
  flex-direction: row;
  background-color: #f8f9fa;
`

const SidebarContainer = styled.View`
  width: ${(props) => props.width}px;
  background-color: #fff;
  border-right-width: 1px;
  border-right-color: #e9ecef;
  shadow-color: #000;
  shadow-offset: 2px 0px;
  shadow-opacity: 0.05;
  shadow-radius: 8px;
  elevation: 4;
`

const MainContainer = styled.View`
  flex: 1;
  background-color: #f8f9fa;
`

const EmptyStateContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 48px;
  background-color: #fff;
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
  max-width: 400px;
`

const EmptyStateHint = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 24px;
  padding: 12px 20px;
  background-color: #e3f2fd;
  border-radius: 12px;
`

const EmptyStateHintText = styled.Text`
  font-size: 14px;
  color: #1976d2;
  font-weight: 600;
  margin-left: 8px;
`

// Default empty state components for different screens
const ChatEmptyState = () => (
  <EmptyStateContainer>
    <EmptyStateIcon>
      <Ionicons name="chatbubbles-outline" size={60} color="#94a3b8" />
    </EmptyStateIcon>
    <EmptyStateTitle>No chat selected</EmptyStateTitle>
    <EmptyStateText>
      Choose a conversation from the sidebar to start messaging, or create a new
      chat to begin
    </EmptyStateText>
    <EmptyStateHint>
      <Ionicons name="arrow-back" size={18} color="#1976d2" />
      <EmptyStateHintText>Select a chat from the list</EmptyStateHintText>
    </EmptyStateHint>
  </EmptyStateContainer>
)

const PostEmptyState = () => (
  <EmptyStateContainer>
    <EmptyStateIcon>
      <Ionicons name="newspaper-outline" size={60} color="#94a3b8" />
    </EmptyStateIcon>
    <EmptyStateTitle>No post selected</EmptyStateTitle>
    <EmptyStateText>
      Browse posts from the feed on the left and click to view details, or
      create a new post to share
    </EmptyStateText>
    <EmptyStateHint>
      <Ionicons name="arrow-back" size={18} color="#1976d2" />
      <EmptyStateHintText>Select a post from the feed</EmptyStateHintText>
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
