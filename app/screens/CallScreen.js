// CallScreen.js - Fixed infinite re-render issue
import React, { useCallback, useEffect, useState, useRef } from 'react'
import { View, Alert, BackHandler, Text, ActivityIndicator } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import styled from 'styled-components/native'
import { useUser } from '../hooks/useUser'
import { useRingtones } from '../hooks/useRingtones'
import { useRingTimer } from '../hooks/useRingTimer'
import { useCallTimer } from '../hooks/useCallTimer'
import { useLiveKit } from '../hooks/useLiveKit'
import { CallScreenHeader } from '../components/calls/CallScreenHeader'
import { CallControls } from '../components/calls/CallControls'
import { IncomingCallScreen } from '../components/calls/IncomingCallScreen'
import { LiveKitVideoView } from '../components/calls/LiveKitVideoView'

const Container = styled.View`
  flex: 1;
  background-color: #0f172a;
`

const VideoContainer = styled.View`
  flex: 1;
`

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: #0f172a;
`

const LoadingText = styled.Text`
  color: white;
  font-size: 18px;
  margin-top: 16px;
`

const API_URL = process.env.EXPO_PUBLIC_API_URL

const CallScreen = () => {
  const route = useRoute()
  const navigation = useNavigation()
  const { user, isLoading: authLoading } = useUser()

  const {
    chatId,
    remoteUserId,
    remoteUserName,
    callType = 'video',
    isIncoming = false,
    callId: initialCallId,
    livekitUrl: initialLivekitUrl,
    token: initialToken,
  } = route.params || {}

  console.log('📞 CallScreen mounted:', {
    chatId,
    remoteUserId,
    callType,
    isIncoming,
    hasInitialToken: !!initialToken,
    hasInitialUrl: !!initialLivekitUrl,
    hasInitialCallId: !!initialCallId,
    callAnswered: !isIncoming || !!(initialToken && initialLivekitUrl),
  })

  // ✅ Use ref to prevent multiple initiations
  const hasInitiatedCall = useRef(false)
  const hasInitialCredentials = !!(initialToken && initialLivekitUrl)

  const [callStatus, setCallStatus] = useState(
    isIncoming && !hasInitialCredentials ? 'ringing' : 'connecting'
  )
  const [callAnswered, setCallAnswered] = useState(
    !isIncoming || hasInitialCredentials
  )
  const [livekitUrl, setLivekitUrl] = useState(initialLivekitUrl)
  const [token, setToken] = useState(initialToken)
  const [callId, setCallId] = useState(initialCallId)
  const [isConnected, setIsConnected] = useState(false)

  const getIdTokenSafely = async () => {
    if (authLoading || !user) {
      console.warn('⚠️ Cannot get token: auth loading or no user')
      return null
    }
    try {
      return await user.getIdToken()
    } catch (err) {
      console.error('❌ Failed to get ID token:', err)
      return null
    }
  }

  // ✅ Memoize the initiate function with useCallback
  const initiateOutgoingCall = useCallback(async () => {
    // ✅ Prevent multiple calls
    if (hasInitiatedCall.current) {
      console.log('⏭️ Call already initiated, skipping')
      return
    }

    hasInitiatedCall.current = true

    const idToken = await getIdTokenSafely()
    if (!idToken) {
      Alert.alert('Error', 'Authentication required')
      navigation.goBack()
      return
    }

    try {
      console.log('📞 Initiating outgoing call...')
      const response = await fetch(`${API_URL}/initiate-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          chatId,
          callType,
          recipientId: remoteUserId,
        }),
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error || 'Failed')

      console.log('✅ Call initiated successfully')
      setCallId(data.call._id.toString())
      setToken(data.callerToken)
      setLivekitUrl(data.livekitUrl)
      setCallAnswered(true)
    } catch (error) {
      console.error('❌ Error initiating call:', error)
      Alert.alert('Error', 'Failed to start call')
      hasInitiatedCall.current = false // Reset on error
      navigation.goBack()
    }
  }, [chatId, callType, remoteUserId, navigation, authLoading, user])

  // ✅ Fixed: Only run once when conditions are met
  useEffect(() => {
    if (authLoading) return

    const needsToInitiate =
      !isIncoming &&
      !token &&
      !hasInitiatedCall.current &&
      chatId &&
      remoteUserId &&
      user

    if (needsToInitiate) {
      initiateOutgoingCall()
    }
  }, [
    authLoading,
    user,
    isIncoming,
    token,
    chatId,
    remoteUserId,
    initiateOutgoingCall,
  ])

  // Ringtones and timers
  const { stopRingtones } = useRingtones(isIncoming, callAnswered)
  const { callDuration } = useCallTimer(isConnected)

  const handleTimeout = useCallback(() => {
    console.log('⏰ Call timeout')
    stopRingtones()
    handleEndCall()
    Alert.alert('Call Ended', 'No answer', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ])
  }, [stopRingtones, navigation])

  const { clearRingTimer } = useRingTimer(handleTimeout, !callAnswered)

  // LiveKit hook
  const {
    isConnected: livekitConnected,
    localVideoTrack,
    localAudioTrack,
    remoteVideoTrack,
    remoteAudioTrack,
    remoteParticipants,
    isMuted,
    isVideoEnabled,
    toggleMute,
    toggleVideo,
    switchCamera,
    disconnect: disconnectLiveKit,
  } = useLiveKit(
    callAnswered ? livekitUrl : null,
    callAnswered ? token : null,
    callType,
    {
      onParticipantConnected: useCallback(
        (participant) => {
          console.log('👤 Remote participant joined:', participant.identity)
          stopRingtones()
          clearRingTimer()
          setCallStatus('connected')
          setIsConnected(true)
        },
        [stopRingtones, clearRingTimer]
      ),

      onParticipantDisconnected: useCallback((participant) => {
        console.log('👋 Remote participant left:', participant.identity)
        handleCallEnded('User left the call')
      }, []),

      onCallEnded: useCallback((reason) => {
        console.log('🔴 Call ended:', reason)
        handleCallEnded(reason || 'Call ended')
      }, []),

      onError: useCallback((error) => {
        console.error('❌ LiveKit error:', error)
        Alert.alert('Connection Error', error.message, [
          { text: 'OK', onPress: handleEndCall },
        ])
      }, []),
    }
  )

  // Add this right after your useLiveKit hook
  useEffect(() => {
    console.log('🔍 COMPREHENSIVE TRACK DEBUG:', {
      // Local tracks
      hasLocalVideo: !!localVideoTrack,
      hasLocalAudio: !!localAudioTrack,
      localVideoDetails: localVideoTrack
        ? {
            kind: localVideoTrack.kind,
            sid: localVideoTrack.sid,
            enabled: localVideoTrack.enabled,
            muted: localVideoTrack.muted,
            mediaStreamTrack: localVideoTrack.mediaStreamTrack
              ? {
                  readyState: localVideoTrack.mediaStreamTrack.readyState,
                  enabled: localVideoTrack.mediaStreamTrack.enabled,
                  muted: localVideoTrack.mediaStreamTrack.muted,
                }
              : null,
          }
        : null,

      // Remote tracks
      hasRemoteVideo: !!remoteVideoTrack,
      hasRemoteAudio: !!remoteAudioTrack,
      remoteVideoDetails: remoteVideoTrack
        ? {
            kind: remoteVideoTrack.kind,
            sid: remoteVideoTrack.sid,
            enabled: remoteVideoTrack.enabled,
            muted: remoteVideoTrack.muted,
            mediaStreamTrack: remoteVideoTrack.mediaStreamTrack
              ? {
                  readyState: remoteVideoTrack.mediaStreamTrack.readyState,
                  enabled: remoteVideoTrack.mediaStreamTrack.enabled,
                  muted: remoteVideoTrack.mediaStreamTrack.muted,
                }
              : null,
          }
        : null,

      // Connection state
      isConnected,
      callStatus,
      remoteParticipantsCount: remoteParticipants?.length || 0,
    })
  }, [
    localVideoTrack,
    localAudioTrack,
    remoteVideoTrack,
    remoteAudioTrack,
    isConnected,
    callStatus,
    remoteParticipants,
  ])

  // Update connection status from LiveKit
  useEffect(() => {
    if (livekitConnected && callStatus === 'connecting') {
      console.log('✅ LiveKit connected, waiting for remote participant...')
    }
  }, [livekitConnected, callStatus])

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleEndCall()
        return true
      }
    )

    return () => backHandler.remove()
  }, [])

  // Answer incoming call
  const handleAnswerCall = async () => {
    console.log('📞 Answering incoming call...')
    stopRingtones()
    clearRingTimer()
    setCallStatus('connecting')

    try {
      const idToken = await getIdTokenSafely()
      if (!idToken) {
        Alert.alert('Error', 'Authentication required')
        navigation.goBack()
        return
      }

      const response = await fetch(`${API_URL}/answer-call/${initialCallId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ accepted: true }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error('Failed to answer call')
      }

      console.log('✅ Call answered, received LiveKit credentials')

      setToken(data.recipientToken)
      setLivekitUrl(data.livekitUrl)
      setCallId(initialCallId)
      setCallAnswered(true)
    } catch (error) {
      console.error('❌ Error answering call:', error)
      Alert.alert('Error', 'Failed to answer call: ' + error.message)
      navigation.goBack()
    }
  }

  // Reject incoming call
  const handleRejectCall = async () => {
    stopRingtones()
    clearRingTimer()

    try {
      const idToken = await getIdTokenSafely()
      if (idToken) {
        await fetch(`${API_URL}/answer-call/${initialCallId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ accepted: false }),
        })
      }
    } catch (error) {
      console.error('❌ Error rejecting call:', error)
    }

    navigation.goBack()
  }

  const handleEndCall = useCallback(async () => {
    stopRingtones()
    clearRingTimer()

    console.log('🔴 Ending call...')

    if (disconnectLiveKit) {
      await disconnectLiveKit()
    }

    if (callId) {
      const idToken = await getIdTokenSafely()
      if (idToken) {
        try {
          await fetch(`${API_URL}/end-call/${callId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
          })
        } catch (error) {
          console.error('❌ Error notifying backend of call end:', error)
        }
      }
    }

    navigation.goBack()
  }, [stopRingtones, clearRingTimer, disconnectLiveKit, callId, navigation])

  // Handle call ended notification
  const handleCallEnded = useCallback(
    (reason) => {
      stopRingtones()
      clearRingTimer()

      if (disconnectLiveKit) {
        disconnectLiveKit()
      }

      Alert.alert('Call Ended', reason || 'The call has ended', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ])
    },
    [stopRingtones, clearRingTimer, disconnectLiveKit, navigation]
  )

  // Toggle microphone
  const handleToggleMute = async () => {
    await toggleMute()
  }

  // Toggle video
  const handleToggleVideo = async () => {
    await toggleVideo()
  }

  // Switch camera
  const handleSwitchCamera = async () => {
    await switchCamera()
  }

  if (authLoading) {
    return (
      <LoadingContainer>
        <ActivityIndicator size="large" color="#3b82f6" />
        <LoadingText>Loading user...</LoadingText>
      </LoadingContainer>
    )
  }

  // Incoming call screen
  if (isIncoming && !callAnswered && !hasInitialCredentials) {
    return (
      <Container>
        <IncomingCallScreen
          remoteUserName={remoteUserName}
          callType={callType}
          onAccept={handleAnswerCall}
          onReject={handleRejectCall}
        />
      </Container>
    )
  }

  // Show loading state while fetching credentials
  if (!token || !livekitUrl) {
    return (
      <LoadingContainer>
        <ActivityIndicator size="large" color="#3b82f6" />
        <LoadingText>Connecting to call...</LoadingText>
      </LoadingContainer>
    )
  }

  // Active call screen
  return (
    <Container>
      <CallScreenHeader
        remoteUserName={remoteUserName}
        callStatus={callStatus}
        callDuration={callDuration}
        isConnected={isConnected}
        showCameraSwitch={callType === 'video'}
        onBack={handleEndCall}
        onSwitchCamera={handleSwitchCamera}
      />

      <VideoContainer>
        <LiveKitVideoView
          localVideoTrack={localVideoTrack}
          remoteVideoTrack={remoteVideoTrack}
          callType={callType}
          isVideoEnabled={isVideoEnabled}
          remoteUserName={remoteUserName}
          callStatus={callStatus}
          isConnected={isConnected}
        />
      </VideoContainer>

      <CallControls
        isMuted={isMuted}
        isVideoEnabled={isVideoEnabled}
        callType={callType}
        onToggleMute={handleToggleMute}
        onToggleVideo={handleToggleVideo}
        onEndCall={handleEndCall}
        onToggleSpeaker={() => {}}
      />
    </Container>
  )
}

export default CallScreen
