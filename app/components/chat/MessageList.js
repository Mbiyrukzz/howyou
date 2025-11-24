import React, { useRef, useEffect } from 'react'
import { FlatList, View, Text } from 'react-native'
import { MessagesContainer } from '../../styles/chatStyles'
import { MessageItem } from './MessageItem'
import CallLogItem from '../CallLogItem'
import { ErrorContainer, ErrorText } from '../../styles/chatStyles'

export const MessageList = ({
  combinedItems,
  currentUserId,
  users,
  navigation,
  onImagePress,
  onMessageLongPress,
  onThreeDotsPress,
  hoveredMessageId,
  setHoveredMessageId,
  onCallCallback,
  onDeleteCallLog,
  isTyping,
  typingText,
}) => {
  const flatListRef = useRef(null)

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }, [combinedItems.length])

  const renderItem = ({ item, index }) => {
    if (item.type === 'call') {
      return (
        <CallLogItem
          callLog={item.data}
          onCallback={() => onCallCallback(item.data)}
          onDelete={onDeleteCallLog}
        />
      )
    }

    const previousItem =
      index > 0 && combinedItems[index - 1].type === 'message'
        ? combinedItems[index - 1].data
        : null

    return (
      <MessageItem
        item={item.data}
        previousItem={previousItem}
        currentUserId={currentUserId}
        users={users}
        navigation={navigation}
        onImagePress={onImagePress}
        onLongPress={onMessageLongPress}
        onThreeDotsPress={onThreeDotsPress}
        hoveredMessageId={hoveredMessageId}
        setHoveredMessageId={setHoveredMessageId}
      />
    )
  }

  return (
    <MessagesContainer>
      <FlatList
        ref={flatListRef}
        data={combinedItems}
        keyExtractor={(item, index) =>
          item.type === 'call'
            ? `call-${item.data._id || item.data.id || index}`
            : `message-${item.data._id || item.data.id || index}`
        }
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={() => (
          <ErrorContainer>
            <ErrorText>No messages yet. Start the conversation!</ErrorText>
          </ErrorContainer>
        )}
      />

      {isTyping && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={{ color: '#7f8c8d', fontSize: 14, fontStyle: 'italic' }}>
            {typingText}
          </Text>
        </View>
      )}
    </MessagesContainer>
  )
}
