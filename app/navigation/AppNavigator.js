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
import LoadingIndicator from '../components/LoadingIndicator'

const Stack = createNativeStackNavigator()

const API_URL = process.env.EXPO_PUBLIC_API_URL

export default function AppNavigator() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userCreated, setUserCreated] = useState(false)
  const navigationRef = useRef()

  useNotifications(navigationRef)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      // If user is authenticated, verify/create user in backend
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken()

          const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: currentUser.displayName || 'User',
              email: currentUser.email,
            }),
          })

          const data = await response.json()

          if (data.success) {
            console.log('✅ User verified/created in backend')
            setUserCreated(true)
          } else {
            console.error('❌ Failed to create/verify user:', data.error)
          }
        } catch (error) {
          console.error('❌ Error verifying user in backend:', error)
        }
      } else {
        setUserCreated(false)
      }

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
    return (
      <LoadingIndicator
        text="Loading..."
        subtext="Kindly wait, Loading Chats..."
        showCard={false}
      />
    )
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {user && userCreated ? (
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
