// components/IncomingCallHandler.js
import React, { useContext, useRef, useEffect } from 'react'
import { useNavigation } from '@react-navigation/native'
import ChatsContext from '../contexts/ChatsContext'
import IncomingCallModal from './IncomingCallModal'
import { Alert } from 'react-native'

export default function IncomingCallHandler() {
  const navigation = useNavigation()
  const { incomingCall, answerCall, rejectCall } = useContext(ChatsContext)

  // Log when incoming call state changes
  useEffect(() => {
    if (incomingCall) {
      console.log('🔔 IncomingCallHandler: New incoming call detected', {
        caller: incomingCall.caller,
        callerName: incomingCall.callerName,
        callType: incomingCall.callType,
        callId: incomingCall.callId,
      })
    } else {
      console.log('🔕 IncomingCallHandler: No incoming call')
    }
  }, [incomingCall])

  const handleAcceptCall = async () => {
    if (!incomingCall) {
      console.error('❌ No incoming call to accept')
      return
    }

    console.log('✅ Accepting call:', incomingCall.callId)

    try {
      const result = await answerCall(incomingCall.callId, true)

      console.log('📞 Answer call result:', result)

      if (result.success) {
        // Navigate to call screen
        // Use navigate with nested navigation
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
      await rejectCall(incomingCall.callId)
      console.log('✅ Call rejected successfully')
    } catch (error) {
      console.error('❌ Error rejecting call:', error)
    }
  }

  // Don't render anything if there's no incoming call
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
