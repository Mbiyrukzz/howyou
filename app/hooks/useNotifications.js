import { useState, useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { useUser } from './useUser'

// Configure notification behavior for incoming calls
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
})

const API_URL = process.env.EXPO_PUBLIC_API_URL

// Define notification categories with actions
export const CALL_CATEGORY = 'INCOMING_CALL'

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState('')
  const [notification, setNotification] = useState(null)
  const notificationListener = useRef()
  const responseListener = useRef()
  const { user } = useUser()

  useEffect(() => {
    // Set up notification categories with actions
    setupNotificationCategories()

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token)
        if (user?.uid) {
          savePushTokenToBackend(token, user.uid)
        }
      }
    })

    // Listener for when notification is received (app in foreground/background)
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('📩 Notification received:', notification)
        setNotification(notification)
      })

    // Listener for when user interacts with notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('👆 Notification tapped:', response)
        handleNotificationResponse(response)
      })

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove()
      }
      if (responseListener.current) {
        responseListener.current.remove()
      }
    }
  }, [user?.uid])

  return {
    expoPushToken,
    notification,
    showIncomingCallNotification,
    dismissCallNotification,
  }
}

async function setupNotificationCategories() {
  if (Platform.OS === 'web') {
    console.log('⛔ Notification categories not supported on web')
    return
  }

  await Notifications.setNotificationCategoryAsync(CALL_CATEGORY, [
    {
      identifier: 'ACCEPT_CALL',
      buttonTitle: '✓ Accept',
      options: { opensAppToForeground: true },
    },
    {
      identifier: 'DECLINE_CALL',
      buttonTitle: '✕ Decline',
      options: { opensAppToForeground: false },
    },
  ])
}

// Show incoming call notification
export async function showIncomingCallNotification(callerName, callId) {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '📞 Incoming Call',
      body: `${callerName} is calling...`,
      categoryIdentifier: CALL_CATEGORY,
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: {
        callId,
        callerName,
        type: 'incoming_call',
      },
      // Android-specific
      vibrate: [0, 250, 250, 250],
      // iOS-specific
      interruptionLevel: 'timeSensitive',
    },
    trigger: null, // Show immediately
  })

  return notificationId
}

// Dismiss call notification
export async function dismissCallNotification(notificationId) {
  await Notifications.dismissNotificationAsync(notificationId)
}

// Handle notification action responses
async function handleNotificationResponse(response) {
  const { actionIdentifier, notification } = response
  const { callId, callerName, chatId, caller, callType } =
    notification.request.content.data

  if (actionIdentifier === 'ACCEPT_CALL') {
    console.log('✅ User accepted call from:', callerName)
    await handleCallAccepted(callId, chatId, caller, callerName, callType)
  } else if (actionIdentifier === 'DECLINE_CALL') {
    console.log('❌ User declined call from:', callerName)
    await handleCallDeclined(callId)
  } else if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
    console.log('📱 User tapped notification')
    // Will be handled by navigation listener
  }
}

// Handle call accepted
async function handleCallAccepted(callId) {
  try {
    const response = await fetch(`${API_URL}/call/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ callId }),
    })
    const data = await response.json()
    console.log('Call accepted:', data)
  } catch (error) {
    console.error('Failed to accept call:', error)
  }
}

// Handle call declined
async function handleCallDeclined(callId) {
  try {
    const response = await fetch(`${API_URL}/call/decline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ callId }),
    })
    const data = await response.json()
    console.log('Call declined:', data)
  } catch (error) {
    console.error('Failed to decline call:', error)
  }
}

async function registerForPushNotificationsAsync() {
  let token

  if (Platform.OS === 'web') {
    console.log('Push notifications are not supported on web')
    return
  }

  if (Platform.OS === 'android') {
    // Create high-priority notification channel for calls
    await Notifications.setNotificationChannelAsync('calls', {
      name: 'Incoming Calls',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
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
