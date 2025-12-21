import React, { useState } from 'react'
import { View, TouchableOpacity, Platform, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { DateSeparator } from './DateSeparator'
import { MessageBubble } from './MessageBubble'
import { formatMessageDate, findUserByAnyId } from '../../utils/chatHelpers'
import { Swipeable } from 'react-native-gesture-handler'

export const MessageItem = React.memo(
  ({
    item,
    previousItem,
    currentUserId,
    users,
    navigation,
    onImagePress,
    onLongPress,
    onThreeDotsPress,
    onReply, // Reply callback from ChatDetailScreen
    onReplyPress, // Callback to scroll to replied message
    hoveredMessageId,
    setHoveredMessageId,
  }) => {
    const [showOptions, setShowOptions] = useState(false)

    const isOwn = item.senderId === currentUserId
    const messageId = item._id || item.id
    const isHovered = Platform.OS === 'web' && hoveredMessageId === messageId

    const showDate =
      !previousItem ||
      formatMessageDate(previousItem.createdAt) !==
        formatMessageDate(item.createdAt)

    const sender = findUserByAnyId(users, item.senderId)
    const displayName = isOwn ? 'You' : sender?.name || 'Unknown'

    const handleMessageLongPress = () => {
      if (Platform.OS !== 'web') {
        setShowOptions(true)
        setTimeout(() => setShowOptions(false), 200)
        onLongPress(item)
      }
    }

    const handleThreeDotsPress = (e) => {
      if (Platform.OS === 'web') {
        if (e && e.stopPropagation) e.stopPropagation()
        const clickX =
          e?.nativeEvent?.pageX || e?.pageX || window.innerWidth - 200
        const clickY = e?.nativeEvent?.pageY || e?.pageY || 150
        onThreeDotsPress(item, { x: clickX, y: clickY })
      }
    }

    // ✅ FIXED: Pass actual sender info, not display name
    const handleReply = () => {
      if (!onReply) return

      console.log('📬 MessageItem: Reply button clicked for message:', {
        messageId: item._id || item.id,
        senderId: item.senderId,
        currentUserId,
        isOwn,
      })

      // Get the actual sender name from the sender object (not displayName which could be "You")
      const actualSenderName = sender?.name || sender?.username || 'Unknown'

      // Format reply data correctly with actual sender info
      const replyData = {
        _id: item._id || item.id,
        content: item.content || '',
        type: item.type || 'text',
        senderName: actualSenderName, // Always use actual name from sender object
        senderId: item.senderId,
      }

      console.log('📬 MessageItem: Calling onReply with:', replyData)
      onReply(replyData)
    }

    // Swipe action for mobile
    const renderRightActions = (progress, dragX) => {
      const trans = dragX.interpolate({
        inputRange: [0, 50, 100, 101],
        outputRange: [0, 0, 0, 1],
      })

      return (
        <TouchableOpacity
          onPress={handleReply}
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            width: 70,
            backgroundColor: '#3b82f6',
            marginVertical: 4,
            borderRadius: 12,
          }}
        >
          <Animated.View
            style={{
              transform: [{ translateX: trans }],
            }}
          >
            <Ionicons name="arrow-undo" size={24} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      )
    }

    const renderLeftActions = (progress, dragX) => {
      const trans = dragX.interpolate({
        inputRange: [-101, -100, -50, 0],
        outputRange: [-1, 0, 0, 0],
      })

      return (
        <TouchableOpacity
          onPress={handleReply}
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            width: 70,
            backgroundColor: '#3b82f6',
            marginVertical: 4,
            borderRadius: 12,
          }}
        >
          <Animated.View
            style={{
              transform: [{ translateX: trans }],
            }}
          >
            <Ionicons name="arrow-undo" size={24} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      )
    }

    const messageContent = (
      <View style={{ marginVertical: 4 }}>
        {showDate && <DateSeparator date={formatMessageDate(item.createdAt)} />}

        <View
          style={{
            flexDirection: isOwn ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            padding: 4,
            position: 'relative',
          }}
          onMouseEnter={() =>
            Platform.OS === 'web' && setHoveredMessageId(messageId)
          }
          onMouseLeave={() =>
            Platform.OS === 'web' && setHoveredMessageId(null)
          }
        >
          {/* Reply Button (Web) */}
          {Platform.OS === 'web' && (
            <View
              style={{
                marginLeft: isOwn ? 8 : 0,
                marginRight: isOwn ? 0 : 8,
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.2s',
              }}
            >
              <TouchableOpacity
                onPress={handleReply}
                style={{
                  backgroundColor: isHovered ? '#dbeafe' : '#f8f9fa',
                  padding: 8,
                  borderRadius: 16,
                  width: 32,
                  height: 32,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons
                  name="arrow-undo"
                  size={16}
                  color={isHovered ? '#3b82f6' : '#7f8c8d'}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Three Dots Button (Web) - Only for own messages */}
          {Platform.OS === 'web' && isOwn && (
            <View
              style={{
                marginLeft: isOwn ? 0 : 8,
                marginRight: isOwn ? 8 : 0,
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.2s',
              }}
            >
              <TouchableOpacity
                onPress={handleThreeDotsPress}
                style={{
                  backgroundColor: isHovered ? '#e9ecef' : '#f8f9fa',
                  padding: 8,
                  borderRadius: 16,
                  width: 32,
                  height: 32,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons
                  name="ellipsis-vertical"
                  size={16}
                  color={isHovered ? '#2c3e50' : '#7f8c8d'}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Message Content */}
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              onLongPress={handleMessageLongPress}
              delayLongPress={500}
              activeOpacity={0.9}
            >
              {showOptions && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderRadius: 18,
                    zIndex: 1,
                  }}
                />
              )}

              <MessageBubble
                message={item}
                isOwn={isOwn}
                displayName={displayName}
                navigation={navigation}
                onImagePress={onImagePress}
                currentUserId={currentUserId}
                users={users}
                onReplyPress={onReplyPress}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )

    // Wrap with swipeable for mobile
    if (Platform.OS !== 'web') {
      return (
        <Swipeable
          renderRightActions={isOwn ? renderRightActions : null}
          renderLeftActions={!isOwn ? renderLeftActions : null}
          overshootRight={false}
          overshootLeft={false}
        >
          {messageContent}
        </Swipeable>
      )
    }

    return messageContent
  }
)
