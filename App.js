// App.js
import React from 'react'
import AppNavigator from './app/navigation/AppNavigator'
import AppProviders from './app/providers/AppProviders'

export default function App() {
  return (
    <AppProviders>
      <AppNavigator />
    </AppProviders>
  )
}
