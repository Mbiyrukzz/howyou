import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import ChatsScreen from '../screens/ChatsScreen'
import ChatDetailScreen from '../screens/ChatDetailScreen'
import NewChatScreen from '../screens/NewChatScreen'
import CallScreen from '../screens/CallScreen'

const Stack = createNativeStackNavigator()

export default function ChatsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ChatsHome"
        component={ChatsScreen}
        options={{ title: 'Chats' }}
      />
      <Stack.Screen
        name="ChatDetail"
        component={ChatDetailScreen}
        options={{ title: 'Chat Detail' }}
      />
      <Stack.Screen
        name="NewChats"
        component={NewChatScreen}
        options={{ title: 'New Chat' }}
      />

      <Stack.Screen
        name="CallScreen"
        component={CallScreen}
        options={{ title: 'CallScreen', headerShown: false }}
      />
    </Stack.Navigator>
  )
}
