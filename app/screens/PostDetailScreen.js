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

const CommentItem = styled.View`
  flex-direction: row;
  margin-bottom: 16px;
`

const CommentAvatar = styled.View`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: ${(props) => props.color || '#3498db'};
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`

const CommentAvatarText = styled.Text`
  color: #fff;
  font-size: 14px;
  font-weight: bold;
`

const CommentContent = styled.View`
  flex: 1;
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 12px;
`

const CommentUsername = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
`

const CommentText = styled.Text`
  font-size: 14px;
  line-height: 20px;
  color: #34495e;
`

const CommentTimestamp = styled.Text`
  font-size: 12px;
  color: #95a5a6;
  margin-top: 6px;
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
  margin-right: 12px;
`

const SendButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: ${(props) => (props.active ? '#3498db' : '#e9ecef')};
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

  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [sending, setSending] = useState(false)

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
    // Fetch comments when post is loaded
    if (post) {
      fetchComments()
    }
  }, [post])

  const fetchComments = async () => {
    // TODO: Implement comments endpoint
    // For now, use empty array
    setComments([])
  }

  const handleSendComment = async () => {
    if (!commentText.trim() || sending) return

    try {
      setSending(true)
      // TODO: Implement comment creation
      // const response = await apiPost(`${API_URL}/posts/${postId}/comments`, {
      //   content: commentText.trim(),
      // })
      // setComments([response.comment, ...comments])
      setCommentText('')
      Alert.alert('Coming Soon', 'Comments feature will be available soon!')
    } catch (error) {
      console.error('Failed to send comment:', error)
      Alert.alert('Error', 'Failed to send comment')
    } finally {
      setSending(false)
    }
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
                <ActionText>{comments.length}</ActionText>
              </ActionButton>

              <ActionButton>
                <Ionicons name="share-outline" size={20} color="#7f8c8d" />
                <ActionText>{post.shares || 0}</ActionText>
              </ActionButton>
            </PostActions>
          </PostCard>

          <CommentsSection>
            <SectionTitle>Comments</SectionTitle>

            {comments.length === 0 ? (
              <EmptyComments>
                No comments yet. Be the first to comment!
              </EmptyComments>
            ) : (
              comments.map((comment) => (
                <CommentItem key={comment._id}>
                  <CommentAvatar color={comment.avatarColor || '#3498db'}>
                    <CommentAvatarText>
                      {getInitials(comment.username)}
                    </CommentAvatarText>
                  </CommentAvatar>
                  <CommentContent>
                    <CommentUsername>{comment.username}</CommentUsername>
                    <CommentText>{comment.content}</CommentText>
                    <CommentTimestamp>
                      {formatTimestamp(comment.createdAt)}
                    </CommentTimestamp>
                  </CommentContent>
                </CommentItem>
              ))
            )}
          </CommentsSection>
        </ScrollView>

        <CommentInputContainer>
          <CommentInput
            placeholder="Write a comment..."
            placeholderTextColor="#95a5a6"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <SendButton
            active={commentText.trim().length > 0}
            onPress={handleSendComment}
            disabled={!commentText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={commentText.trim() ? '#fff' : '#95a5a6'}
              />
            )}
          </SendButton>
        </CommentInputContainer>
      </Container>
    </KeyboardAvoidingView>
  )
}
