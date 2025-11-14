// screens/PostDetailScreen.js
import React, { useState, useEffect } from 'react'
import {
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import { usePosts } from '../providers/PostsProvider'
import { useComments } from '../hooks/useComments'
import { useUser } from '../hooks/useUser'
import CommentSection from '../components/CommentSection'
import * as ImagePicker from 'expo-image-picker'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'

// ─── STYLED COMPONENTS ───────────────────────────────────
const Container = styled.View`
  flex: 1;
  background-color: #f8f9fa;
`

const Header = styled.View`
  background-color: #fff;
  padding: 50px 20px 16px 20px;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
  flex-direction: row;
  align-items: center;
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
  background-color: #f8f9fa;
  margin-right: 12px;
`

const HeaderTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: #2c3e50;
  flex: 1;
`

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: #f8f9fa;
`

const PostCard = styled.View`
  background-color: #fff;
  margin: 20px;
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
`

const PostAvatar = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: ${(props) => props.color || '#3498db'};
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`

const PostAvatarText = styled.Text`
  color: #fff;
  font-size: 18px;
  font-weight: bold;
`

const PostUserInfo = styled.View`
  flex: 1;
`

const PostUsername = styled.Text`
  font-size: 17px;
  font-weight: 600;
  color: #2c3e50;
`

const PostTimestamp = styled.Text`
  font-size: 13px;
  color: #95a5a6;
  margin-top: 3px;
`

const PostContent = styled.Text`
  font-size: 16px;
  line-height: 24px;
  color: #2c3e50;
  padding: 0px 16px 16px 16px;
`

const PostImage = styled.View`
  height: 300px;
  background-color: #ecf0f1;
  margin: 0px 16px 16px 16px;
  border-radius: 12px;
  overflow: hidden;
`

const PostActions = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 12px 16px;
  border-top-width: 1px;
  border-top-color: #f8f9fa;
`

const ActionButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 10px 14px;
  margin-right: 16px;
  border-radius: 24px;
  background-color: ${(props) => (props.active ? '#e3f2fd' : '#f8f9fa')};
`

const ActionText = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: ${(props) => (props.active ? '#2196f3' : '#7f8c8d')};
  margin-left: 8px;
`

const CommentsSection = styled.View`
  background-color: #fff;
  margin: 0px 20px 20px 20px;
  border-radius: 16px;
  padding: 16px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`

const SectionTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 16px;
`

const EmptyComments = styled.Text`
  font-size: 14px;
  color: #95a5a6;
  text-align: center;
  padding: 20px;
`

const CommentInputContainer = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #fff;
  padding: 12px 20px;
  border-top-width: 1px;
  border-top-color: #e9ecef;
`

const CommentInput = styled.TextInput`
  flex: 1;
  background-color: #f8f9fa;
  padding: 12px 16px;
  border-radius: 24px;
  font-size: 15px;
  color: #2c3e50;
  margin-right: 8px;
  max-height: 100px;
`

const AttachButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
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

const ImagePreview = styled.View`
  position: relative;
  margin-right: 12px;
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
`

// ─── UTILS ───────────────────────────────────
const getInitials = (name) =>
  name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)

const formatTimestamp = (date) => {
  const now = new Date()
  const diff = now - new Date(date)
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

// ─── MAIN COMPONENT ───────────────────────────────────
export default function PostDetailScreen({ route, navigation }) {
  const { postId } = route.params
  const { posts, toggleLike } = usePosts()
  const { user } = useUser()
  const {
    getCommentsForPost,
    getCommentCount,
    loadComments,
    createComment,
    updateComment,
    deleteComment,
    toggleLike: toggleCommentLike,
    isLoadingComments,
    sending,
  } = useComments()

  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [attachedFiles, setAttachedFiles] = useState([])

  // Get comments from provider
  const comments = getCommentsForPost(postId)
  const commentCount = getCommentCount(postId)
  const loadingComments = isLoadingComments(postId)

  useEffect(() => {
    // Find post from provider
    const foundPost = posts.find((p) => p._id === postId)
    if (foundPost) {
      setPost(foundPost)
      setLoading(false)
    } else {
      // If not found, navigate back
      Alert.alert('Error', 'Post not found')
      navigation.goBack()
    }
  }, [postId, posts])

  useEffect(() => {
    // Load comments when post is loaded
    if (post && user?.uid) {
      loadComments(postId)
    }
  }, [post, postId, user?.uid])

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      })

      if (!result.canceled && result.assets?.[0]) {
        setAttachedFiles([result.assets[0]])
      }
    } catch (error) {
      console.error('Failed to pick image:', error)
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  const handleSendComment = async () => {
    if ((!commentText.trim() && attachedFiles.length === 0) || sending) return

    try {
      const result = await createComment({
        postId,
        content: commentText.trim(),
        files: attachedFiles,
        parentId: null,
      })

      if (result.success) {
        setCommentText('')
        setAttachedFiles([])
      } else {
        Alert.alert('Error', result.error || 'Failed to send comment')
      }
    } catch (error) {
      console.error('Failed to send comment:', error)
      Alert.alert('Error', 'Failed to send comment')
    }
  }

  const handleCreateComment = async (commentData) => {
    const result = await createComment(commentData)
    if (!result.success) {
      Alert.alert('Error', result.error || 'Failed to create comment')
    }
    return result
  }

  const handleUpdateComment = async (commentId, content) => {
    const result = await updateComment(commentId, postId, content)
    if (!result.success) {
      Alert.alert('Error', result.error || 'Failed to update comment')
    }
    return result
  }

  const handleDeleteComment = async (commentId) => {
    const result = await deleteComment(commentId, postId)
    if (!result.success) {
      Alert.alert('Error', result.error || 'Failed to delete comment')
    }
    return result
  }

  const handleToggleCommentLike = async (commentId, currentlyLiked) => {
    const result = await toggleCommentLike(commentId, postId, currentlyLiked)
    if (!result.success) {
      Alert.alert('Error', result.error || 'Failed to toggle like')
    }
    return result
  }

  const handleLike = async () => {
    if (!post) return

    // Use provider's toggleLike with optimistic update
    await toggleLike(post._id, post.isLiked)

    // Update local post state
    setPost((prev) => ({
      ...prev,
      isLiked: !prev.isLiked,
      likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
    }))
  }

  if (loading) {
    return (
      <LoadingContainer>
        <ActivityIndicator size="large" color="#3498db" />
      </LoadingContainer>
    )
  }

  if (!post) return null

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <Container>
        <Header>
          <BackButton onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </BackButton>
          <HeaderTitle>Post</HeaderTitle>
        </Header>

        <ScrollView>
          <PostCard>
            <PostHeader>
              <PostAvatar color={post.avatarColor || '#3498db'}>
                <PostAvatarText>{getInitials(post.username)}</PostAvatarText>
              </PostAvatar>
              <PostUserInfo>
                <PostUsername>{post.username}</PostUsername>
                <PostTimestamp>{formatTimestamp(post.createdAt)}</PostTimestamp>
              </PostUserInfo>
            </PostHeader>

            {post.content ? <PostContent>{post.content}</PostContent> : null}

            {post.files?.[0] && (
              <PostImage>
                <Image
                  source={{ uri: post.files[0].url }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </PostImage>
            )}

            <PostActions>
              <ActionButton active={post.isLiked} onPress={handleLike}>
                <Ionicons
                  name={post.isLiked ? 'heart' : 'heart-outline'}
                  size={22}
                  color={post.isLiked ? '#e74c3c' : '#7f8c8d'}
                />
                <ActionText active={post.isLiked}>{post.likes}</ActionText>
              </ActionButton>

              <ActionButton>
                <Ionicons name="chatbubble-outline" size={20} color="#7f8c8d" />
                <ActionText>{commentCount}</ActionText>
              </ActionButton>

              <ActionButton>
                <Ionicons name="share-outline" size={20} color="#7f8c8d" />
                <ActionText>{post.shares || 0}</ActionText>
              </ActionButton>
            </PostActions>
          </PostCard>

          <CommentsSection>
            <SectionTitle>Comments ({commentCount})</SectionTitle>

            {loadingComments ? (
              <ActivityIndicator
                size="small"
                color="#3498db"
                style={{ padding: 20 }}
              />
            ) : comments.length === 0 ? (
              <EmptyComments>
                No comments yet. Be the first to comment!
              </EmptyComments>
            ) : (
              <CommentSection
                postId={postId}
                currentUserId={user?.uid}
                comments={comments}
                onCreateComment={handleCreateComment}
                onUpdateComment={handleUpdateComment}
                onDeleteComment={handleDeleteComment}
                onToggleLike={handleToggleCommentLike}
              />
            )}
          </CommentsSection>
        </ScrollView>

        <CommentInputContainer>
          {attachedFiles.length > 0 && (
            <ImagePreview>
              <PreviewImage source={{ uri: attachedFiles[0].uri }} />
              <RemoveImageButton onPress={() => setAttachedFiles([])}>
                <Ionicons name="close" size={14} color="#fff" />
              </RemoveImageButton>
            </ImagePreview>
          )}

          <AttachButton onPress={handlePickImage}>
            <Ionicons name="image-outline" size={20} color="#7f8c8d" />
          </AttachButton>

          <CommentInput
            placeholder="Write a comment..."
            placeholderTextColor="#95a5a6"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />

          <SendButton
            active={commentText.trim().length > 0 || attachedFiles.length > 0}
            onPress={handleSendComment}
            disabled={
              (!commentText.trim() && attachedFiles.length === 0) || sending
            }
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={
                  commentText.trim() || attachedFiles.length > 0
                    ? '#fff'
                    : '#95a5a6'
                }
              />
            )}
          </SendButton>
        </CommentInputContainer>
      </Container>
    </KeyboardAvoidingView>
  )
}
