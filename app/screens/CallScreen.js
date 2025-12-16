import React, { useEffect, useState, useRef } from 'react'
import { View, Alert, BackHandler, Platform } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import styled from 'styled-components/native'
import { useUser } from '../hooks/useUser'
import { useRingtones } from '../hooks/useRingtones'
import { useRingTimer } from '../hooks/useRingTimer'
import { useCallTimer } from '../hooks/useCallTimer'
import { useWebSocket } from '../hooks/useCallWebSocket'
import { useWebRTC } from '../hooks/useWebRTC'
import { formatCallDuration, getCallEndMessage } from '../utils/callUtils'
import { CallScreenHeader } from '../components/calls/CallScreenHeader'
import { CallControls } from '../components/calls/CallControls'
import { LocalVideoPreview } from '../components/calls/LocalVideoPreview'
import { RemoteVideoView } from '../components/calls/RemoteVideoView'
import { IncomingCallScreen } from '../components/calls/IncomingCallScreen'

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
  } = route.params || {}

  // State
  const [callStatus, setCallStatus] = useState(
    isIncoming ? 'ringing' : 'connecting'
  )
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video')
  const [isFrontCamera, setIsFrontCamera] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [callAnswered, setCallAnswered] = useState(!isIncoming)
  const setupInProgress = useRef(false)
  const peerConnectionReady = useRef(false)

  // Custom hooks
  const { stopRingtones } = useRingtones(isIncoming, callAnswered)
  const { callDuration } = useCallTimer(isConnected)

  const handleTimeout = () => {
    stopRingtones()
    cleanup()
    Alert.alert('Call Ended', 'No answer', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ])
  }

  const { clearRingTimer } = useRingTimer(handleTimeout, !callAnswered)

  const handleWebSocketMessage = async (data) => {
    console.log('📨 Received:', data.type, {
      from: data.from,
      userId: data.userId,
      currentUser: user?.uid,
      isIncoming,
      callAnswered,
    })

    switch (data.type) {
      case 'user-joined':
      case 'user-already-in-room':
        // Another user joined the call room
        if (data.userId !== user?.uid) {
          console.log('👤 Remote user detected:', data.userId)
          stopRingtones()
          clearRingTimer()

          // For INCOMING calls, this means the caller joined
          // We should be ready to receive their offer
          if (isIncoming && callAnswered) {
            console.log(
              '📱 Incoming call: Remote caller joined, ready for offer'
            )
          }

          // For OUTGOING calls, don't do anything here
          // Wait for explicit call_accepted message
          if (!isIncoming) {
            console.log(
              '📞 Outgoing call: Remote user joined, but waiting for call_accepted...'
            )
          }
        }
        break

      case 'call_accepted':
      case 'call-accepted':
        // CRITICAL: This confirms the recipient answered
        console.log('✅ Call accepted message received:', {
          from: data.from,
          isForMe: data.from !== user?.uid,
          isOutgoing: !isIncoming,
        })

        if (data.from !== user?.uid && !isIncoming) {
          console.log('✅ Recipient answered! Creating offer...')
          stopRingtones()
          clearRingTimer()
          setCallStatus('connecting')

          // Wait for peer connection to be ready
          const waitForPeerConnection = () => {
            return new Promise((resolve, reject) => {
              const startTime = Date.now()
              const checkInterval = setInterval(() => {
                if (pcRef.current && localStreamRef.current) {
                  clearInterval(checkInterval)
                  console.log('✅ Peer connection ready, creating offer')
                  resolve()
                } else if (Date.now() - startTime > 5000) {
                  clearInterval(checkInterval)
                  console.error('❌ Timeout waiting for peer connection')
                  reject(new Error('Timeout waiting for peer connection'))
                }
              }, 100)
            })
          }

          try {
            await waitForPeerConnection()

            // Double-check we don't already have a local description
            if (!pcRef.current.localDescription) {
              console.log('📤 Creating offer...')
              await createOffer(remoteUserId, chatId, user?.uid)
            } else {
              console.log(
                '⏭️ Already have local description, skipping offer creation'
              )
            }
          } catch (error) {
            console.error('❌ Error creating offer after acceptance:', error)
            Alert.alert(
              'Connection Error',
              'Failed to establish call connection.',
              [{ text: 'OK', onPress: handleEndCall }]
            )
          }
        }
        break

      // In the switch case for 'webrtc-offer':
      case 'webrtc-offer':
        console.log('📥 WEBRTC OFFER RECEIVED FROM:', data.from)
        console.log('📥 Full offer data:', JSON.stringify(data, null, 2))

        if (data.from !== user?.uid && data.offer) {
          console.log('✅ Valid offer - handling...')
          setCallStatus('connecting')

          // If we're in an incoming call and just answered, make sure media is ready
          if (isIncoming && callAnswered && !localStreamRef.current) {
            console.log(
              '🔄 Incoming call: initializing media before handling offer'
            )
            await initializeMedia()
          }

          await handleOffer(data.offer, remoteUserId, chatId, user?.uid)
        } else {
          console.warn('⚠️ Invalid offer - missing data or from self', data)
        }
        break

      case 'webrtc-answer':
        if (data.from !== user?.uid) {
          console.log('📥 Received answer from:', data.from)
          await handleAnswer(data.answer)
        }
        break

      case 'webrtc-ice-candidate':
        if (data.from !== user?.uid) {
          console.log('🧊 Received ICE candidate from:', data.from)
          await handleICECandidate(data.candidate)
        }
        break

      case 'user-already-in-room':
        console.log('👤 Caller already in room:', data.userId)
        // This means we should expect an offer soon
        break

      case 'user-left':
        if (data.userId === remoteUserId) {
          handleCallEnded('User left the call')
        }
        break

      case 'call-ended':
      case 'call_ended':
        console.log('🔴 Call ended:', data.reason)
        stopRingtones()
        clearRingTimer()
        cleanup()
        Alert.alert('Call Ended', getCallEndMessage(data.reason), [
          { text: 'OK', onPress: () => navigation.goBack() },
        ])
        break

      default:
        console.log('⚠️ Unhandled message type:', data.type)
    }
  }

  const { sendMessage } = useWebSocket(
    user,
    chatId,
    handleWebSocketMessage,
    navigation
  )

  const handleRemoteStream = (stream) => {
    setCallStatus('connected')
    setIsConnected(true)
    stopRingtones()
    clearRingTimer()
  }

  const handleConnectionStateChange = (state) => {
    if (state === 'connected') {
      setCallStatus('connected')
      setIsConnected(true)
      stopRingtones()
      clearRingTimer()
    } else if (state === 'failed') {
      Alert.alert('Connection Failed', 'Unable to establish call connection.', [
        { text: 'OK', onPress: handleEndCall },
      ])
    }
  }

  const {
    localStream,
    remoteStream,
    pcRef,
    localStreamRef,
    initializeMedia,
    createPeerConnection,
    createOffer,
    handleOffer,
    handleAnswer,
    handleICECandidate,
    toggleMute: webrtcToggleMute,
    toggleVideo: webrtcToggleVideo,
    cleanup: webrtcCleanup,
  } = useWebRTC(
    callType,
    isFrontCamera,
    sendMessage,
    handleRemoteStream,
    handleConnectionStateChange
  )

  // Setup call
  useEffect(() => {
    if ((!isIncoming || callAnswered) && !setupInProgress.current) {
      setupCall()
    }

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleEndCall()
        return true
      }
    )

    return () => backHandler.remove()
  }, [callAnswered, isIncoming])

  const setupCall = async () => {
    if (setupInProgress.current) return
    setupInProgress.current = true

    try {
      console.log('🎥 Initializing media...')
      await initializeMedia()

      if (!isIncoming && !pcRef.current) {
        console.log('🔗 Creating peer connection (outgoing call)')
        await createPeerConnection(remoteUserId, chatId, user?.uid)
      }

      console.log('✅ Call setup complete', {
        hasPeerConnection: !!pcRef.current,
        hasLocalStream: !!localStreamRef.current,
      })
    } catch (error) {
      console.error('❌ Setup call error:', error)
      Alert.alert('Setup Error', 'Failed to initialize call.')
    } finally {
      setupInProgress.current = false
    }
  }

  const handleAnswerCall = async () => {
    console.log('📞 Answering call...')
    stopRingtones()
    clearRingTimer()
    setCallAnswered(true)
    setCallStatus('connecting')

    try {
      // CRITICAL: First, make sure we have media
      if (!localStreamRef.current) {
        console.log('🎥 Initializing media for incoming call...')
        await initializeMedia()
      }

      // CRITICAL: Create peer connection BEFORE telling backend
      console.log('🔗 Creating peer connection immediately on answer...')

      // Store the current user ID
      const currentUserId = user?.uid

      // Create peer connection with explicit user IDs
      await createPeerConnection(remoteUserId, chatId, currentUserId)
      console.log('✅ Peer connection created, ready for offers')

      // Now tell backend we answered
      const response = await fetch(
        `${API_URL}/answer-call/${route.params?.callId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify({ accepted: true }),
        }
      )

      const data = await response.json()

      if (!data.success) {
        console.error('❌ Backend rejected call acceptance')
        Alert.alert('Error', 'Failed to answer call')
        navigation.goBack()
        return
      }

      console.log('✅ Backend confirmed call acceptance')
      console.log('📱 Now waiting for offer from caller...')
    } catch (error) {
      console.error('❌ Error answering call:', error)
      Alert.alert('Error', 'Failed to answer call')
      navigation.goBack()
    }
  }

  const handleRejectCall = async () => {
    stopRingtones()
    clearRingTimer()

    try {
      await fetch(`http://localhost:5000/answer-call/${route.params?.callId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({ accepted: false }),
      })

      sendMessage({
        type: 'end-call',
        chatId,
        userId: user?.uid,
        remoteUserId,
        reason: 'rejected',
      })
    } catch (error) {
      console.error('❌ Error rejecting call:', error)
    }

    cleanup()
    navigation.goBack()
  }

  const handleEndCall = () => {
    stopRingtones()
    clearRingTimer()

    sendMessage({
      type: 'end-call',
      chatId,
      userId: user?.uid,
      remoteUserId,
      reason: callAnswered ? 'user_ended' : 'cancelled',
    })

    cleanup()
    setTimeout(() => navigation.goBack(), 100)
  }

  const handleCallEnded = (reason) => {
    stopRingtones()
    clearRingTimer()
    cleanup()
    Alert.alert('Call Ended', reason || 'The call has ended', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ])
  }

  const cleanup = () => {
    webrtcCleanup()
    setIsConnected(false)
    setupInProgress.current = false
    peerConnectionReady.current = false
  }

  // Control handlers
  const handleToggleMute = () => {
    const muted = webrtcToggleMute()
    setIsMuted(muted)
  }

  const handleToggleVideo = () => {
    const disabled = webrtcToggleVideo()
    setIsVideoEnabled(!disabled)
  }

  const handleSwitchCamera = async () => {
    // Implementation for camera switch
    setIsFrontCamera(!isFrontCamera)
  }

  const handleToggleSpeaker = () => {
    // Implementation for speaker toggle
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
        showCameraSwitch={callType === 'video' && Platform.OS !== 'web'}
        onBack={handleEndCall}
        onSwitchCamera={handleSwitchCamera}
      />

      <VideoContainer>
        <RemoteVideoView
          remoteStream={remoteStream}
          remoteUserName={remoteUserName}
          isConnected={isConnected}
          callStatus={callStatus}
          callType={callType}
          callDuration={callDuration}
          isIncoming={isIncoming}
        />
        {callType === 'video' && (
          <LocalVideoPreview
            localStream={localStream}
            screenStream={null}
            isVideoEnabled={isVideoEnabled}
            isScreenSharing={false}
            isFrontCamera={isFrontCamera}
          />
        )}
      </VideoContainer>

      <CallControls
        isMuted={isMuted}
        isVideoEnabled={isVideoEnabled}
        callType={callType}
        onToggleMute={handleToggleMute}
        onToggleVideo={handleToggleVideo}
        onEndCall={handleEndCall}
        onToggleSpeaker={handleToggleSpeaker}
      />
    </Container>
  )
}

export default CallScreen
