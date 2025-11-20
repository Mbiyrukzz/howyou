import React from 'react'
import ChatsProvider from './ChatsProvider'
import ContactsProvider from './ContactsProvider'
import { PostsProvider } from './PostsProvider'
import CommentsProvider from './CommentsProvider'

const AppProviders = ({ children }) => {
  return (
    <ChatsProvider>
      <CommentsProvider>
        <PostsProvider>{children}</PostsProvider>
      </CommentsProvider>
    </ChatsProvider>
  )
}

export default AppProviders
