// CallScreen.js - Updated for LiveKit
import React, { useEffect, useState } from 'react'
import { View, Alert, BackHandler } from 'react-native'
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

const API_URL = process.env.EXPO_PUBLIC_API_URL

const CallScreen = () => {
  const route = useRoute()
  const navigation = useNavigation()
  const { user } = useUser()

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

  // State
  const [callStatus, setCallStatus] = useState(
    isIncoming ? 'ringing' : 'connecting'
  )
  const [callAnswered, setCallAnswered] = useState(!isIncoming)
  const [livekitUrl, setLivekitUrl] = useState(initialLivekitUrl)
  const [token, setToken] = useState(initialToken)
  const [callId, setCallId] = useState(initialCallId)
  const [isConnected, setIsConnected] = useState(false)

  // Ringtones and timers
  const { stopRingtones } = useRingtones(isIncoming, callAnswered)
  const { callDuration } = useCallTimer(isConnected)

  const handleTimeout = () => {
    stopRingtones()
    handleEndCall()
    Alert.alert('Call Ended', 'No answer', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ])
  }

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
      onParticipantConnected: (participant) => {
        console.log('👤 Remote participant joined:', participant.identity)
        stopRingtones()
        clearRingTimer()
        setCallStatus('connected')
        setIsConnected(true)
      },
      onParticipantDisconnected: (participant) => {
        console.log('👋 Remote participant left:', participant.identity)
        handleCallEnded('User left the call')
      },
      onCallEnded: (reason) => {
        console.log('🔴 Call ended:', reason)
        handleCallEnded(reason || 'Call ended')
      },
      onError: (error) => {
        console.error('❌ LiveKit error:', error)
        Alert.alert('Connection Error', error.message, [
          { text: 'OK', onPress: handleEndCall },
        ])
      },
    }
  )

  // Update connection status from LiveKit
  useEffect(() => {
    if (livekitConnected && callStatus === 'connecting') {
      setCallStatus('connected')
      setIsConnected(true)
    }
  }, [livekitConnected])

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
      const response = await fetch(`${API_URL}/answer-call/${initialCallId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await user.getIdToken()}`,
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
      await fetch(`${API_URL}/answer-call/${initialCallId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({ accepted: false }),
      })
    } catch (error) {
      console.error('❌ Error rejecting call:', error)
    }

    navigation.goBack()
  }

  // End call
  const handleEndCall = async () => {
    stopRingtones()
    clearRingTimer()

    console.log('🔴 Ending call...')

    // Disconnect from LiveKit
    if (disconnectLiveKit) {
      await disconnectLiveKit()
    }

    // Notify backend
    if (callId) {
      try {
        await fetch(`${API_URL}/end-call/${callId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
        })
      } catch (error) {
        console.error('❌ Error ending call:', error)
      }
    }

    setTimeout(() => navigation.goBack(), 100)
  }

  // Handle call ended notification
  const handleCallEnded = (reason) => {
    stopRingtones()
    clearRingTimer()

    if (disconnectLiveKit) {
      disconnectLiveKit()
    }

    Alert.alert('Call Ended', reason || 'The call has ended', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ])
  }

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

  // Incoming call screen
  if (isIncoming && !callAnswered) {
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
