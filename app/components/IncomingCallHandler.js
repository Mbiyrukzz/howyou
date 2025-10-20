import React, { useContext, useEffect } from 'react'
import { useNavigation } from '@react-navigation/native'
import * as Notifications from 'expo-notifications'
import ChatsContext from '../contexts/ChatsContext'
import IncomingCallModal from './IncomingCallModal'
import { Alert, AppState } from 'react-native'

export default function IncomingCallHandler() {
  const navigation = useNavigation()
  const { incomingCall, answerCall, rejectCall } = useContext(ChatsContext)

  useEffect(() => {
    if (incomingCall) {
      console.log('🔔 IncomingCallHandler: New incoming call detected', {
        caller: incomingCall.caller,
        callerName: incomingCall.callerName,
        callType: incomingCall.callType,
        callId: incomingCall.callId,
      })

      // Show notification if app is in background
      if (AppState.currentState !== 'active') {
        showCallNotification(incomingCall)
      }
    } else {
      console.log('🔕 IncomingCallHandler: No incoming call')
    }
  }, [incomingCall])

  const showCallNotification = async (callData) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Incoming ${
          callData.callType === 'video' ? 'Video' : 'Voice'
        } Call`,
        body: `${callData.callerName || 'Someone'} is calling you`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 250, 250, 250],
        data: {
          type: 'incoming_call',
          callId: callData.callId,
          chatId: callData.chatId,
          caller: callData.caller,
          callerName: callData.callerName,
          callType: callData.callType,
        },
        categoryIdentifier: 'INCOMING_CALL',
      },
      trigger: null, // Show immediately
    })
  }

  const handleAcceptCall = async () => {
    if (!incomingCall) {
      console.error('❌ No incoming call to accept')
      return
    }

    console.log('✅ Accepting call:', incomingCall.callId)

    try {
      // Dismiss notification
      await Notifications.dismissAllNotificationsAsync()

      const result = await answerCall(incomingCall.callId, true)

      console.log('📞 Answer call result:', result)

      if (result.success) {
        navigation.navigate('Chats', {
          screen: 'CallScreen',
          params: {
            chatId: incomingCall.chatId,
            remoteUserId: incomingCall.caller,
            remoteUserName: incomingCall.callerName,
            callType: incomingCall.callType,
          },
        })
      } else {
        Alert.alert('Error', 'Failed to accept call')
        console.error('Failed to accept call:', result.error)
      }
    } catch (error) {
      console.error('❌ Error accepting call:', error)
      Alert.alert('Error', 'Failed to accept call')
    }
  }

  const handleRejectCall = async () => {
    if (!incomingCall) {
      console.error('❌ No incoming call to reject')
      return
    }

    console.log('❌ Rejecting call:', incomingCall.callId)

    try {
      // Dismiss notification
      await Notifications.dismissAllNotificationsAsync()

      await rejectCall(incomingCall.callId)
      console.log('✅ Call rejected successfully')
    } catch (error) {
      console.error('❌ Error rejecting call:', error)
    }
  }

  if (!incomingCall) {
    return null
  }

  return (
    <IncomingCallModal
      visible={true}
      callerName={incomingCall.callerName || 'Unknown'}
      callType={incomingCall.callType || 'voice'}
      onAccept={handleAcceptCall}
      onReject={handleRejectCall}
    />
  )
}
