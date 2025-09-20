import React from 'react'
import ChatsProvider from './ChatsProvider'
import ContactsProvider from './ContactsProvider'

const AppProviders = ({ children }) => {
  return (
    <ChatsProvider>
      <ContactsProvider>{children}</ContactsProvider>
    </ChatsProvider>
  )
}

export default AppProviders
