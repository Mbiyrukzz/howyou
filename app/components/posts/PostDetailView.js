import React, { useState, useEffect } from 'react'
import {
  View,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { usePosts } from '../../providers/PostsProvider'
import { useComments } from '../../hooks/useComments'
import CommentSection from '../CommentSection'
import { getInitials } from '../../utils/posts'
import { PostHeader } from './PostHeader'

const Container = styled.View`
  flex: 1;
  background-color: #fff;
`

const PostDetailHeader = styled.View`
  padding: 20px;
  border-bottom-width: 1px;
  border-bottom-color: #e2e8f0;
  background-color: #fff;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`

const PostDetailTitle = styled.Text`
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
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
  border-width: 1px;
  border-color: #e2e8f0;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.08;
  shadow-radius: 8px;
  elevation: 3;
`

const PostDetailText = styled.Text`
  font-size: 18px;
  line-height: 26px;
  color: #1e293b;
  margin: 16px 0;
`

const PostDetailImage = styled.View`
  width: 100%;
  height: 400px;
  border-radius: 12px;
  overflow: hidden;
  margin: 16px 0;
  background-color: #f1f5f9;
`

const CommentsSection = styled.View`
  background-color: #fff;
  border-radius: 16px;
  padding: 20px;
  border-width: 1px;
  border-color: #e2e8f0;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.08;
  shadow-radius: 8px;
  elevation: 3;
`

const CommentsSectionTitle = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 16px;
`

const EmptyCommentsText = styled.Text`
  font-size: 16px;
  color: #64748b;
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
  background-color: #f8fafc;
  border-width: 1px;
  border-color: #e2e8f0;
  align-items: center;
  flex-direction: row;
  justify-content: center;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 1;
`

const SecondaryButtonText = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #64748b;
  margin-left: 6px;
`

const DangerButton = styled.TouchableOpacity`
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  background-color: #fee2e2;
  border-width: 1px;
  border-color: #fecaca;
  align-items: center;
  flex-direction: row;
  justify-content: center;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 1;
`

const DangerButtonText = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #dc2626;
  margin-left: 6px;
`

const LoadingCommentsText = styled.Text`
  font-size: 14px;
  color: #64748b;
  text-align: center;
  padding: 20px;
`

const CommentInputContainer = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #fff;
  padding: 12px 16px;
  border-top-width: 1px;
  border-top-color: #e2e8f0;
  ${Platform.OS === 'ios' ? 'padding-bottom: 32px;' : ''}
`

const CommentInputWrapper = styled.View`
  flex: 1;
  background-color: #f8fafc;
  border-radius: 24px;
  padding: 8px 16px;
  margin-right: 12px;
  flex-direction: row;
  align-items: center;
  border-width: 1px;
  border-color: #e2e8f0;
`

const CommentTextInput = styled.TextInput`
  flex: 1;
  font-size: 15px;
  color: #1e293b;
  max-height: 100px;
  padding: 4px 0;
`

const AttachButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: #f1f5f9;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 2;
`

const SendButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: ${(props) => (props.active ? '#3b82f6' : '#f1f5f9')};
  justify-content: center;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 2;
`

const ImagePreviewContainer = styled.View`
  flex-direction: row;
  padding: 8px 16px;
  background-color: #fff;
  border-top-width: 1px;
  border-top-color: #e2e8f0;
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
  background-color: #dc2626;
  justify-content: center;
  align-items: center;
  border-width: 2px;
  border-color: #fff;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.2;
  shadow-radius: 2px;
  elevation: 3;
`

const PostActions = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 8px 0;
`

const ActionButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 8px 16px;
  margin-right: 8px;
  border-radius: 20px;
  background-color: ${(props) => (props.active ? '#fee2e2' : '#f1f5f9')};
  shadow-color: ${(props) => props.color || '#000'};
  shadow-offset: 0px 2px;
  shadow-opacity: ${(props) => (props.active ? 0.3 : 0.1)};
  shadow-radius: 4px;
  elevation: ${(props) => (props.active ? 3 : 1)};
`

const ActionText = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => (props.active ? '#dc2626' : '#64748b')};
  margin-left: 6px;
`

export const PostDetailView = ({ post, onEdit, onDelete, onLike }) => {
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

  if (!post) {
    return (
      <Container style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </Container>
    )
  }

  return (
    <Container>
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
            <PostHeader
              avatarColor={post.avatarColor}
              initials={getInitials(post.username)}
              username={post.username}
              timestamp={`${new Date(
                post.createdAt
              ).toLocaleDateString()} at ${new Date(
                post.createdAt
              ).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}`}
              showMenu={false}
            />

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
