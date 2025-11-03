import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import PostsScreen from '../screens/PostsScreen'
import PostDetailScreen from '../screens/PostDetailScreen'
import StatusViewerScreen from '../screens/StatusViewerScreen'
import CreatePostScreen from '../screens/CreatePostsScreen'

const Stack = createNativeStackNavigator()

export default function PostsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="PostsHome"
        component={PostsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="StatusViewer"
        component={StatusViewerScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: 'Post Detail' }}
      />
    </Stack.Navigator>
  )
}
