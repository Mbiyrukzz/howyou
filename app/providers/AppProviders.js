import React from 'react'
import ChatsProvider from './ChatsProvider'
import ContactsProvider from './ContactsProvider'
import { PostsProvider } from './PostsProvider'

const AppProviders = ({ children }) => {
  return (
    <ChatsProvider>
      <PostsProvider>
        <ContactsProvider>{children}</ContactsProvider>
      </PostsProvider>
    </ChatsProvider>
  )
}

export default AppProviders
