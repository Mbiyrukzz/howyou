import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import ChatsScreen from '../screens/ChatsScreen'
import ChatDetailScreen from '../screens/ChatDetailScreen'
import NewChatScreen from '../screens/NewChatScreen'
import CallScreen from '../screens/CallScreen'
import ViewProfileScreen from '../screens/ViewProfileScreen'
import VideoPlayerScreen from '../screens/VideoPlayerScreen'
import AddContactsScreen from '../screens/AddContactsScreen'

const Stack = createNativeStackNavigator()

export default function ChatsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="ChatsHome"
        component={ChatsScreen}
        options={{ title: 'Chats' }}
      />

      <Stack.Screen
        name="ChatDetail"
        component={ChatDetailScreen}
        options={{ title: 'ChatDetails' }}
      />

      <Stack.Screen
        name="ViewProfile"
        component={ViewProfileScreen}
        options={{ title: 'ViewProfile' }}
      />

      <Stack.Screen
        name="NewChats"
        component={NewChatScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />

      <Stack.Screen
        name="Contacts"
        component={AddContactsScreen}
        options={{
          title: 'Add Contacts',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />

      <Stack.Screen
        name="CallScreen"
        component={CallScreen}
        options={{
          title: 'Call',
          presentation: 'fullScreenModal',
        }}
      />

      <Stack.Screen
        name="VideoPlayer"
        component={VideoPlayerScreen}
        options={{
          title: 'Video Player',
          presentation: 'fullScreenModal',
        }}
      />
    </Stack.Navigator>
  )
}
