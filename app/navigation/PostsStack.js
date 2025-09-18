import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import PostsScreen from '../screens/PostsScreen'
import PostDetailScreen from '../screens/PostDetailScreen'

const Stack = createNativeStackNavigator()

export default function PostsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="PostsHome"
        component={PostsScreen}
        options={{ title: 'Posts' }}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: 'Post Detail' }}
      />
    </Stack.Navigator>
  )
}
