// screens/PostsScreen.js - WITH COMMENTS PREVIEW ON ALL DEVICES
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
  TextInput,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { usePosts } from '../providers/PostsProvider'
import { useComments } from '../hooks/useComments'
import { useWebSidebar } from '../hooks/useWebSidebar'
import WebSidebarLayout from '../components/WebSidebarLayout'
import CommentSection from '../components/CommentSection'
import { useStatusViews } from '../hooks/useStatusViews'

const { width: screenWidth } = Dimensions.get('window')

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
  border-color: ${(props) => {
    // If viewed, always show gray
    if (props.isViewed) return '#808080'
    // If has story, show red/color
    if (props.hasStory) return '#0f4ce8ff'
    // Default gray for no story
    return '#e9ecef'
  }};
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

// ✅ Comments Preview Styled Components
const CommentsPreviewContainer = styled.View`
  padding: 12px 16px;
  border-top-width: 1px;
  border-top-color: #e9ecef;
  background-color: #fafbfc;
`

const CommentPreviewItem = styled.View`
  margin-bottom: 8px;
`

const CommentPreviewText = styled.Text`
  font-size: 13px;
  color: #2c3e50;
  line-height: 18px;
`

const CommentPreviewUsername = styled.Text`
  font-weight: 600;
  color: #3498db;
`

const ViewAllCommentsButton = styled.TouchableOpacity`
  padding: 8px 0;
  align-items: center;
`

const ViewAllCommentsText = styled.Text`
  font-size: 13px;
  font-weight: 600;
  color: #3498db;
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

const EditModalContent = styled.View`
  background-color: #fff;
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  padding: 24px;
  max-height: 80%;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 10;
`

const EditModalHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`

const EditModalTitle = styled.Text`
  font-size: 22px;
  font-weight: bold;
  color: #2c3e50;
`

const EditModalCloseButton = styled.TouchableOpacity`
  padding: 4px;
`

const EditTextInput = styled.TextInput`
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  font-size: 16px;
  color: #2c3e50;
  min-height: 120px;
  text-align-vertical: top;
  margin-bottom: 20px;
  border-width: 1px;
  border-color: #e9ecef;
`

const EditModalButtons = styled.View`
  flex-direction: row;
  gap: 12px;
`

const EditModalButton = styled.TouchableOpacity`
  flex: 1;
  padding: 16px;
  border-radius: 12px;
  background-color: ${(props) => (props.primary ? '#3498db' : '#e9ecef')};
  align-items: center;
  justify-content: center;
`

const EditModalButtonText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => (props.primary ? '#fff' : '#7f8c8d')};
`

const PostDetailHeader = styled.View`
  padding: 20px;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
  background-color: #fff;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
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

const ActionButtonsRow = styled.View`
  flex-direction: row;
  gap: 12px;
  margin-top: 16px;
`

const SecondaryButton = styled.TouchableOpacity`
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  background-color: #f8f9fa;
  border-width: 1px;
  border-color: #e9ecef;
  align-items: center;
  flex-direction: row;
  justify-content: center;
`

const SecondaryButtonText = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #7f8c8d;
  margin-left: 6px;
`

const DangerButton = styled.TouchableOpacity`
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  background-color: #fee;
  border-width: 1px;
  border-color: #fcc;
  align-items: center;
  flex-direction: row;
  justify-content: center;
`

const DangerButtonText = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #dc3545;
  margin-left: 6px;
`

const CommentInputContainer = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #fff;
  padding: 12px 16px;
  border-top-width: 1px;
  border-top-color: #e9ecef;
  ${Platform.OS === 'ios' ? 'padding-bottom: 32px;' : ''}
`

const CommentInputWrapper = styled.View`
  flex: 1;
  background-color: #f8f9fa;
  border-radius: 24px;
  padding: 8px 16px;
  margin-right: 12px;
  flex-direction: row;
  align-items: center;
`

const CommentTextInput = styled.TextInput`
  flex: 1;
  font-size: 15px;
  color: #2c3e50;
  max-height: 100px;
  padding: 4px 0;
`

const AttachButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: #f8f9fa;
  justify-content: center;
  align-items: center;
  margin-right: 8px;
`

const SendButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: ${(props) => (props.active ? '#3498db' : '#e9ecef')};
  justify-content: center;
  align-items: center;
`

const ImagePreviewContainer = styled.View`
  flex-direction: row;
  padding: 8px 16px;
  background-color: #fff;
  border-top-width: 1px;
  border-top-color: #e9ecef;
`

const ImagePreview = styled.View`
  position: relative;
  margin-right: 8px;
`

const PreviewImage = styled.Image`
  width: 60px;
  height: 60px;
  border-radius: 8px;
`

const RemoveImageButton = styled.TouchableOpacity`
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background-color: #e74c3c;
  justify-content: center;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.2;
  shadow-radius: 2px;
  elevation: 3;
`

const LoadingCommentsText = styled.Text`
  font-size: 14px;
  color: #95a5a6;
  text-align: center;
  padding: 20px;
`

const getInitials = (name) =>
  name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)

// ✅ NEW: Comments Preview Component - NOW AVAILABLE ON ALL DEVICES
const CommentsPreview = ({ postId, onViewAll }) => {
  const { getCommentsForPost } = useComments()
  const comments = getCommentsForPost(postId) || []

  if (comments.length === 0) return null

  const previewComments = comments.slice(0, 2)
  const hasMore = comments.length > 2

  return (
    <CommentsPreviewContainer>
      {previewComments.map((comment) => (
        <CommentPreviewItem key={comment._id}>
          <CommentPreviewText>
            <CommentPreviewUsername>{comment.username}</CommentPreviewUsername>{' '}
            {comment.content}
          </CommentPreviewText>
        </CommentPreviewItem>
      ))}

      {hasMore && (
        <ViewAllCommentsButton onPress={onViewAll}>
          <ViewAllCommentsText>
            View all {comments.length} comments
          </ViewAllCommentsText>
        </ViewAllCommentsButton>
      )}
    </CommentsPreviewContainer>
  )
}

const StoryComponent = ({ item, onPress, isYourStory, statusCount }) => {
  const { hasViewed, checkIfViewed } = useStatusViews()

  // Check if status has been viewed on mount
  useEffect(() => {
    if (!isYourStory && item.statuses?.[0]?._id) {
      checkIfViewed(item.statuses[0]._id)
    }
  }, [item, isYourStory, checkIfViewed])

  const hasStory = statusCount > 0
  const isViewed = !isYourStory && hasViewed(item.statuses?.[0]?._id)

  return (
    <StoryItem onPress={() => onPress(item)}>
      <StoryAvatarContainer>
        {hasStory && item.fileUrl ? (
          <StoryAvatar
            hasStory={true}
            color={item.userAvatarColor}
            isViewed={isViewed} // ✅ NEW: Pass viewed state
          >
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
            isViewed={isViewed} // ✅ NEW: Pass viewed state
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

        {/* ✅ UPDATED: Hide badge if viewed */}
        {!isViewed && statusCount > 1 && (
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

const EditPostModal = ({ visible, post, onClose, onSave }) => {
  const [content, setContent] = useState(post?.content || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (post) {
      setContent(post.content || '')
    }
  }, [post])

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Post content cannot be empty')
      return
    }

    setSaving(true)
    try {
      await onSave(content.trim())
      onClose()
    } catch (error) {
      Alert.alert('Error', 'Failed to update post')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <ModalOverlay>
          <TouchableWithoutFeedback>
            <EditModalContent>
              <EditModalHeader>
                <EditModalTitle>Edit Post</EditModalTitle>
                <EditModalCloseButton onPress={onClose}>
                  <Ionicons name="close" size={28} color="#7f8c8d" />
                </EditModalCloseButton>
              </EditModalHeader>

              <EditTextInput
                value={content}
                onChangeText={setContent}
                placeholder="What's on your mind?"
                multiline
                maxLength={500}
                editable={!saving}
              />

              <EditModalButtons>
                <EditModalButton onPress={onClose} disabled={saving}>
                  <EditModalButtonText>Cancel</EditModalButtonText>
                </EditModalButton>
                <EditModalButton primary onPress={handleSave} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <EditModalButtonText primary>Save</EditModalButtonText>
                  )}
                </EditModalButton>
              </EditModalButtons>
            </EditModalContent>
          </TouchableWithoutFeedback>
        </ModalOverlay>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const PostMenuModal = ({
  visible,
  post,
  onClose,
  onEdit,
  onDelete,
  isDeleting,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <TouchableWithoutFeedback onPress={!isDeleting ? onClose : null}>
      <ModalOverlay>
        <TouchableWithoutFeedback>
          <ModalContent>
            <ModalTitle>Post Options</ModalTitle>
            <ModalSubtitle>{post?.username}'s post</ModalSubtitle>

            <ModalButton
              bgColor="#e3f2fd"
              onPress={onEdit}
              disabled={isDeleting}
            >
              <Ionicons name="create-outline" size={24} color="#2196f3" />
              <ModalButtonText color="#2196f3">Edit Post</ModalButtonText>
            </ModalButton>

            <ModalButton
              bgColor="#fee"
              onPress={onDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#dc3545" />
              ) : (
                <Ionicons name="trash-outline" size={24} color="#dc3545" />
              )}
              <ModalButtonText color="#dc3545">
                {isDeleting ? 'Deleting...' : 'Delete Post'}
              </ModalButtonText>
            </ModalButton>

            <ModalCancelButton onPress={onClose} disabled={isDeleting}>
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
    updatePost,
    deletePost,
    deleteStatus,
    createPost,
    wsConnected,
    connectionState,
    wsReconnect,
    isPostOwner,
    currentUserId,
  } = usePosts()

  const { loadComments, getCommentsForPost } = useComments()

  const [refreshing, setRefreshing] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [menuModalVisible, setMenuModalVisible] = useState(false)
  const [menuSelectedPost, setMenuSelectedPost] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const scrollY = useRef(new Animated.Value(0)).current

  const [selectedPostId, setSelectedPostId] = useState(null)
  const isWebSidebar = useWebSidebar()

  useEffect(() => {
    if (route?.params?.postId) {
      setSelectedPostId(route.params.postId)
    }
  }, [route?.params?.postId])

  // ✅ Load comments for all visible posts - NOW FOR ALL DEVICES
  useEffect(() => {
    if (posts && posts.length > 0) {
      console.log('📥 Loading comments for', posts.length, 'posts')
      posts.forEach((post) => {
        loadComments(post._id)
      })
    }
  }, [posts])

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

  const handlePostPress = (post) => {
    const postId = post._id

    if (isWebSidebar) {
      console.log('🖥️ Sidebar mode: selecting post', postId)
      setSelectedPostId(postId)

      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState({}, '', `/posts/${postId}`)
      }
    } else {
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

  const handlePostMenu = (post) => {
    console.log('📋 Menu clicked for post:', post._id)
    setMenuSelectedPost(post)
    setMenuModalVisible(true)
  }

  const handleUpdatePost = async (newContent) => {
    if (!editingPost) return

    try {
      await updatePost(editingPost._id, newContent)

      setEditModalVisible(false)
      setEditingPost(null)

      setTimeout(() => {
        if (Platform.OS === 'web') {
          alert('Post updated successfully!')
        } else {
          Alert.alert('Success', 'Post updated successfully')
        }
      }, 100)
    } catch (error) {
      console.error('Update post error:', error)
      Alert.alert('Error', 'Failed to update post. Please try again.')
      throw error
    }
  }

  const handleDeletePost = async () => {
    if (!menuSelectedPost) return

    console.log('🗑️ Delete clicked for post:', menuSelectedPost._id)
    setIsDeleting(true)

    try {
      console.log('📡 Calling deletePost...')
      await deletePost(menuSelectedPost._id)

      console.log('✅ Delete successful')

      setMenuModalVisible(false)

      if (selectedPostId === menuSelectedPost._id) {
        setSelectedPostId(null)
        if (typeof window !== 'undefined' && window.history) {
          window.history.pushState({}, '', '/posts')
        }
      }

      setMenuSelectedPost(null)

      setTimeout(() => {
        if (Platform.OS === 'web') {
          alert('Post deleted successfully!')
        } else {
          Alert.alert('Success', 'Post deleted successfully')
        }
      }, 100)
    } catch (error) {
      console.error('❌ Delete post error:', error)

      if (Platform.OS === 'web') {
        alert('Failed to delete post: ' + (error.message || 'Unknown error'))
      } else {
        Alert.alert('Error', 'Failed to delete post. Please try again.')
      }
    } finally {
      setIsDeleting(false)
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

                  {isPostOwner(item) && (
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
                  )}
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
                    <ActionText>{comments.length}</ActionText>
                  </ActionButton>

                  <ActionButton onPress={(e) => e.stopPropagation()}>
                    <Ionicons name="share-outline" size={18} color="#7f8c8d" />
                    <ActionText>{item.shares || 0}</ActionText>
                  </ActionButton>
                </PostActions>

                {/* ✅ Comments Preview - NOW AVAILABLE ON ALL DEVICES (Mobile & Web) */}
                <CommentsPreview
                  postId={item._id}
                  onViewAll={() => handlePostPress(item)}
                />
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

const PostDetailView = ({ post, onEdit, onDelete, onLike }) => {
  const { isPostOwner, currentUserId } = usePosts()
  const {
    loadComments,
    createComment,
    updateComment,
    deleteComment,
    toggleLike: toggleCommentLike,
    getCommentsForPost,
    isLoadingComments,
    sending,
  } = useComments()

  const [commentText, setCommentText] = useState('')
  const [commentFiles, setCommentFiles] = useState([])
  const [loadedComments, setLoadedComments] = useState(false)

  useEffect(() => {
    if (post?._id && !loadedComments) {
      console.log('📥 Loading comments for post:', post._id)
      loadComments(post._id)
      setLoadedComments(true)
    }
  }, [post?._id, loadedComments, loadComments])

  const comments = getCommentsForPost(post._id)
  const isLoading = isLoadingComments(post._id)

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to attach images')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    })

    if (!result.canceled && result.assets?.[0]) {
      setCommentFiles([result.assets[0]])
    }
  }

  const handleSendComment = async () => {
    if (!commentText.trim() && commentFiles.length === 0) {
      return
    }

    try {
      const result = await createComment({
        postId: post._id,
        content: commentText.trim(),
        files: commentFiles,
        parentId: null,
      })

      if (result && result.success) {
        setCommentText('')
        setCommentFiles([])
      } else if (result && result.error) {
        Alert.alert('Error', result.error)
      } else {
        setCommentText('')
        setCommentFiles([])
      }
    } catch (error) {
      console.error('Failed to send comment:', error)
      Alert.alert('Error', error?.message || 'Failed to post comment')
    }
  }

  const handleUpdateComment = async (commentId, newContent) => {
    try {
      const result = await updateComment(commentId, post._id, newContent)
      if (result && !result.success && result.error) {
        Alert.alert('Error', result.error)
      }
    } catch (error) {
      console.error('Failed to update comment:', error)
      Alert.alert('Error', error?.message || 'Failed to update comment')
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      const result = await deleteComment(commentId, post._id)
      if (result && !result.success && result.error) {
        Alert.alert('Error', result.error)
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
      Alert.alert('Error', error?.message || 'Failed to delete comment')
    }
  }

  const handleToggleCommentLike = async (commentId, isLiked) => {
    try {
      const result = await toggleCommentLike(commentId, post._id, isLiked)
      if (result && !result.success && result.error) {
        console.error('Failed to toggle like:', result.error)
      }
    } catch (error) {
      console.error('Failed to toggle comment like:', error)
    }
  }

  return (
    <Container style={{ backgroundColor: '#fff' }}>
      <PostDetailHeader>
        <PostDetailTitle>Post Details</PostDetailTitle>
      </PostDetailHeader>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <PostDetailContent>
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

            <PostDetailText>{post.content}</PostDetailText>

            {post.files?.[0] && (
              <PostDetailImage>
                <Image
                  source={{ uri: post.files[0].url }}
                  style={{ width: '100%', height: 400 }}
                  resizeMode="cover"
                />
              </PostDetailImage>
            )}

            <PostActions>
              <ActionButton active={post.isLiked} onPress={onLike}>
                <Ionicons
                  name={post.isLiked ? 'heart' : 'heart-outline'}
                  size={24}
                  color={post.isLiked ? '#e74c3c' : '#7f8c8d'}
                />
                <ActionText active={post.isLiked}>
                  {post.likes} Likes
                </ActionText>
              </ActionButton>

              <ActionButton>
                <Ionicons name="chatbubble-outline" size={22} color="#7f8c8d" />
                <ActionText>{comments.length} Comments</ActionText>
              </ActionButton>

              <ActionButton>
                <Ionicons name="share-outline" size={22} color="#7f8c8d" />
                <ActionText>{post.shares || 0} Shares</ActionText>
              </ActionButton>
            </PostActions>

            {isPostOwner(post) && (
              <ActionButtonsRow>
                <SecondaryButton onPress={onEdit}>
                  <Ionicons name="create-outline" size={20} color="#7f8c8d" />
                  <SecondaryButtonText>Edit Post</SecondaryButtonText>
                </SecondaryButton>

                <DangerButton onPress={onDelete}>
                  <Ionicons name="trash-outline" size={20} color="#dc3545" />
                  <DangerButtonText>Delete</DangerButtonText>
                </DangerButton>
              </ActionButtonsRow>
            )}
          </PostDetailCard>

          <CommentsSection>
            <CommentsSectionTitle>
              Comments ({comments.length})
            </CommentsSectionTitle>

            {isLoading && !loadedComments ? (
              <LoadingCommentsText>Loading comments...</LoadingCommentsText>
            ) : comments.length === 0 ? (
              <EmptyCommentsText>
                No comments yet. Be the first to comment!
              </EmptyCommentsText>
            ) : (
              <CommentSection
                postId={post._id}
                currentUserId={currentUserId}
                comments={comments}
                onCreateComment={createComment}
                onUpdateComment={handleUpdateComment}
                onDeleteComment={handleDeleteComment}
                onToggleLike={handleToggleCommentLike}
              />
            )}
          </CommentsSection>
        </PostDetailContent>

        {commentFiles.length > 0 && (
          <ImagePreviewContainer>
            {commentFiles.map((file, idx) => (
              <ImagePreview key={idx}>
                <PreviewImage source={{ uri: file.uri }} />
                <RemoveImageButton onPress={() => setCommentFiles([])}>
                  <Ionicons name="close" size={14} color="#fff" />
                </RemoveImageButton>
              </ImagePreview>
            ))}
          </ImagePreviewContainer>
        )}

        <CommentInputContainer>
          <AttachButton onPress={handlePickImage}>
            <Ionicons name="image-outline" size={20} color="#7f8c8d" />
          </AttachButton>

          <CommentInputWrapper>
            <CommentTextInput
              placeholder="Write a comment..."
              placeholderTextColor="#95a5a6"
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
              editable={!sending}
            />
          </CommentInputWrapper>

          <SendButton
            active={(commentText.trim() || commentFiles.length > 0) && !sending}
            onPress={handleSendComment}
            disabled={
              (!commentText.trim() && commentFiles.length === 0) || sending
            }
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={
                  commentText.trim() || commentFiles.length > 0
                    ? '#fff'
                    : '#95a5a6'
                }
              />
            )}
          </SendButton>
        </CommentInputContainer>
      </KeyboardAvoidingView>
    </Container>
  )
}
