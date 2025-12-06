import React from 'react'
import ChatsProvider from './ChatsProvider'
import { PostsProvider } from './PostsProvider'
import CommentsProvider from './CommentsProvider'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { UserProfileProvider } from './UserProfileProvider'
import ContactsProvider from './ContactsProvider'

const AppProviders = ({ children }) => {
  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <ContactsProvider>
          <ChatsProvider>
            <CommentsProvider>
              <PostsProvider>
                <UserProfileProvider>{children}</UserProfileProvider>
              </PostsProvider>
            </CommentsProvider>
          </ChatsProvider>
        </ContactsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

export default AppProviders
