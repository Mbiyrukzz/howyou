import React from 'react'
import styled from 'styled-components/native'
import { Vibration } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const ActionsContainer = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 8px 16px 16px 16px;
  border-top-width: 1px;
  border-top-color: #f1f5f9;
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

const ShareActionButton = styled(ActionButton)`
  background-color: ${(props) => (props.active ? '#dbeafe' : '#f1f5f9')};
`

const ShareActionText = styled(ActionText)`
  color: ${(props) => (props.active ? '#2563eb' : '#64748b')};
`

const CommentActionButton = styled(ActionButton)`
  background-color: ${(props) => (props.active ? '#dcfce7' : '#f1f5f9')};
`

const CommentActionText = styled(ActionText)`
  color: ${(props) => (props.active ? '#16a34a' : '#64748b')};
`

export const PostActions = ({
  likes,
  commentsCount,
  shares,
  isLiked,
  onLikePress,
  onCommentPress,
  onSharePress,
}) => {
  return (
    <ActionsContainer>
      <ActionButton
        active={isLiked}
        color="#fee2e2"
        onPress={() => {
          Vibration.vibrate(10)
          onLikePress()
        }}
      >
        <Ionicons
          name={isLiked ? 'heart' : 'heart-outline'}
          size={20}
          color={isLiked ? '#dc2626' : '#64748b'}
        />
        <ActionText active={isLiked}>{likes}</ActionText>
      </ActionButton>

      <CommentActionButton
        onPress={() => {
          Vibration.vibrate(10)
          onCommentPress()
        }}
        color="#dcfce7"
      >
        <Ionicons name="chatbubble-outline" size={18} color="#64748b" />
        <CommentActionText>{commentsCount}</CommentActionText>
      </CommentActionButton>

      <ShareActionButton
        onPress={() => {
          Vibration.vibrate(10)
          onSharePress()
        }}
        color="#dbeafe"
      >
        <Ionicons name="share-outline" size={18} color="#64748b" />
        <ShareActionText>{shares || 0}</ShareActionText>
      </ShareActionButton>
    </ActionsContainer>
  )
}
