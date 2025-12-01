import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import ChatsScreen from '../screens/ChatsScreen'
import ChatDetailScreen from '../screens/ChatDetailScreen'
import NewChatScreen from '../screens/NewChatScreen'
import CallScreen from '../screens/CallScreen'
import ViewProfileScreen from '../screens/ViewProfileScreen'
import VideoPlayerScreen from '../screens/VideoPlayerScreen'

const Stack = createNativeStackNavigator()

export default function ChatsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ChatsHome"
        component={ChatsScreen}
        options={{ title: 'Chats', headerShown: false }}
      />
      <Stack.Screen
        name="ChatDetail"
        component={ChatDetailScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ViewProfile"
        component={ViewProfileScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="NewChats"
        component={NewChatScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="CallScreen"
        component={CallScreen}
        options={{ title: 'CallScreen', headerShown: false }}
      />

      <Stack.Screen
        name="VideoPlayer"
        component={VideoPlayerScreen}
        options={{ title: 'VideoPlayer', headerShown: false }}
      />
    </Stack.Navigator>
  )
}
