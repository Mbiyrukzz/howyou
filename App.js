// App.js
import React, { useEffect, useState } from 'react'
import { Platform, Text, View } from 'react-native'
import AppNavigator from './app/navigation/AppNavigator'
import AppProviders from './app/providers/AppProviders'
import LoadingIndicator from './app/components/LoadingIndicator'

// Register LiveKit globals for React Native (iOS/Android only)
let livekitReady = false
if (Platform.OS !== 'web') {
  try {
    const LiveKit = require('@livekit/react-native')
    console.log('📦 LiveKit module loaded:', Object.keys(LiveKit))

    if (LiveKit.registerGlobals) {
      LiveKit.registerGlobals()
      livekitReady = true
      console.log('✅ LiveKit globals registered successfully')
    } else {
      console.error('❌ registerGlobals not found in LiveKit module')
    }
  } catch (error) {
    console.error('❌ Failed to load/register LiveKit:', error)
    console.error('Error details:', error.message)
  }
}

export default function App() {
  const [isReady, setIsReady] = useState(Platform.OS === 'web' || livekitReady)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'web') {
      console.log('🚀 App initialized on', Platform.OS)
      console.log('📱 LiveKit ready:', livekitReady)

      // Give it a moment to initialize
      setTimeout(() => {
        setIsReady(true)
      }, 500)
    }
  }, [])

  if (!isReady && Platform.OS !== 'web') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Initializing LiveKit...</Text>
      </View>
    )
  }

  if (loading) {
    return <LoadingIndicator text="Loading..." subtext="Please wait..." />
  }

  return (
    <AppProviders>
      <AppNavigator />
    </AppProviders>
  )
}
