import React, { useEffect, useRef, useState } from 'react'
import {
  FlatList,
  StatusBar,
  Animated,
  RefreshControl,
  Alert,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import { usePostsFeed } from '../hooks/usePostsFeed'
import { useComments } from '../hooks/useComments'
import { useWebSidebar } from '../hooks/useWebSidebar'
import WebSidebarLayout from '../components/WebSidebarLayout'

import {
  getConnectionText,
  getConnectionBgColor,
  getConnectionColor,
  getInitials,
} from '../utils/posts'
import { PostCard } from '../components/posts/PostCard'
import { StoriesRow } from '../components/posts/StoriesRow'
import { FloatingActionButton } from '../components/posts/FloatingActionButton'
import { StatusActionModal } from '../components/modals/StatusActionModal'
import { PostMenuModal } from '../components/modals/PostMenuModal'
import { EditPostModal } from '../components/modals/EditPostModal'

import { Image } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { usePosts } from '../providers/PostsProvider'
import { PostDetailView } from '../components/posts/PostDetailView'

const { width: screenWidth } = Dimensions.get('window')

const Container = styled.View`
  flex: 1;
  background-color: #f8fafc;
`

const Header = styled.View`
  background-color: #fff;
  padding: 50px 20px 16px 20px;
  border-bottom-width: 1px;
  border-bottom-color: #e2e8f0;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.08;
  shadow-radius: 8px;
  elevation: 5;
`

const HeaderTop = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`

const HeaderTitle = styled.Text`
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
`

const ConnectionStatus = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 8px 14px;
  border-radius: 20px;
  background-color: ${(props) => getConnectionBgColor(props.state)};
  border-width: 1px;
  border-color: ${(props) => getConnectionColor(props.state)}20;
`

const ConnectionDot = styled.View`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  margin-right: 8px;
  background-color: ${(props) => getConnectionColor(props.state)};
`

const ConnectionText = styled.Text`
  font-size: 13px;
  font-weight: 600;
  color: ${(props) => getConnectionColor(props.state)};
`

const HeaderButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  justify-content: center;
  align-items: center;
  background-color: #f1f5f9;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 2;
`

// Post Detail Components (keep your existing detail components)

export default function PostsScreen({ navigation, route }) {
  const {
    posts,
    stories,
    yourStory,
    loading,
    refreshing,
    modalVisible,
    editModalVisible,
    editingPost,
    menuModalVisible,
    menuSelectedPost,
    isDeleting,
    connectionState,
    wsConnected,
    wsReconnect,
    isPostOwner,
    handleRefresh,
    handleAddStatus,
    handlePostMenu,
    handleUpdatePost,
    handleDeletePost,
    toggleLike,
    setModalVisible,
    setEditModalVisible,
    setEditingPost,
    setMenuModalVisible,
    setMenuSelectedPost,
  } = usePostsFeed()

  const { getCommentsForPost } = useComments()
  const [selectedPostId, setSelectedPostId] = useState(null)
  const isWebSidebar = useWebSidebar()
  const scrollY = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (route?.params?.postId) {
      setSelectedPostId(route.params.postId)
    }
  }, [route?.params?.postId])

  const handleStoryPress = async (item) => {
    const isYourStory = item._id === 'your-story'

    if (isYourStory) {
      if (item.statusCount > 0) {
        setModalVisible(true)
      } else {
        handleAddStatus()
      }
    } else {
      navigation.navigate('StatusViewer', {
        statuses: item.statuses || [item],
        userName: item.userName,
      })
    }
  }

  const handleViewStatus = () => {
    setModalVisible(false)
    if (yourStory?.statusCount > 0) {
      navigation.navigate('StatusViewer', {
        statuses: yourStory.statuses || [],
        userName: 'Your Story',
      })
    }
  }

  const handlePostPress = (post) => {
    const postId = post._id

    if (isWebSidebar) {
      setSelectedPostId(postId)
      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState({}, '', `/posts/${postId}`)
      }
    } else {
      navigation.navigate('PostDetail', { postId })
    }
  }

  const HeaderComponent = () => (
    <Header>
      <HeaderTop>
        <HeaderTitle>Posts</HeaderTitle>

        <ConnectionStatus
          state={connectionState}
          onPress={wsConnected ? null : wsReconnect}
          disabled={wsConnected}
        >
          <ConnectionDot state={connectionState} />
          <ConnectionText state={connectionState}>
            {getConnectionText(connectionState)}
          </ConnectionText>
        </ConnectionStatus>

        <HeaderButton>
          <Ionicons name="notifications-outline" size={24} color="#64748b" />
        </HeaderButton>
      </HeaderTop>

      <StoriesRow
        stories={stories}
        onStoryPress={handleStoryPress}
        onAddStatus={handleAddStatus}
      />
    </Header>
  )

  const renderPostsFeed = () => (
    <Container>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={HeaderComponent}
        renderItem={({ item }) => {
          const isSelected = isWebSidebar && selectedPostId === item._id
          const comments = getCommentsForPost(item._id) || []

          return (
            <PostCard
              post={item}
              onPress={() => handlePostPress(item)}
              onMenuPress={() => handlePostMenu(item)}
              onLikePress={(postId, isLiked) => toggleLike(postId, isLiked)}
              onCommentPress={() => handlePostPress(item)}
              onSharePress={() => {}}
              isSelected={isSelected}
              isOwner={isPostOwner(item)}
            />
          )
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      />

      <FloatingActionButton onPress={() => navigation.navigate('CreatePost')} />

      <StatusActionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddStatus}
        onView={handleViewStatus}
        statusCount={yourStory?.statusCount || 0}
      />

      <EditPostModal
        visible={editModalVisible}
        post={editingPost}
        onClose={() => {
          setEditModalVisible(false)
          setEditingPost(null)
        }}
        onSave={handleUpdatePost}
      />

      <PostMenuModal
        visible={menuModalVisible}
        post={menuSelectedPost}
        onClose={() => {
          if (!isDeleting) {
            setMenuModalVisible(false)
            setMenuSelectedPost(null)
          }
        }}
        onEdit={() => {
          setMenuModalVisible(false)
          setEditingPost(menuSelectedPost)
          setEditModalVisible(true)
        }}
        onDelete={handleDeletePost}
        isDeleting={isDeleting}
      />
    </Container>
  )

  const renderPostDetail = () => {
    if (!selectedPostId) return null

    const selectedPost = posts.find((p) => p._id === selectedPostId)
    if (!selectedPost) return null

    return (
      <PostDetailView
        post={selectedPost}
        onEdit={() => {
          setEditingPost(selectedPost)
          setEditModalVisible(true)
        }}
        onDelete={() => handleDeletePost(selectedPost)}
        onLike={() => toggleLike(selectedPost._id, selectedPost.isLiked)}
      />
    )
  }
  if (!isWebSidebar) {
    return renderPostsFeed()
  }

  return (
    <WebSidebarLayout
      sidebar={renderPostsFeed()}
      main={renderPostDetail()}
      sidebarWidth={420}
      emptyStateType="post"
    />
  )
}
