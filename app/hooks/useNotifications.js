import { useState, useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { useUser } from './useUser'

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
})

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState('')
  const [notification, setNotification] = useState(null)
  const notificationListener = useRef()
  const { user } = useUser()

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token)
        if (user?.uid) {
          savePushTokenToBackend(token, user.uid)
        }
      }
    })

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('📩 Notification received:', notification)
        setNotification(notification)
      })

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove() // Use remove() instead
      }
    }
  }, [user?.uid])

  return {
    expoPushToken,
    notification,
  }
}

async function registerForPushNotificationsAsync() {
  let token

  if (Platform.OS === 'web') {
    console.log('Push notifications are not supported on web')
    return
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('calls', {
      name: 'Calls',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    })
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!')
      return
    }

    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.projectId,
      })
    ).data
    console.log('📱 Push token:', token)
  } else {
    console.log('Must use physical device for Push Notifications')
  }

  return token
}

async function savePushTokenToBackend(token, userId) {
  try {
    const API_URL = 'http://10.230.214.87:5000'
    const response = await fetch(`${API_URL}/save-push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        pushToken: token,
        platform: Platform.OS,
      }),
    })

    const data = await response.json()
    console.log('✅ Push token saved:', data)
  } catch (error) {
    console.error('❌ Failed to save push token:', error)
  }
}
