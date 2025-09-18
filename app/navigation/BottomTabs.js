import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import ChatsStack from './ChatsStack'
import PostsStack from './PostsStack'
import RoomsStack from './RoomsStack'
import SettingsStack from './SettingsStack'
import { Ionicons } from '@expo/vector-icons'

const Tab = createBottomTabNavigator()

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName
          if (route.name === 'Chats') iconName = 'chatbubble'
          else if (route.name === 'Posts') iconName = 'albums'
          else if (route.name === 'Rooms') iconName = 'people'
          else if (route.name === 'Settings') iconName = 'settings'
          return <Ionicons name={iconName} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Chats" component={ChatsStack} />
      <Tab.Screen name="Posts" component={PostsStack} />
      <Tab.Screen name="Rooms" component={RoomsStack} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  )
}
