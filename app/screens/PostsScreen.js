// screens/PostsScreen.js - Fixed WebSocket connection indicator
import React, { useEffect, useRef, useState } from 'react'
import {
  FlatList,
  StatusBar,
  Animated,
  RefreshControl,
  Alert,
  Image,
  Dimensions,
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { usePosts } from '../providers/PostsProvider'
import { useWebSidebar } from '../hooks/useWebSidebar'
import WebSidebarLayout from '../components/WebSidebarLayout'

const { width: screenWidth } = Dimensions.get('window')

// ─────────────────────────────────────────────────────────────────────────────
// ─── STYLED COMPONENTS ───────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
const Container = styled.View`
  flex: 1;
  background-color: #f8f9fa;
`

const Header = styled.View`
  background-color: #fff;
  padding: 50px 20px 16px 20px;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
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
  font-weight: bold;
  color: #2c3e50;
`

const ConnectionStatus = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 6px 12px;
  border-radius: 12px;
  background-color: ${(props) => {
    if (props.state === 'connected') return '#d4edda'
    if (props.state === 'reconnecting') return '#fff3cd'
    return '#f8d7da'
  }};
`

const ConnectionDot = styled.View`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  margin-right: 6px;
  background-color: ${(props) => {
    if (props.state === 'connected') return '#28a745'
    if (props.state === 'reconnecting') return '#ffc107'
    return '#dc3545'
  }};
`

const ConnectionText = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: ${(props) => {
    if (props.state === 'connected') return '#155724'
    if (props.state === 'reconnecting') return '#856404'
    return '#721c24'
  }};
`

const HeaderButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  justify-content: center;
  align-items: center;
  background-color: #f8f9fa;
`

const StoriesContainer = styled.View`
  height: 110px;
  margin-bottom: 8px;
`

const StoriesList = styled.FlatList`
  padding-left: 20px;
`

const StoryItem = styled.TouchableOpacity`
  align-items: center;
  margin-right: 16px;
  width: 70px;
`

const StoryAvatarContainer = styled.View`
  position: relative;
  margin-bottom: 6px;
`

const StoryAvatar = styled.View`
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background-color: ${(props) => props.color || '#3498db'};
  justify-content: center;
  align-items: center;
  border-width: ${(props) => (props.hasStory ? '3px' : '2.5px')};
  border-color: ${(props) => (props.hasStory ? '#e74c3c' : '#e9ecef')};
`

const StoryImageContainer = styled.View`
  width: 58px;
  height: 58px;
  border-radius: 29px;
  overflow: hidden;
  background-color: #ecf0f1;
`

const AddStoryButton = styled.View`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 22px;
  height: 22px;
  border-radius: 11px;
  background-color: #3498db;
  justify-content: center;
  align-items: center;
  border-width: 2px;
  border-color: #fff;
`

const StoryAvatarText = styled.Text`
  color: #fff;
  font-size: 20px;
  font-weight: bold;
`

const StoryName = styled.Text`
  font-size: 12px;
  color: ${(props) => (props.isYou ? '#3498db' : '#7f8c8d')};
  font-weight: ${(props) => (props.isYou ? '600' : '400')};
  text-align: center;
`

const StatusBadge = styled.View`
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: #e74c3c;
  border-radius: 10px;
  min-width: 20px;
  height: 20px;
  justify-content: center;
  align-items: center;
  padding: 0 6px;
  border-width: 2px;
  border-color: #fff;
`

const StatusBadgeText = styled.Text`
  color: #fff;
  font-size: 11px;
  font-weight: bold;
`

const PostCard = styled.View`
  background-color: #fff;
  margin: 8px 20px;
  border-radius: 16px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`

const PostHeader = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  padding-bottom: 12px;
`

const PostAvatar = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${(props) => props.color || '#3498db'};
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`

const PostAvatarText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: bold;
`

const PostUserInfo = styled.View`
  flex: 1;
`

const PostUsername = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
`

const PostTimestamp = styled.Text`
  font-size: 12px;
  color: #95a5a6;
  margin-top: 2px;
`

const PostMenuButton = styled.TouchableOpacity`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  justify-content: center;
  align-items: center;
`

const PostContent = styled.Text`
  font-size: 16px;
  line-height: 22px;
  color: #2c3e50;
  padding: 0px 16px 12px 16px;
`

const PostImage = styled.View`
  height: 250px;
  background-color: #ecf0f1;
  margin: 0px 16px 12px 16px;
  border-radius: 12px;
  overflow: hidden;
`

const PostActions = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 8px 16px 16px 16px;
  border-top-width: 1px;
  border-top-color: #f8f9fa;
`

const ActionButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 8px 12px;
  margin-right: 16px;
  border-radius: 20px;
  background-color: ${(props) => (props.active ? '#e3f2fd' : 'transparent')};
`

const ActionText = styled.Text`
  font-size: 14px;
  font-weight: 500;
  color: ${(props) => (props.active ? '#2196f3' : '#7f8c8d')};
  margin-left: 6px;
`

const FloatingActionButton = styled.TouchableOpacity`
  position: absolute;
  right: 20px;
  bottom: 30px;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: #3498db;
  justify-content: center;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 5px;
  elevation: 8;
`

// ─── Modal Components ────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// ─── UTILS ───────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
const getInitials = (name) =>
  name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)

// ─────────────────────────────────────────────────────────────────────────────
// ─── STORY COMPONENT ─────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
const StoryComponent = ({ item, onPress, isYourStory, statusCount }) => {
  const hasStory = statusCount > 0

  return (
    <StoryItem onPress={() => onPress(item)}>
      <StoryAvatarContainer>
        {hasStory && item.fileUrl ? (
          <StoryAvatar hasStory={true} color={item.userAvatarColor}>
            <StoryImageContainer>
              <Image
                source={{ uri: item.fileUrl }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </StoryImageContainer>
          </StoryAvatar>
        ) : (
          <StoryAvatar
            color={item.userAvatarColor || '#2ecc71'}
            hasStory={false}
          >
            <StoryAvatarText>
              {getInitials(item.userName || item.name)}
            </StoryAvatarText>
          </StoryAvatar>
        )}

        {isYourStory && (
          <AddStoryButton>
            <Ionicons name="add" size={14} color="#fff" />
          </AddStoryButton>
        )}

        {statusCount > 1 && (
          <StatusBadge>
            <StatusBadgeText>{statusCount}</StatusBadgeText>
          </StatusBadge>
        )}
      </StoryAvatarContainer>

      <StoryName isYou={isYourStory} numberOfLines={1}>
        {isYourStory ? 'Your Story' : item.userName || item.name}
      </StoryName>
    </StoryItem>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── POST COMPONENT ───────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
const PostComponent = ({ item, onLike, onComment, onShare, onMenuPress }) => (
  <PostCard>
    <PostHeader>
      <PostAvatar color={item.avatarColor || '#3498db'}>
        <PostAvatarText>{getInitials(item.username)}</PostAvatarText>
      </PostAvatar>
      <PostUserInfo>
        <PostUsername>{item.username}</PostUsername>
        <PostTimestamp>
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </PostTimestamp>
      </PostUserInfo>
      <PostMenuButton onPress={() => onMenuPress(item)}>
        <Ionicons name="ellipsis-horizontal" size={20} color="#7f8c8d" />
      </PostMenuButton>
    </PostHeader>

    <PostContent>{item.content}</PostContent>

    {item.files?.[0] && (
      <PostImage>
        <Image
          source={{ uri: item.files[0].url }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </PostImage>
    )}

    <PostActions>
      <ActionButton
        active={item.isLiked}
        onPress={() => onLike(item._id, item.isLiked)}
      >
        <Ionicons
          name={item.isLiked ? 'heart' : 'heart-outline'}
          size={20}
          color={item.isLiked ? '#e74c3c' : '#7f8c8d'}
        />
        <ActionText active={item.isLiked}>{item.likes}</ActionText>
      </ActionButton>

      <ActionButton onPress={() => onComment(item._id)}>
        <Ionicons name="chatbubble-outline" size={18} color="#7f8c8d" />
        <ActionText>{item.comments || 0}</ActionText>
      </ActionButton>

      <ActionButton onPress={() => onShare(item._id)}>
        <Ionicons name="share-outline" size={18} color="#7f8c8d" />
        <ActionText>{item.shares || 0}</ActionText>
      </ActionButton>
    </PostActions>
  </PostCard>
)

// ─────────────────────────────────────────────────────────────────────────────
// ─── STATUS ACTION MODAL ─────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
const StatusActionModal = ({
  visible,
  onClose,
  onAdd,
  onView,
  statusCount,
}) => (
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
            <ModalTitle>Your Status</ModalTitle>
            <ModalSubtitle>
              You have {statusCount} active{' '}
              {statusCount === 1 ? 'status' : 'statuses'}
            </ModalSubtitle>

            <ModalButton bgColor="#e3f2fd" onPress={onView}>
              <Ionicons name="eye-outline" size={24} color="#2196f3" />
              <ModalButtonText color="#2196f3">View Status</ModalButtonText>
            </ModalButton>

            <ModalButton bgColor="#f0f4ff" onPress={onAdd}>
              <Ionicons name="add-circle-outline" size={24} color="#5e72e4" />
              <ModalButtonText color="#5e72e4">Add New Status</ModalButtonText>
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

export default function PostsScreen({ navigation, route }) {
  const {
    posts,
    statuses,
    myStatus,
    loading,
    refetch,
    toggleLike,
    deletePost,
    createPost,
    wsConnected,
    connectionState,
    wsReconnect,
  } = usePosts()

  const [refreshing, setRefreshing] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const scrollY = useRef(new Animated.Value(0)).current

  // ✅ NEW: Sidebar state
  const [selectedPostId, setSelectedPostId] = useState(null)
  const isWebSidebar = useWebSidebar()

  // ✅ NEW: Update selected post from route
  useEffect(() => {
    if (route?.params?.postId) {
      setSelectedPostId(route.params.postId)
    }
  }, [route?.params?.postId])

  // Prepare stories list with "Your Story" first
  const yourStory = {
    _id: 'your-story',
    userName: 'Your Story',
    userAvatarColor: '#2ecc71',
    fileUrl: myStatus?.length > 0 ? myStatus[0].fileUrl : null,
    statusCount: myStatus?.length || 0,
  }

  const stories = [yourStory, ...statuses]

  const handleAddStatus = async () => {
    setModalVisible(false)

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to add status')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      try {
        await createPost(result.assets[0])
        Alert.alert('Success', 'Status added!')
      } catch (error) {
        console.error('Failed to add status:', error)
        if (error.status === 429 || error.message?.includes('Daily limit')) {
          Alert.alert(
            'Daily Limit Reached',
            'You can only post 5 statuses per day. Try again tomorrow!',
            [{ text: 'OK' }]
          )
        } else {
          Alert.alert('Error', error.message || 'Failed to add status')
        }
      }
    }
  }

  const handleViewStatus = () => {
    setModalVisible(false)
    if (myStatus && myStatus.length > 0) {
      navigation.navigate('StatusViewer', {
        statuses: myStatus,
        userName: 'Your Story',
      })
    }
  }

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

  // ✅ NEW: Handle post press differently for sidebar
  const handlePostPress = (post) => {
    const postId = post._id

    if (isWebSidebar) {
      // On web with sidebar, update selected post
      console.log('🖥️ Sidebar mode: selecting post', postId)
      setSelectedPostId(postId)

      // Update URL
      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState({}, '', `/posts/${postId}`)
      }
    } else {
      // Mobile mode, navigate to detail screen
      console.log('📱 Mobile mode: navigating to post detail', postId)
      navigation.navigate('PostDetail', { postId })
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    refetch().finally(() => setRefreshing(false))
  }

  const getConnectionText = () => {
    switch (connectionState) {
      case 'connected':
        return 'Online'
      case 'connecting':
        return 'Connecting...'
      case 'reconnecting':
        return 'Reconnecting...'
      case 'error':
        return 'Error - Tap to retry'
      case 'failed':
        return 'Offline - Tap to retry'
      default:
        return 'Disconnected'
    }
  }

  // ✅ NEW: Handle post menu (edit/delete)
  const handlePostMenu = (post) => {
    if (Platform.OS === 'web') {
      // Web: Show custom menu
      Alert.alert('Post Options', 'Choose an action', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Edit',
          onPress: () => handleEditPost(post),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeletePost(post),
        },
      ])
    } else {
      // Mobile: Show action sheet
      Alert.alert('Post Options', 'Choose an action', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Edit',
          onPress: () => handleEditPost(post),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeletePost(post),
        },
      ])
    }
  }

  const handleEditPost = (post) => {
    // Navigate to edit screen or show edit modal
    navigation.navigate('EditPost', { postId: post._id })
  }

  const handleDeletePost = (post) => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePost(post._id)
            Alert.alert('Success', 'Post deleted successfully')

            // If this was the selected post in sidebar, deselect it
            if (selectedPostId === post._id) {
              setSelectedPostId(null)
              if (typeof window !== 'undefined' && window.history) {
                window.history.pushState({}, '', '/posts')
              }
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to delete post')
          }
        },
      },
    ])
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
            {getConnectionText()}
          </ConnectionText>
        </ConnectionStatus>

        <HeaderButton>
          <Ionicons name="notifications-outline" size={24} color="#7f8c8d" />
        </HeaderButton>
      </HeaderTop>

      <StoriesContainer>
        <StoriesList
          data={stories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item._id || 'your-story'}
          renderItem={({ item }) => (
            <StoryComponent
              item={item}
              onPress={handleStoryPress}
              isYourStory={item._id === 'your-story'}
              statusCount={item.statusCount || 0}
            />
          )}
        />
      </StoriesContainer>
    </Header>
  )

  // ✅ NEW: Render posts feed (sidebar content)
  const renderPostsFeed = () => (
    <Container>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={HeaderComponent}
        renderItem={({ item }) => {
          const isSelected = isWebSidebar && selectedPostId === item._id

          return (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handlePostPress(item)}
            >
              <PostCard
                style={{
                  backgroundColor: isSelected ? '#e3f2fd' : '#fff',
                  borderLeftWidth: isSelected ? 4 : 0,
                  borderLeftColor: isSelected ? '#3498db' : 'transparent',
                }}
              >
                <PostHeader>
                  <PostAvatar color={item.avatarColor || '#3498db'}>
                    <PostAvatarText>
                      {getInitials(item.username)}
                    </PostAvatarText>
                  </PostAvatar>
                  <PostUserInfo>
                    <PostUsername>{item.username}</PostUsername>
                    <PostTimestamp>
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </PostTimestamp>
                  </PostUserInfo>
                  <PostMenuButton
                    onPress={(e) => {
                      e.stopPropagation()
                      handlePostMenu(item)
                    }}
                  >
                    <Ionicons
                      name="ellipsis-horizontal"
                      size={20}
                      color="#7f8c8d"
                    />
                  </PostMenuButton>
                </PostHeader>

                <PostContent>{item.content}</PostContent>

                {item.files?.[0] && (
                  <PostImage>
                    <Image
                      source={{ uri: item.files[0].url }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  </PostImage>
                )}

                <PostActions>
                  <ActionButton
                    active={item.isLiked}
                    onPress={(e) => {
                      e.stopPropagation()
                      toggleLike(item._id, item.isLiked)
                    }}
                  >
                    <Ionicons
                      name={item.isLiked ? 'heart' : 'heart-outline'}
                      size={20}
                      color={item.isLiked ? '#e74c3c' : '#7f8c8d'}
                    />
                    <ActionText active={item.isLiked}>{item.likes}</ActionText>
                  </ActionButton>

                  <ActionButton onPress={(e) => e.stopPropagation()}>
                    <Ionicons
                      name="chatbubble-outline"
                      size={18}
                      color="#7f8c8d"
                    />
                    <ActionText>{item.comments || 0}</ActionText>
                  </ActionButton>

                  <ActionButton onPress={(e) => e.stopPropagation()}>
                    <Ionicons name="share-outline" size={18} color="#7f8c8d" />
                    <ActionText>{item.shares || 0}</ActionText>
                  </ActionButton>
                </PostActions>
              </PostCard>
            </TouchableOpacity>
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

      <FloatingActionButton onPress={() => navigation.navigate('CreatePost')}>
        <Ionicons name="add" size={28} color="#fff" />
      </FloatingActionButton>

      <StatusActionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddStatus}
        onView={handleViewStatus}
        statusCount={yourStory.statusCount}
      />
    </Container>
  )

  // ✅ NEW: Render post detail (main content)
  const renderPostDetail = () => {
    if (!selectedPostId) return null

    const selectedPost = posts.find((p) => p._id === selectedPostId)
    if (!selectedPost) return null

    return <PostDetailView post={selectedPost} onDelete={handleDeletePost} />
  }

  // ✅ If not in sidebar mode (mobile), just show posts feed
  if (!isWebSidebar) {
    return renderPostsFeed()
  }

  // ✅ In sidebar mode (web), show split view
  return (
    <WebSidebarLayout
      sidebar={renderPostsFeed()}
      main={renderPostDetail()}
      sidebarWidth={420}
      emptyStateType="post"
    />
  )
}

// ✅ NEW: Post Detail View Component
const PostDetailView = ({ post, onDelete }) => (
  <Container style={{ backgroundColor: '#fff' }}>
    <PostDetailHeader>
      <PostDetailTitle>Post Details</PostDetailTitle>
    </PostDetailHeader>

    <PostDetailContent>
      {/* Post Header */}
      <PostDetailCard>
        <PostHeader>
          <PostAvatar color={post.avatarColor || '#3498db'}>
            <PostAvatarText>{getInitials(post.username)}</PostAvatarText>
          </PostAvatar>
          <PostUserInfo>
            <PostUsername>{post.username}</PostUsername>
            <PostTimestamp>
              {new Date(post.createdAt).toLocaleDateString()} at{' '}
              {new Date(post.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </PostTimestamp>
          </PostUserInfo>
        </PostHeader>

        {/* Post Content */}
        <PostDetailText>{post.content}</PostDetailText>

        {/* Post Image (full size) */}
        {post.files?.[0] && (
          <PostDetailImage>
            <Image
              source={{ uri: post.files[0].url }}
              style={{ width: '100%', height: 400 }}
              resizeMode="cover"
            />
          </PostDetailImage>
        )}

        {/* Post Actions */}
        <PostActions>
          <ActionButton active={post.isLiked}>
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={post.isLiked ? '#e74c3c' : '#7f8c8d'}
            />
            <ActionText active={post.isLiked}>{post.likes} Likes</ActionText>
          </ActionButton>

          <ActionButton>
            <Ionicons name="chatbubble-outline" size={22} color="#7f8c8d" />
            <ActionText>{post.comments || 0} Comments</ActionText>
          </ActionButton>

          <ActionButton>
            <Ionicons name="share-outline" size={22} color="#7f8c8d" />
            <ActionText>{post.shares || 0} Shares</ActionText>
          </ActionButton>
        </PostActions>
      </PostDetailCard>

      {/* Comments Section */}
      <CommentsSection>
        <CommentsSectionTitle>Comments</CommentsSectionTitle>
        <EmptyCommentsText>
          No comments yet. Be the first to comment!
        </EmptyCommentsText>
      </CommentsSection>
    </PostDetailContent>
  </Container>
)

// ✅ NEW: Styled components for post detail
const PostDetailHeader = styled.View`
  padding: 20px;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
  background-color: #fff;
`

const PostDetailTitle = styled.Text`
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
`

const PostDetailContent = styled.ScrollView`
  flex: 1;
  padding: 20px;
`

const PostDetailCard = styled.View`
  background-color: #fff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`

const PostDetailText = styled.Text`
  font-size: 18px;
  line-height: 26px;
  color: #2c3e50;
  margin: 16px 0;
`

const PostDetailImage = styled.View`
  width: 100%;
  height: 400px;
  border-radius: 12px;
  overflow: hidden;
  margin: 16px 0;
  background-color: #f0f0f0;
`

const CommentsSection = styled.View`
  background-color: #fff;
  border-radius: 16px;
  padding: 20px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`

const CommentsSectionTitle = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 16px;
`

const EmptyCommentsText = styled.Text`
  font-size: 16px;
  color: #95a5a6;
  text-align: center;
  padding: 40px 20px;
`
