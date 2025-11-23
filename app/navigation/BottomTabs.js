import React, { useContext, useMemo } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Platform } from 'react-native'
import ChatsContext from '../contexts/ChatsContext'
import ChatsStack from './ChatsStack'
import PostsStack from './PostsStack'
import RoomsStack from './RoomsStack'
import SettingsStack from './SettingsStack'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context' // ✅ Add this import

const Tab = createBottomTabNavigator()

// Icon mapping with focused/unfocused variants
const getIconName = (routeName, focused) => {
  const iconMap = {
    Chats: focused ? 'chatbubble' : 'chatbubble-outline',
    Posts: focused ? 'albums' : 'albums-outline',
    Rooms: focused ? 'people' : 'people-outline',
    Settings: focused ? 'settings' : 'settings-outline',
  }
  return iconMap[routeName] || 'help-circle-outline'
}

// Label mapping
const getLabel = (routeName) => {
  const labelMap = {
    Chats: 'Home',
    Posts: 'Stories',
    Rooms: 'Friends',
    Settings: 'More',
  }
  return labelMap[routeName] || routeName
}

export default function BottomTabs() {
  const { chats, loading, getUnreadMessageCount } = useContext(ChatsContext)
  const insets = useSafeAreaInsets() // ✅ Get safe area insets

  // Compute total unread across all chats
  const totalUnread = useMemo(() => {
    if (loading || !chats || chats.length === 0) return 0
    return chats.reduce((sum, chat) => {
      const chatId = chat._id || chat.id
      if (chatId) {
        return sum + getUnreadMessageCount(chatId)
      }
      return sum
    }, 0)
  }, [chats, loading, getUnreadMessageCount])

  const chatsBadge = totalUnread > 0 ? totalUnread : undefined

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1e293b',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          paddingTop: 8,
          // ✅ Fix Android navigation bar overlap
          paddingBottom:
            Platform.OS === 'android'
              ? insets.bottom + 8
              : Platform.OS === 'ios'
              ? 20
              : 8,
          height:
            Platform.OS === 'android'
              ? 65 + insets.bottom
              : Platform.OS === 'ios'
              ? 85
              : 65,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const iconName = getIconName(route.name, focused)
          return (
            <Ionicons name={iconName} size={focused ? 26 : 24} color={color} />
          )
        },
        tabBarLabel: getLabel(route.name),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarBadgeStyle: {
          backgroundColor: '#ef4444',
          color: '#ffffff',
          fontSize: 11,
          fontWeight: '700',
          minWidth: 18,
          height: 18,
          borderRadius: 9,
          borderWidth: 2,
          borderColor: '#ffffff',
          marginTop: -2,
        },
      })}
    >
      <Tab.Screen
        name="Chats"
        component={ChatsStack}
        options={{
          tabBarBadge: chatsBadge,
        }}
      />
      <Tab.Screen name="Posts" component={PostsStack} />
      <Tab.Screen name="Rooms" component={RoomsStack} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  )
}
