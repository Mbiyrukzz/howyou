import { useState, useEffect, useRef, useCallback } from 'react'
import { Platform, Alert } from 'react-native'
import { Audio } from 'expo-av'
import { Camera } from 'expo-camera'
import InCallManager from 'react-native-incall-manager'

let RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, mediaDevices

if (Platform.OS === 'web') {
  RTCPeerConnection = window.RTCPeerConnection
  RTCSessionDescription = window.RTCSessionDescription
  RTCIceCandidate = window.RTCIceCandidate
  mediaDevices = navigator.mediaDevices
} else {
  const WebRTC = require('react-native-webrtc')
  RTCPeerConnection = WebRTC.RTCPeerConnection
  RTCSessionDescription = WebRTC.RTCSessionDescription
  RTCIceCandidate = WebRTC.RTCIceCandidate
  mediaDevices = WebRTC.mediaDevices
}

const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:standard.relay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:standard.relay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:standard.relay.metered.ca:80?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:standard.relay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
}

// InCallManager helper functions
const startCallAudio = () => {
  if (Platform.OS === 'web') return

  try {
    console.log('🔊 Starting InCallManager audio')
    InCallManager.start({ media: 'audio' })
    // Force loudspeaker (critical for Android)
    InCallManager.setSpeakerphoneOn(true)
    InCallManager.setForceSpeakerphoneOn(true)
  } catch (err) {
    console.warn('⚠️ InCallManager start failed:', err)
  }
}

const stopCallAudio = () => {
  if (Platform.OS === 'web') return

  try {
    console.log('🔇 Stopping InCallManager audio')
    InCallManager.stop()
  } catch (err) {
    console.warn('⚠️ InCallManager stop failed:', err)
  }
}

export function useWebRTC(
  callType,
  isFrontCamera,
  sendWebSocketMessage,
  onRemoteStream,
  onConnectionStateChange,
  onScreenFrame,
  onScreenSharingChange,
  remoteUserId,
  chatId,
  currentUserId
) {
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [screenStream, setScreenStream] = useState(null)

  const pcRef = useRef(null)
  const localStreamRef = useRef(null)
  const candidatesQueue = useRef([])
  const isOfferPending = useRef(false)
  const makingOffer = useRef(false)
  const ignoreOffer = useRef(false)
  const isSettingRemoteAnswerPending = useRef(false)

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } =
        await Camera.requestCameraPermissionsAsync()
      const { status: micStatus } = await Audio.requestPermissionsAsync()

      if (cameraStatus !== 'granted' || micStatus !== 'granted') {
        throw new Error('Camera or microphone permissions denied')
      }
    }
  }

  const getUserMedia = async () => {
    try {
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        })
      }

      const constraints = {
        audio:
          Platform.OS === 'web'
            ? {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              }
            : {
                mandatory: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                },
              },
        video:
          callType === 'video'
            ? {
                width: { ideal: 640 },
                height: { ideal: 480 },
                frameRate: { ideal: 30 },
                facingMode: isFrontCamera ? 'user' : 'environment',
              }
            : false,
      }

      let stream
      if (Platform.OS === 'web') {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } else {
        stream = await mediaDevices.getUserMedia(constraints)
      }

      stream.getTracks().forEach((track) => {
        track.enabled = true
      })

      return stream
    } catch (error) {
      console.error('❌ getUserMedia error:', error)
      throw error
    }
  }

  const createPeerConnection = useCallback(async () => {
    console.log('🔗 Creating peer connection...')

    if (pcRef.current) {
      console.log('⚠️ Peer connection already exists, closing old one')
      pcRef.current.close()
    }

    const pc = new RTCPeerConnection(iceServers)
    pcRef.current = pc

    // Connection state monitoring with InCallManager integration
    pc.onconnectionstatechange = () => {
      console.log('🔌 Connection state:', pc.connectionState)
      onConnectionStateChange?.(pc.connectionState)

      // Start audio when connected
      if (pc.connectionState === 'connected') {
        startCallAudio()
      }

      // Stop audio when disconnected
      if (
        pc.connectionState === 'disconnected' ||
        pc.connectionState === 'failed' ||
        pc.connectionState === 'closed'
      ) {
        stopCallAudio()
      }
    }

    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state:', pc.iceConnectionState)
    }

    pc.onicegatheringstatechange = () => {
      console.log('📊 ICE gathering state:', pc.iceGatheringState)
    }

    // Note: onnegotiationneeded kept for renegotiation scenarios
    // but initial offer will be created manually
    pc.onnegotiationneeded = async () => {
      try {
        console.log('🤝 negotiationneeded event fired')

        // Prevent creating offer while another is in progress
        if (makingOffer.current) {
          console.log('⚠️ Already making offer, skipping')
          return
        }

        makingOffer.current = true

        // Wait for stable state
        if (pc.signalingState !== 'stable') {
          console.log('⚠️ Not in stable state, waiting...', pc.signalingState)
          return
        }

        console.log('📤 Creating offer from negotiationneeded')
        const offer = await pc.createOffer()

        // Check state again before setting (race condition protection)
        if (pc.signalingState !== 'stable') {
          console.log('⚠️ State changed during offer creation, aborting')
          return
        }

        await pc.setLocalDescription(offer)

        sendWebSocketMessage({
          type: 'webrtc-offer',
          to: remoteUserId,
          from: currentUserId,
          offer: pc.localDescription,
          chatId,
        })

        console.log('✅ Negotiation offer sent')
      } catch (err) {
        console.error('❌ Negotiation error:', err)
      } finally {
        makingOffer.current = false
      }
    }

    // CRITICAL: Add local tracks if available
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getTracks()
      console.log('📤 Adding', tracks.length, 'local tracks to peer connection')

      tracks.forEach((track) => {
        console.log(
          '➕ Adding track:',
          track.kind,
          track.id,
          'enabled:',
          track.enabled
        )
        const sender = pc.addTrack(track, localStreamRef.current)
        console.log('✅ Track added, sender:', sender)
      })

      // Verify tracks were added
      const senders = pc.getSenders()
      console.log('📊 Total senders after adding tracks:', senders.length)

      if (senders.length !== tracks.length) {
        console.error(
          '⚠️ Mismatch: Expected',
          tracks.length,
          'senders but got',
          senders.length
        )
      }
    } else {
      console.warn('⚠️ No local stream available when creating peer connection')
    }

    pc.ontrack = (event) => {
      console.log('📥 Remote track received:', event.track.kind)
      if (event.streams?.[0]) {
        console.log('✅ Setting remote stream')
        setRemoteStream(event.streams[0])
        onRemoteStream?.(event.streams[0])
      }
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 Sending ICE candidate:', event.candidate.type)
        sendWebSocketMessage({
          type: 'webrtc-ice-candidate',
          to: remoteUserId,
          from: currentUserId,
          candidate: event.candidate,
          chatId,
        })
      } else {
        console.log('🧊 ICE gathering complete')
      }
    }

    console.log('✅ Peer connection created successfully')
    return pc
  }, [
    callType,
    sendWebSocketMessage,
    onRemoteStream,
    onConnectionStateChange,
    remoteUserId,
    chatId,
    currentUserId,
  ])

  const createOffer = useCallback(async () => {
    if (!pcRef.current) {
      throw new Error('PeerConnection not initialized')
    }

    // FIXED: Prevent multiple simultaneous offers
    if (isOfferPending.current || makingOffer.current) {
      console.log('⏭️ Offer creation already in progress, skipping...')
      return
    }

    // FIXED: Check signaling state before creating offer
    if (pcRef.current.signalingState !== 'stable') {
      console.log(
        '⚠️ Signaling state not stable:',
        pcRef.current.signalingState
      )
      console.log('⚠️ Waiting for stable state before creating offer')
      return
    }

    try {
      isOfferPending.current = true
      makingOffer.current = true

      console.log('📤 Creating offer...')
      console.log('📤 Current senders:', pcRef.current.getSenders().length)

      const offer = await pcRef.current.createOffer()

      // FIXED: Verify state hasn't changed during async operation
      if (pcRef.current.signalingState !== 'stable') {
        console.log('⚠️ State changed during offer creation, aborting')
        return
      }

      console.log('📤 Setting local description...')
      await pcRef.current.setLocalDescription(offer)

      console.log('📤 Sending offer via WebSocket')
      sendWebSocketMessage({
        type: 'webrtc-offer',
        to: remoteUserId,
        from: currentUserId,
        offer: pcRef.current.localDescription,
        chatId,
      })

      console.log('✅ Offer created and sent successfully')
    } catch (error) {
      console.error('❌ Create offer error:', error)
      throw error
    } finally {
      isOfferPending.current = false
      makingOffer.current = false
    }
  }, [sendWebSocketMessage, remoteUserId, chatId, currentUserId])

  const handleOffer = useCallback(
    async (offer) => {
      try {
        console.log('📥 Handling offer...')
        console.log(
          '📥 Current signaling state:',
          pcRef.current?.signalingState
        )

        if (!pcRef.current) {
          console.log('🔗 Creating peer connection to handle offer')
          await createPeerConnection()
        }

        // FIXED: Handle offer collisions using perfect negotiation pattern
        const offerCollision =
          pcRef.current.signalingState !== 'stable' || makingOffer.current

        ignoreOffer.current = offerCollision

        if (ignoreOffer.current) {
          console.log('⚠️ Offer collision detected, ignoring offer')
          return
        }

        console.log('📥 Setting remote description (offer)...')
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        )
        console.log('✅ Remote description set')

        // FIXED: Process queued ICE candidates after remote description is set
        console.log(
          `🧊 Processing ${candidatesQueue.current.length} queued ICE candidates`
        )
        while (candidatesQueue.current.length > 0) {
          const candidate = candidatesQueue.current.shift()
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate))
            console.log('✅ Added queued candidate')
          } catch (err) {
            console.error('❌ Error adding queued candidate:', err)
          }
        }

        console.log('📤 Creating answer...')
        const answer = await pcRef.current.createAnswer()

        console.log('📤 Setting local description (answer)...')
        await pcRef.current.setLocalDescription(answer)

        console.log('📤 Sending answer via WebSocket')
        sendWebSocketMessage({
          type: 'webrtc-answer',
          to: remoteUserId,
          from: currentUserId,
          answer: pcRef.current.localDescription,
          chatId,
        })

        console.log('✅ Answer created and sent')
      } catch (error) {
        console.error('❌ Handle offer failed:', error)
        Alert.alert('Connection Error', 'Failed to establish call connection.')
      }
    },
    [
      sendWebSocketMessage,
      createPeerConnection,
      remoteUserId,
      chatId,
      currentUserId,
    ]
  )

  const handleAnswer = async (answer) => {
    try {
      console.log('📥 Handling answer...')

      if (!pcRef.current) {
        console.error('❌ No peer connection to handle answer')
        return
      }

      // FIXED: Prevent race condition with multiple answers
      if (isSettingRemoteAnswerPending.current) {
        console.log('⏭️ Already setting remote answer, skipping')
        return
      }

      isSettingRemoteAnswerPending.current = true

      console.log('📥 Current signaling state:', pcRef.current.signalingState)

      // FIXED: Verify we're in the correct state to receive an answer
      if (pcRef.current.signalingState !== 'have-local-offer') {
        console.warn(
          '⚠️ Not expecting answer in state:',
          pcRef.current.signalingState
        )
        return
      }

      console.log('📥 Setting remote description (answer)...')
      await pcRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      )
      console.log('✅ Remote description (answer) set')

      // Process queued ICE candidates
      console.log(
        `🧊 Processing ${candidatesQueue.current.length} queued ICE candidates`
      )
      while (candidatesQueue.current.length > 0) {
        const candidate = candidatesQueue.current.shift()
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate))
          console.log('✅ Added queued candidate')
        } catch (err) {
          console.error('❌ Error adding queued candidate:', err)
        }
      }

      console.log('✅ Answer handled successfully')
    } catch (error) {
      console.error('❌ Handle answer error:', error)
    } finally {
      isSettingRemoteAnswerPending.current = false
    }
  }

  const handleICECandidate = async (candidate) => {
    try {
      if (!pcRef.current) {
        console.log('🧊 No peer connection yet, queuing candidate')
        candidatesQueue.current.push(candidate)
        return
      }

      // FIXED: Only add candidates when we have remote description
      if (pcRef.current.remoteDescription) {
        console.log('🧊 Adding ICE candidate immediately')
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate))
      } else {
        console.log('🧊 Queuing ICE candidate (no remote description yet)')
        candidatesQueue.current.push(candidate)
      }
    } catch (error) {
      // FIXED: Don't fail on invalid candidates, just log
      if (error.name === 'OperationError') {
        console.warn(
          '⚠️ Failed to add ICE candidate (might be okay):',
          error.message
        )
      } else {
        console.error('❌ Handle ICE candidate error:', error)
      }
    }
  }

  const initializeMedia = async () => {
    console.log('🎥 Initializing media...')
    await requestPermissions()
    const stream = await getUserMedia()
    setLocalStream(stream)
    localStreamRef.current = stream
    console.log(
      '✅ Media initialized with tracks:',
      stream
        .getTracks()
        .map((t) => `${t.kind}:${t.enabled}`)
        .join(', ')
    )
    return stream
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled
      })
      return !audioTracks[0]?.enabled
    }
    return false
  }

  const toggleVideo = () => {
    if (localStreamRef.current && callType === 'video') {
      const videoTracks = localStreamRef.current.getVideoTracks()
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled
      })
      return !videoTracks[0]?.enabled
    }
    return false
  }

  const startScreenShare = async () => {
    if (Platform.OS !== 'web') return false

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      })

      const videoTrack = displayStream.getVideoTracks()[0]
      const sender = pcRef.current
        .getSenders()
        .find((s) => s.track?.kind === 'video')

      if (sender) {
        await sender.replaceTrack(videoTrack)
      } else {
        pcRef.current.addTrack(videoTrack, displayStream)
      }

      setScreenStream(displayStream)
      setIsScreenSharing(true)

      sendWebSocketMessage({
        type: 'screen-sharing',
        enabled: true,
        to: remoteUserId,
        chatId,
      })

      videoTrack.onended = () => stopScreenShare()

      return true
    } catch (err) {
      console.warn('Screen share cancelled or failed:', err)
      return false
    }
  }

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop())
      setScreenStream(null)
    }

    if (pcRef.current) {
      const videoSender = pcRef.current
        .getSenders()
        .find((s) => s.track?.kind === 'video')

      if (videoSender && localStreamRef.current) {
        const originalVideo = localStreamRef.current.getVideoTracks()[0]
        if (originalVideo) videoSender.replaceTrack(originalVideo)
      }
    }

    setIsScreenSharing(false)

    sendWebSocketMessage({
      type: 'screen-sharing',
      enabled: false,
      to: remoteUserId,
      chatId,
    })
  }

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare()
    } else {
      if (Platform.OS === 'web') {
        await startScreenShare()
      } else {
        setIsScreenSharing((prev) => !prev)
        sendWebSocketMessage({
          type: 'screen-sharing',
          enabled: !isScreenSharing,
          to: remoteUserId,
          chatId,
        })
      }
    }
  }

  useEffect(() => {
    if (onScreenSharingChange) {
      onScreenSharingChange(isScreenSharing)
    }
  }, [isScreenSharing, onScreenSharingChange])

  const cleanup = () => {
    console.log('🧹 Cleaning up WebRTC...')

    // Stop InCallManager audio
    stopCallAudio()

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }

    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop())
      setScreenStream(null)
    }

    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }

    setLocalStream(null)
    setRemoteStream(null)
    setIsScreenSharing(false)
    isOfferPending.current = false
    makingOffer.current = false
    ignoreOffer.current = false
    isSettingRemoteAnswerPending.current = false
    candidatesQueue.current = []

    console.log('✅ WebRTC cleanup complete')
  }

  return {
    isScreenSharing,
    screenStream,
    toggleScreenShare,
    startScreenShare,
    stopScreenShare,
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
    toggleMute,
    toggleVideo,
    cleanup,
  }
}
