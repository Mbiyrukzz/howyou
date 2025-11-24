import React from 'react'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export const MessageStatusIndicator = React.memo(({ status, isOwn }) => {
  if (!isOwn) return null

  const getStatusIcon = () => {
    switch (status) {
      case 'read':
        return (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginLeft: 4,
            }}
          >
            <Ionicons name="eye" size={12} color="#f1fff7ff" />
            <Ionicons
              name="checkmark-done"
              size={12}
              color="rgba(243, 250, 143, 1)"
              style={{ marginLeft: 2 }}
            />
          </View>
        )
      case 'delivered':
        return (
          <View style={{ marginLeft: 4 }}>
            <Ionicons
              name="checkmark-done"
              size={12}
              color="rgba(255,255,255,0.8)"
            />
          </View>
        )
      case 'sent':
      default:
        return (
          <View style={{ marginLeft: 4 }}>
            <Ionicons
              name="checkmark"
              size={12}
              color="rgba(255,255,255,0.8)"
            />
          </View>
        )
    }
  }

  return getStatusIcon()
})
