import React, { useEffect, useState, useRef } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { onAuthStateChanged } from 'firebase/auth'
import * as Notifications from 'expo-notifications'

import BottomTabs from './BottomTabs'
import SignupScreen from '../screens/SignupScreen'
import LoginScreen from '../screens/LoginScreen'
import { auth } from '../firebase/setUpFirebase'

import IncomingCallHandler from '../components/IncomingCallHandler'
import { useNotifications } from '../hooks/useNotifications'

const Stack = createNativeStackNavigator()

export default function AppNavigator() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigationRef = useRef()
  const { notification } = useNotifications()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  // Handle notification tap when app is in background/closed
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data

        if (data.type === 'incoming_call' && navigationRef.current) {
          // Navigate to call screen
          navigationRef.current.navigate('Chats', {
            screen: 'CallScreen',
            params: {
              chatId: data.chatId,
              remoteUserId: data.caller,
              remoteUserName: data.callerName,
              callType: data.callType,
            },
          })
        }
      }
    )

    return () => subscription.remove()
  }, [])

  if (loading) {
    return null
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {user ? (
        <>
          <BottomTabs />
          <IncomingCallHandler />
        </>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  )
}
