import React from 'react'
import { TouchableOpacity } from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'

const ReplyBarContainer = styled.View`
  background-color: #f8f9fa;
  border-top-width: 3px;
  border-top-color: #3b82f6;
  padding: 12px 16px;
  flex-direction: row;
  align-items: center;
  gap: 12px;
`

const ReplyIconWrapper = styled.View`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: #dbeafe;
  align-items: center;
  justify-content: center;
`

const ReplyContent = styled.View`
  flex: 1;
`

const ReplyHeader = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 4px;
`

const ReplyLabel = styled.Text`
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  margin-right: 6px;
`

const ReplySenderName = styled.Text`
  font-size: 12px;
  font-weight: 700;
  color: #3b82f6;
`

const ReplyText = styled.Text`
  font-size: 14px;
  color: #1e293b;
  line-height: 18px;
`

const CloseButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: #e5e7eb;
  align-items: center;
  justify-content: center;
`

export const ReplyPreviewBar = ({ replyTo, onClose, currentUserId }) => {
  if (!replyTo) return null

  const truncateText = (text, maxLength = 80) => {
    if (!text) return ''
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
  }

  const getMediaLabel = () => {
    if (replyTo.type === 'image') return '📷 Photo'
    if (replyTo.type === 'video') return '🎥 Video'
    if (replyTo.type === 'audio') return '🎵 Audio'
    if (replyTo.type === 'file') return '📎 File'
    return ''
  }

  // ✅ CRITICAL FIX: Check if replying to own message
  const isReplyingToSelf = replyTo.senderId === currentUserId
  const displayName = isReplyingToSelf ? 'You' : replyTo.senderName || 'User'

  return (
    <ReplyBarContainer>
      <ReplyIconWrapper>
        <Ionicons name="arrow-undo" size={18} color="#3b82f6" />
      </ReplyIconWrapper>

      <ReplyContent>
        <ReplyHeader>
          <ReplyLabel>Replying to</ReplyLabel>
          <ReplySenderName>{displayName}</ReplySenderName>
        </ReplyHeader>
        <ReplyText numberOfLines={2}>
          {replyTo.content
            ? truncateText(replyTo.content)
            : getMediaLabel() || 'Message'}
        </ReplyText>
      </ReplyContent>

      <CloseButton onPress={onClose} activeOpacity={0.7}>
        <Ionicons name="close" size={18} color="#64748b" />
      </CloseButton>
    </ReplyBarContainer>
  )
}
