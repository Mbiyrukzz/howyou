import React, { useState } from 'react'
import { View, TouchableOpacity, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { DateSeparator } from './DateSeparator'
import { MessageBubble } from './MessageBubble'
import { formatMessageDate, findUserByAnyId } from '../../utils/chatHelpers'

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
      if (isOwn && Platform.OS !== 'web') {
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

    return (
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
          {/* Three Dots Button */}
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
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }
)
