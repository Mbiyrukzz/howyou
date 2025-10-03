import React, { useContext, useMemo } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import ChatsContext from '../contexts/ChatsContext' // Adjust path to your ChatsContext
import ChatsStack from './ChatsStack'
import PostsStack from './PostsStack'
import RoomsStack from './RoomsStack'
import SettingsStack from './SettingsStack'
import { Ionicons } from '@expo/vector-icons'

const Tab = createBottomTabNavigator()

// Icon mapping object for better maintainability
const getIconName = (routeName) => {
  const iconMap = {
    Chats: 'chatbubble',
    Posts: 'albums',
    Rooms: 'people',
    Settings: 'settings',
  }
  return iconMap[routeName] || 'help-circle' // Fallback icon
}

export default function BottomTabs() {
  const { chats, loading, getUnreadMessageCount } = useContext(ChatsContext)

  // Compute total unread across all chats (memoized for performance)
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

  // Badge value for Chats tab (number or undefined to hide)
  const chatsBadge = totalUnread > 0 ? totalUnread : undefined

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#007AFF', // Blue for active (iOS-like)
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5, // Extra padding for iOS home indicator
          height: 60,
        },
        tabBarIcon: ({ color, size }) => {
          const iconName = getIconName(route.name)
          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarLabel: ({ focused, color }) => {
          // Custom labels (optional: could use route.name by default)
          const labelMap = {
            Chats: 'Messages',
            Posts: 'Posts',
            Rooms: 'Rooms',
            Settings: 'Settings',
          }
          // Uncomment for labels: return labelMap[route.name] || route.name;
          // For now, it defaults to route.name (e.g., "Chats")
          return null // Hide labels if you prefer icon-only
        },
        // Optional: Global badge style (applies to all badges if present)
        tabBarBadgeStyle: {
          backgroundColor: '#FF3B30', // Red badge (customize as needed)
          color: 'white',
          fontSize: 12,
          minWidth: 20,
          height: 20,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
        },
      })}
    >
      <Tab.Screen
        name="Chats"
        component={ChatsStack}
        options={{
          tabBarBadge: chatsBadge, // Dynamic badge only for Chats
        }}
      />
      <Tab.Screen name="Posts" component={PostsStack} />
      <Tab.Screen name="Rooms" component={RoomsStack} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  )
}
