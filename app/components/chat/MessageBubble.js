import React from 'react'
import { View } from 'react-native'
import {
  MessageBubble as Bubble,
  MessageText,
  MessageTime,
} from '../../styles/chatStyles'
import { MessageStatusIndicator } from './MessageStatusIndicator'
import { MessageEditedLabel } from '../MessageActions'
import { MessageContent } from './MessageContent'
import { formatMessageTime } from '../../utils/chatHelpers'

export const MessageBubble = ({
  message,
  isOwn,
  displayName,
  navigation,
  onImagePress,
}) => {
  const isEdited =
    message.updatedAt &&
    new Date(message.updatedAt).getTime() >
      new Date(message.createdAt).getTime()

  const timeString = `${formatMessageTime(message.createdAt)} • ${displayName}`

  return (
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

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 4,
          justifyContent: isOwn ? 'space-between' : 'flex-start',
        }}
      >
        <MessageTime isOwn={isOwn}>{timeString}</MessageTime>
        {isEdited && (
          <MessageEditedLabel isOwn={isOwn}>(edited)</MessageEditedLabel>
        )}
        <MessageStatusIndicator status={message.status} isOwn={isOwn} />
      </View>
    </Bubble>
  )
}
