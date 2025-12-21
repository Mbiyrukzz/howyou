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

  // FIXED: Better state tracking with promise
  const setupInProgress = useRef(false)
  const peerConnectionReady = useRef(false)
  const hasCreatedOffer = useRef(false)
  const mediaInitialized = useRef(false)
  const setupPromise = useRef(null) // NEW: Track setup promise

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
        if (data.userId !== user?.uid) {
          console.log('👤 Remote user joined:', data.userId)
          stopRingtones()
          clearRingTimer()

          // FIXED: For incoming calls, just log - we'll create answer when we get offer
          if (isIncoming && callAnswered) {
            console.log(
              '📱 Incoming call: Remote user joined, ready to receive offer'
            )
          }

          // For outgoing calls, wait for explicit acceptance
          if (!isIncoming) {
            console.log(
              '📞 Outgoing call: Remote user joined, waiting for acceptance'
            )
          }
        }
        break

      case 'call_accepted':
      case 'call-accepted':
        console.log('✅ Call accepted by recipient')

        if (data.from !== user?.uid && !isIncoming) {
          console.log('✅ Creating offer after acceptance...')
          stopRingtones()
          clearRingTimer()
          setCallStatus('connecting')

          // FIXED: Wait for setup to complete if it's still in progress
          try {
            console.log('🔍 Checking setup state...')

            // If setup is in progress, wait for it
            if (setupInProgress.current && setupPromise.current) {
              console.log('⏳ Setup in progress, waiting for completion...')
              await setupPromise.current
              console.log('✅ Setup completed, continuing...')
            }

            // More robust waiting mechanism
            const waitForReady = async () => {
              const maxAttempts = 50 // 5 seconds total
              let attempts = 0

              while (attempts < maxAttempts) {
                // Check if peer connection exists and has tracks
                if (pcRef.current && localStreamRef.current) {
                  const senders = pcRef.current.getSenders()
                  const tracks = localStreamRef.current.getTracks()

                  console.log(
                    `🔍 Attempt ${
                      attempts + 1
                    }: PC=${!!pcRef.current}, Stream=${!!localStreamRef.current}, Senders=${
                      senders.length
                    }, Tracks=${tracks.length}`
                  )

                  if (senders.length > 0 && tracks.length > 0) {
                    console.log('✅ Everything ready!')
                    return true
                  }
                }

                attempts++
                await new Promise((resolve) => setTimeout(resolve, 100))
              }

              return false
            }

            const isReady = await waitForReady()

            if (!isReady) {
              throw new Error(
                'Timeout: Peer connection or tracks not ready after 5s'
              )
            }

            // Double-check state
            if (!pcRef.current) {
              throw new Error('Peer connection lost during wait')
            }

            const senders = pcRef.current.getSenders()
            if (senders.length === 0) {
              throw new Error('No senders found in peer connection')
            }

            // FIXED: Only create offer if we haven't already
            if (!hasCreatedOffer.current) {
              console.log('📤 Creating initial offer...')
              hasCreatedOffer.current = true
              await createOffer()
            } else {
              console.log('⏭️ Offer already created, skipping')
            }
          } catch (error) {
            console.error('❌ Error after call acceptance:', error)
            Alert.alert(
              'Connection Error',
              'Failed to establish connection: ' + error.message,
              [{ text: 'OK', onPress: handleEndCall }]
            )
          }
        }
        break

      case 'webrtc-offer':
        console.log('📥 WEBRTC OFFER received from:', data.from)

        if (data.from !== user?.uid && data.offer) {
          console.log('✅ Processing offer...')
          setCallStatus('connecting')

          // FIXED: Ensure media is ready for incoming calls
          if (isIncoming && callAnswered && !mediaInitialized.current) {
            console.log('🎥 Initializing media before handling offer')
            await initializeMedia()
            mediaInitialized.current = true

            // Small delay to ensure everything is settled
            await new Promise((resolve) => setTimeout(resolve, 100))
          }

          await handleOffer(data.offer)
        } else {
          console.warn('⚠️ Invalid offer or from self')
        }
        break

      case 'webrtc-answer':
        if (data.from !== user?.uid && data.answer) {
          console.log('📥 Received answer from:', data.from)
          await handleAnswer(data.answer)
        }
        break

      case 'webrtc-ice-candidate':
        if (data.from !== user?.uid && data.candidate) {
          console.log('🧊 Received ICE candidate from:', data.from)
          await handleICECandidate(data.candidate)
        }
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
    console.log('🎬 Remote stream received')
    setCallStatus('connected')
    setIsConnected(true)
    stopRingtones()
    clearRingTimer()
  }

  const handleConnectionStateChange = (state) => {
    console.log('🔌 Connection state changed to:', state)

    if (state === 'connected') {
      setCallStatus('connected')
      setIsConnected(true)
      stopRingtones()
      clearRingTimer()
    } else if (state === 'failed') {
      Alert.alert('Connection Failed', 'Unable to establish call connection.', [
        { text: 'OK', onPress: handleEndCall },
      ])
    } else if (state === 'disconnected') {
      console.warn('⚠️ Connection disconnected')
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
    handleConnectionStateChange,
    null,
    null,
    remoteUserId,
    chatId,
    user?.uid
  )

  // FIXED: Better setup flow
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

  const handleAnswerCall = async () => {
    console.log('📞 Answering incoming call...')
    stopRingtones()
    clearRingTimer()
    setCallAnswered(true)
    setCallStatus('connecting')

    try {
      // Step 1: Initialize media FIRST
      console.log('🎥 Step 1: Initializing media...')
      if (!mediaInitialized.current) {
        await initializeMedia()
        mediaInitialized.current = true
      }

      if (!localStreamRef.current) {
        throw new Error('Failed to initialize media')
      }

      console.log(
        '✅ Media ready:',
        localStreamRef.current.getTracks().length,
        'tracks'
      )

      // Step 2: Create peer connection with tracks
      console.log('🔗 Step 2: Creating peer connection...')
      await createPeerConnection()

      if (!pcRef.current) {
        throw new Error('Failed to create peer connection')
      }

      const senders = pcRef.current.getSenders()
      console.log('✅ Peer connection ready with', senders.length, 'senders')

      // Step 3: Notify backend
      console.log('📤 Step 3: Notifying backend...')
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
        throw new Error('Backend rejected call acceptance')
      }

      console.log('✅ Call acceptance confirmed')
      console.log('📱 Ready to receive offer from caller...')

      peerConnectionReady.current = true
    } catch (error) {
      console.error('❌ Error answering call:', error)
      Alert.alert('Error', 'Failed to answer call: ' + error.message)
      navigation.goBack()
    }
  }

  const setupCall = async () => {
    if (setupInProgress.current) {
      console.log('⏭️ Setup already in progress, returning existing promise')
      return setupPromise.current
    }

    setupInProgress.current = true

    // Create and store the setup promise
    setupPromise.current = (async () => {
      try {
        console.log(
          '🎬 Starting call setup for',
          isIncoming ? 'incoming' : 'outgoing',
          'call'
        )

        // Step 1: Initialize media
        console.log('🎥 Step 1: Initializing media...')

        if (!mediaInitialized.current) {
          await initializeMedia()
          mediaInitialized.current = true

          // Give media a moment to fully initialize
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        if (!localStreamRef.current) {
          throw new Error('Failed to initialize media')
        }

        const tracks = localStreamRef.current.getTracks()
        console.log(
          '✅ Media initialized with',
          tracks.length,
          'tracks:',
          tracks.map((t) => `${t.kind}:${t.enabled}`).join(', ')
        )

        // Step 2: Create peer connection for OUTGOING calls
        if (!isIncoming) {
          console.log(
            '🔗 Step 2: Creating peer connection for outgoing call...'
          )

          await createPeerConnection()

          if (!pcRef.current) {
            throw new Error('Failed to create peer connection')
          }

          // Verify tracks were added
          const senders = pcRef.current.getSenders()
          console.log('✅ Peer connection created')
          console.log('📊 Senders:', senders.length)
          console.log('📊 Tracks in stream:', tracks.length)

          if (senders.length === 0) {
            console.error('❌ No senders after peer connection creation!')
            throw new Error('Tracks were not added to peer connection')
          }

          // Log each sender
          senders.forEach((sender, idx) => {
            console.log(
              `📤 Sender ${idx}:`,
              sender.track?.kind,
              sender.track?.id
            )
          })

          peerConnectionReady.current = true
          console.log('✅ Peer connection fully ready')
        } else {
          console.log(
            '📱 Incoming call - peer connection will be created when answering'
          )
        }

        console.log('✅ Call setup complete')
      } catch (error) {
        console.error('❌ Setup error:', error)
        Alert.alert(
          'Setup Error',
          'Failed to initialize call: ' + error.message,
          [{ text: 'OK', onPress: handleEndCall }]
        )
        throw error // Re-throw so awaiting code knows setup failed
      } finally {
        setupInProgress.current = false
      }
    })()

    return setupPromise.current
  }

  const handleRejectCall = async () => {
    stopRingtones()
    clearRingTimer()

    try {
      await fetch(`${API_URL}/answer-call/${route.params?.callId}`, {
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
    console.log('🧹 Cleaning up call...')
    webrtcCleanup()
    setIsConnected(false)
    setupInProgress.current = false
    peerConnectionReady.current = false
    hasCreatedOffer.current = false
    mediaInitialized.current = false
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
