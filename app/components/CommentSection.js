// components/CommentSection.js
import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'

// ─── STYLED COMPONENTS ───────────────────────────────────
const CommentItem = styled.View`
  margin-bottom: 16px;
`

const CommentRow = styled.View`
  flex-direction: row;
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
`

const CommentBubble = styled.TouchableOpacity`
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 6px;
`

const CommentHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
`

const CommentUsername = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
`

const CommentTimestamp = styled.Text`
  font-size: 12px;
  color: #95a5a6;
`

const CommentText = styled.Text`
  font-size: 14px;
  line-height: 20px;
  color: #34495e;
`

const CommentImage = styled.Image`
  width: 100%;
  height: 200px;
  border-radius: 8px;
  margin-top: 8px;
`

const CommentActions = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 16px;
`

const CommentActionButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  gap: 4px;
`

const CommentActionText = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: ${(props) => (props.active ? '#e74c3c' : '#7f8c8d')};
`

const RepliesContainer = styled.View`
  margin-left: 48px;
  margin-top: 8px;
  border-left-width: 2px;
  border-left-color: #e9ecef;
  padding-left: 12px;
`

const ReplyInputContainer = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #fff;
  padding: 12px;
  border-top-width: 1px;
  border-top-color: #e9ecef;
`

const ReplyInput = styled.TextInput`
  flex: 1;
  background-color: #f8f9fa;
  padding: 12px 16px;
  border-radius: 24px;
  font-size: 15px;
  color: #2c3e50;
  margin-right: 12px;
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

const EmptyState = styled.Text`
  font-size: 14px;
  color: #95a5a6;
  text-align: center;
  padding: 20px;
`

const EditingIndicator = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #fff3cd;
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 8px;
`

const EditingText = styled.Text`
  flex: 1;
  font-size: 13px;
  color: #856404;
  margin-left: 8px;
`

const CancelEditButton = styled.TouchableOpacity`
  padding: 4px 12px;
`

const CancelEditText = styled.Text`
  font-size: 13px;
  font-weight: 600;
  color: #856404;
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

// ─── MINI REPLY INPUT COMPONENT ───────────────────────────────────
const MiniReplyInput = ({ onSubmit, onCancel }) => {
  const [text, setText] = useState('')
  const [files, setFiles] = useState([])

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    })

    if (!result.canceled && result.assets?.[0]) {
      setFiles([result.assets[0]])
    }
  }

  const handleSubmit = () => {
    if (text.trim() || files.length > 0) {
      onSubmit(text, files)
      setText('')
      setFiles([])
    }
  }

  return (
    <View style={{ backgroundColor: '#f8f9fa', borderRadius: 12, padding: 8 }}>
      {files.length > 0 && (
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          {files.map((file, idx) => (
            <ImagePreview key={idx}>
              <PreviewImage source={{ uri: file.uri }} />
              <RemoveImageButton onPress={() => setFiles([])}>
                <Ionicons name="close" size={14} color="#fff" />
              </RemoveImageButton>
            </ImagePreview>
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <AttachButton onPress={handlePickImage}>
          <Ionicons name="image-outline" size={20} color="#7f8c8d" />
        </AttachButton>

        <TextInput
          style={{
            flex: 1,
            backgroundColor: '#fff',
            padding: 8,
            borderRadius: 16,
            fontSize: 14,
            color: '#2c3e50',
            marginRight: 8,
          }}
          placeholder="Write a reply..."
          placeholderTextColor="#95a5a6"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
        />

        <TouchableOpacity
          onPress={onCancel}
          style={{
            padding: 8,
            marginRight: 8,
          }}
        >
          <Text style={{ fontSize: 13, color: '#7f8c8d' }}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!text.trim() && files.length === 0}
          style={{
            backgroundColor:
              text.trim() || files.length > 0 ? '#3498db' : '#e9ecef',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 16,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: text.trim() || files.length > 0 ? '#fff' : '#95a5a6',
            }}
          >
            Send
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── SINGLE COMMENT COMPONENT ───────────────────────────────────
const Comment = ({
  comment,
  postId,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onToggleLike,
  depth = 0,
}) => {
  const [showReplies, setShowReplies] = useState(true)
  const [showReplyInput, setShowReplyInput] = useState(false)

  const isOwner = comment.userId === currentUserId
  const hasReplies = comment.replies && comment.replies.length > 0

  const handleReply = (text, files) => {
    onReply(comment._id, text, files)
    setShowReplyInput(false)
  }

  const handleEdit = () => {
    Alert.prompt(
      'Edit Comment',
      'Edit your comment:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (text) => {
            if (text?.trim()) {
              onEdit(comment._id, text)
            }
          },
        },
      ],
      'plain-text',
      comment.content
    )
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(comment._id),
        },
      ]
    )
  }

  const handleLongPress = () => {
    if (isOwner) {
      Alert.alert('Comment Options', 'What would you like to do?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: handleEdit },
        { text: 'Delete', style: 'destructive', onPress: handleDelete },
      ])
    }
  }

  return (
    <CommentItem>
      <CommentRow>
        <CommentAvatar color={comment.avatarColor || '#3498db'}>
          <CommentAvatarText>{getInitials(comment.username)}</CommentAvatarText>
        </CommentAvatar>

        <CommentContent>
          <CommentBubble onLongPress={handleLongPress} delayLongPress={500}>
            <CommentHeader>
              <CommentUsername>{comment.username}</CommentUsername>
              <CommentTimestamp>
                {formatTimestamp(comment.createdAt)}
              </CommentTimestamp>
            </CommentHeader>

            {comment.content ? (
              <CommentText>{comment.content}</CommentText>
            ) : null}

            {comment.files?.[0] && (
              <CommentImage
                source={{ uri: comment.files[0].url }}
                resizeMode="cover"
              />
            )}
          </CommentBubble>

          <CommentActions>
            <CommentActionButton
              onPress={() => onToggleLike(comment._id, comment.isLiked)}
            >
              <Ionicons
                name={comment.isLiked ? 'heart' : 'heart-outline'}
                size={16}
                color={comment.isLiked ? '#e74c3c' : '#7f8c8d'}
              />
              <CommentActionText active={comment.isLiked}>
                {comment.likes || 0}
              </CommentActionText>
            </CommentActionButton>

            {depth < 3 && (
              <CommentActionButton
                onPress={() => setShowReplyInput(!showReplyInput)}
              >
                <Ionicons name="chatbubble-outline" size={14} color="#7f8c8d" />
                <CommentActionText>Reply</CommentActionText>
              </CommentActionButton>
            )}

            {hasReplies && (
              <CommentActionButton onPress={() => setShowReplies(!showReplies)}>
                <Ionicons
                  name={showReplies ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color="#7f8c8d"
                />
                <CommentActionText>
                  {comment.replies.length}{' '}
                  {comment.replies.length === 1 ? 'reply' : 'replies'}
                </CommentActionText>
              </CommentActionButton>
            )}
          </CommentActions>

          {showReplyInput && (
            <View style={{ marginTop: 8 }}>
              <MiniReplyInput
                onSubmit={handleReply}
                onCancel={() => setShowReplyInput(false)}
              />
            </View>
          )}

          {hasReplies && showReplies && (
            <RepliesContainer>
              {comment.replies.map((reply) => (
                <Comment
                  key={reply._id}
                  comment={reply}
                  postId={postId}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleLike={onToggleLike}
                  depth={depth + 1}
                />
              ))}
            </RepliesContainer>
          )}
        </CommentContent>
      </CommentRow>
    </CommentItem>
  )
}

// ─── MAIN COMMENT SECTION COMPONENT ───────────────────────────────────
const CommentSection = ({
  postId,
  currentUserId,
  comments,
  onCreateComment,
  onUpdateComment,
  onDeleteComment,
  onToggleLike,
}) => {
  const handleReply = async (parentId, text, files) => {
    try {
      await onCreateComment({
        postId,
        content: text,
        files,
        parentId,
      })
    } catch (error) {
      console.error('Failed to send reply:', error)
      Alert.alert('Error', 'Failed to send reply')
    }
  }

  const handleEdit = async (commentId, text) => {
    try {
      await onUpdateComment(commentId, text)
    } catch (error) {
      console.error('Failed to edit comment:', error)
      Alert.alert('Error', 'Failed to edit comment')
    }
  }

  const handleDelete = async (commentId) => {
    try {
      await onDeleteComment(commentId)
    } catch (error) {
      console.error('Failed to delete comment:', error)
      Alert.alert('Error', 'Failed to delete comment')
    }
  }

  return (
    <View>
      {comments.map((comment) => (
        <Comment
          key={comment._id}
          comment={comment}
          postId={postId}
          currentUserId={currentUserId}
          onReply={handleReply}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleLike={onToggleLike}
          depth={0}
        />
      ))}
    </View>
  )
}

export default CommentSection
