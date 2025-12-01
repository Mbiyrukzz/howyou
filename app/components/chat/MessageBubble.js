import React from 'react'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import styled from 'styled-components/native'
import {
  MessageBubble as Bubble,
  MessageText,
  MessageTime,
} from '../../styles/chatStyles'
import { MessageStatusIndicator } from './MessageStatusIndicator'
import { MessageEditedLabel } from '../MessageActions'
import { MessageContent } from './MessageContent'
import { formatMessageTime } from '../../utils/chatHelpers'

// Enhanced styled components
const MessageWrapper = styled.View`
  margin-bottom: 8px;
`

const BubbleContainer = styled.View`
  position: relative;
`

const MessageHeader = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 4px;
  padding: 0 4px;
`

const DisplayNameText = styled.Text`
  color: ${(props) => (props.isOwn ? '#3b82f6' : '#64748b')};
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
`

const VerifiedBadge = styled.View`
  margin-left: 4px;
  background-color: ${(props) => (props.isOwn ? '#dbeafe' : '#f1f5f9')};
  border-radius: 8px;
  padding: 2px 4px;
  flex-direction: row;
  align-items: center;
`

const MessageFooter = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 6px;
  justify-content: ${(props) => (props.isOwn ? 'space-between' : 'flex-start')};
  gap: 8px;
`

const TimeContainer = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
`

const TimeDot = styled.View`
  width: 3px;
  height: 3px;
  border-radius: 1.5px;
  background-color: ${(props) =>
    props.isOwn ? 'rgba(255, 255, 255, 0.6)' : '#94a3b8'};
`

const EnhancedMessageTime = styled.Text`
  color: ${(props) => (props.isOwn ? 'rgba(255, 255, 255, 0.7)' : '#94a3b8')};
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.2px;
`

const EditedBadge = styled.View`
  background-color: ${(props) =>
    props.isOwn ? 'rgba(255, 255, 255, 0.2)' : '#f1f5f9'};
  padding: 2px 6px;
  border-radius: 8px;
  flex-direction: row;
  align-items: center;
  gap: 4px;
`

const EditedText = styled.Text`
  color: ${(props) => (props.isOwn ? 'rgba(255, 255, 255, 0.8)' : '#64748b')};
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const PriorityBadge = styled.View`
  position: absolute;
  top: -8px;
  right: ${(props) => (props.isOwn ? 'auto' : '12px')};
  left: ${(props) => (props.isOwn ? '12px' : 'auto')};
  background-color: ${(props) => {
    switch (props.priority) {
      case 'high':
        return '#fee2e2'
      case 'urgent':
        return '#fecaca'
      default:
        return '#dbeafe'
    }
  }};
  padding: 4px 8px;
  border-radius: 10px;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 2;
`

const PriorityText = styled.Text`
  color: ${(props) => {
    switch (props.priority) {
      case 'high':
        return '#dc2626'
      case 'urgent':
        return '#b91c1c'
      default:
        return '#2563eb'
    }
  }};
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const ReactionContainer = styled.View`
  position: absolute;
  bottom: -12px;
  right: ${(props) => (props.isOwn ? '12px' : 'auto')};
  left: ${(props) => (props.isOwn ? 'auto' : '12px')};
  flex-direction: row;
  gap: 4px;
`

const ReactionBubble = styled.View`
  background-color: white;
  border-radius: 12px;
  padding: 4px 8px;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
  border-width: 1px;
  border-color: #e2e8f0;
`

const ReactionEmoji = styled.Text`
  font-size: 12px;
`

const ReactionCount = styled.Text`
  color: #64748b;
  font-size: 10px;
  font-weight: 600;
`

export const MessageBubble = ({
  message,
  isOwn,
  displayName,
  navigation,
  onImagePress,
  showDisplayName = false,
  isVerified = false,
  priority, // 'normal', 'high', 'urgent'
  reactions = [], // Array of { emoji: '👍', count: 2 }
}) => {
  const isEdited =
    message.updatedAt &&
    new Date(message.updatedAt).getTime() >
      new Date(message.createdAt).getTime()

  const timeString = formatMessageTime(message.createdAt)

  const getPriorityIcon = () => {
    switch (priority) {
      case 'urgent':
        return 'alert-circle'
      case 'high':
        return 'flag'
      default:
        return 'information-circle'
    }
  }

  return (
    <MessageWrapper>
      {showDisplayName && !isOwn && (
        <MessageHeader>
          <DisplayNameText isOwn={isOwn}>{displayName}</DisplayNameText>
          {isVerified && (
            <VerifiedBadge isOwn={isOwn}>
              <Ionicons
                name="checkmark-circle"
                size={10}
                color={isOwn ? '#3b82f6' : '#64748b'}
              />
            </VerifiedBadge>
          )}
        </MessageHeader>
      )}

      <BubbleContainer>
        {priority && priority !== 'normal' && (
          <PriorityBadge priority={priority} isOwn={isOwn}>
            <Ionicons
              name={getPriorityIcon()}
              size={10}
              color={
                priority === 'urgent'
                  ? '#b91c1c'
                  : priority === 'high'
                  ? '#dc2626'
                  : '#2563eb'
              }
            />
            <PriorityText priority={priority}>{priority}</PriorityText>
          </PriorityBadge>
        )}

        <Bubble isOwn={isOwn}>
          {message.content && message.content.trim().length > 0 && (
            <MessageText isOwn={isOwn}>{message.content.trim()}</MessageText>
          )}

          <MessageContent
            message={message}
            isOwn={isOwn}
            onImagePress={onImagePress}
            navigation={navigation}
          />

          <MessageFooter isOwn={isOwn}>
            <TimeContainer>
              <EnhancedMessageTime isOwn={isOwn}>
                {timeString}
              </EnhancedMessageTime>
              {!isOwn && displayName && (
                <>
                  <TimeDot isOwn={isOwn} />
                  <EnhancedMessageTime isOwn={isOwn}>
                    {displayName}
                  </EnhancedMessageTime>
                </>
              )}
            </TimeContainer>

            {isEdited && (
              <EditedBadge isOwn={isOwn}>
                <Ionicons
                  name="create-outline"
                  size={10}
                  color={isOwn ? 'rgba(255, 255, 255, 0.8)' : '#64748b'}
                />
                <EditedText isOwn={isOwn}>Edited</EditedText>
              </EditedBadge>
            )}

            <MessageStatusIndicator status={message.status} isOwn={isOwn} />
          </MessageFooter>
        </Bubble>

        {reactions && reactions.length > 0 && (
          <ReactionContainer isOwn={isOwn}>
            {reactions.map((reaction, index) => (
              <ReactionBubble key={index}>
                <ReactionEmoji>{reaction.emoji}</ReactionEmoji>
                {reaction.count > 1 && (
                  <ReactionCount>{reaction.count}</ReactionCount>
                )}
              </ReactionBubble>
            ))}
          </ReactionContainer>
        )}
      </BubbleContainer>
    </MessageWrapper>
  )
}
