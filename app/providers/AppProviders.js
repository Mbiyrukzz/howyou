import React from 'react'
import ChatsProvider from './ChatsProvider'
import ContactsProvider from './ContactsProvider'
import { PostsProvider } from './PostsProvider'
import CommentsProvider from './CommentsProvider'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

const AppProviders = ({ children }) => {
  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <ChatsProvider>
          <CommentsProvider>
            <PostsProvider>{children}</PostsProvider>
          </CommentsProvider>
        </ChatsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

export default AppProviders
