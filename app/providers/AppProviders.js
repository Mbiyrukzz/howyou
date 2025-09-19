import React from 'react'
import ChatsProvider from './ChatsProvider'

const AppProviders = ({ children }) => {
  return <ChatsProvider>{children}</ChatsProvider>
}

export default AppProviders
