import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { onAuthStateChanged } from 'firebase/auth'

import BottomTabs from './BottomTabs'

import SignupScreen from '../screens/SignupScreen'
import LoginScreen from '../screens/LoginScreen'
import { auth } from '../firebase/setUpFirebase'

const Stack = createNativeStackNavigator()

export default function AppNavigator() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return null
  }

  return (
    <NavigationContainer>
      {user ? (
        // ✅ Logged in → show tabs
        <BottomTabs />
      ) : (
        // 🔑 Not logged in → show auth screens
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  )
}
