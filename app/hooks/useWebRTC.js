import { useState, useEffect, useRef, useCallback } from 'react'
import { Platform, Alert } from 'react-native'
import { Audio } from 'expo-av'
import { Camera } from 'expo-camera'

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
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
}

export function useWebRTC(
  callType,
  isFrontCamera,
  sendWebSocketMessage,
  onRemoteStream,
  onConnectionStateChange,
  onScreenFrame,
  onScreenSharingChange,
  remoteUserId, // ADD THIS
  chatId // ADD THIS
) {
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)

  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [screenStream, setScreenStream] = useState(null)
  const pcRef = useRef(null)
  const localStreamRef = useRef(null)
  const candidatesQueue = useRef([])
  const isOfferPending = useRef(false) // Track if we're creating an offer

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
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
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

  const createPeerConnection = useCallback(
    async (remoteUserId, chatId, currentUserId) => {
      console.log('🔗 Creating peer connection...')
      const pc = new RTCPeerConnection(iceServers)
      pcRef.current = pc

      // Connection state monitoring
      pc.onconnectionstatechange = () => {
        console.log('🔌 Connection state:', pc.connectionState)
        onConnectionStateChange?.(pc.connectionState)
      }

      pc.oniceconnectionstatechange = () => {
        console.log('🧊 ICE connection state:', pc.iceConnectionState)
      }

      pc.onicegatheringstatechange = () => {
        console.log('📊 ICE gathering state:', pc.iceGatheringState)
      }

      // 🔑 CRITICAL: declare intent BEFORE offer/answer
      pc.addTransceiver('audio', { direction: 'sendrecv' })

      if (callType === 'video') {
        pc.addTransceiver('video', { direction: 'sendrecv' })
      }

      if (localStreamRef.current) {
        console.log('📤 Adding local tracks to peer connection')
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current)
        })
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
          console.log('🧊 Sending ICE candidate')
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

      console.log('✅ Peer connection created')
      return pc
    },
    [callType, sendWebSocketMessage, onRemoteStream, onConnectionStateChange]
  )

  const createOffer = useCallback(
    async (remoteUserId, chatId, currentUserId) => {
      if (!pcRef.current) {
        throw new Error('PeerConnection not initialized')
      }

      if (isOfferPending.current) {
        console.log('⏭️ Offer creation already in progress, skipping...')
        return
      }

      if (pcRef.current.localDescription) {
        console.log(
          '⏭️ Already have local description, skipping offer creation'
        )
        return
      }

      try {
        isOfferPending.current = true
        console.log('📤 Creating offer...')

        const offer = await pcRef.current.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: callType === 'video',
        })

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

        console.log('✅ Offer created and sent')
      } catch (error) {
        console.error('❌ Create offer error:', error)
        throw error
      } finally {
        isOfferPending.current = false
      }
    },
    [callType, sendWebSocketMessage]
  )

  const handleOffer = useCallback(
    async (offer, remoteUserId, chatId, currentUserId) => {
      try {
        console.log('📥 Handling offer...')

        if (!pcRef.current) {
          console.log('🔗 Creating peer connection to handle offer')
          await createPeerConnection(remoteUserId, chatId, currentUserId)
        }

        if (pcRef.current.signalingState !== 'stable') {
          console.warn(
            '⚠️ Signaling state not stable:',
            pcRef.current.signalingState
          )
        }

        console.log('📥 Setting remote description (offer)...')
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        )
        console.log('✅ Remote description set')

        // Process queued ICE candidates
        console.log(
          `🧊 Processing ${candidatesQueue.current.length} queued ICE candidates`
        )
        while (candidatesQueue.current.length > 0) {
          const candidate = candidatesQueue.current.shift()
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate))
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
    [sendWebSocketMessage, createPeerConnection]
  )

  const handleAnswer = async (answer) => {
    try {
      console.log('📥 Handling answer...')

      if (!pcRef.current) {
        console.error('❌ No peer connection to handle answer')
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
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate))
      }

      console.log('✅ Answer handled successfully')
    } catch (error) {
      console.error('❌ Handle answer error:', error)
    }
  }

  const handleICECandidate = async (candidate) => {
    try {
      if (pcRef.current && pcRef.current.remoteDescription) {
        console.log('🧊 Adding ICE candidate immediately')
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate))
      } else {
        console.log('🧊 Queuing ICE candidate (no remote description yet)')
        candidatesQueue.current.push(candidate)
      }
    } catch (error) {
      console.error('❌ Handle ICE candidate error:', error)
    }
  }

  const initializeMedia = async () => {
    console.log('🎥 Initializing media...')
    await requestPermissions()
    const stream = await getUserMedia()
    setLocalStream(stream)
    localStreamRef.current = stream
    console.log('✅ Media initialized')
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

  // Start real screen sharing (web only)
  const startScreenShare = async () => {
    if (Platform.OS !== 'web') return false

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      })

      // Replace video track in existing peer connection
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

      // Notify remote
      sendWebSocketMessage({
        type: 'screen-sharing',
        enabled: true,
        to: remoteUserId,
        chatId,
      })

      // Stop when user stops sharing
      videoTrack.onended = () => stopScreenShare()

      return true
    } catch (err) {
      console.warn('Screen share cancelled or failed:', err)
      return false
    }
  }

  // Stop screen sharing
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
        // Mobile: just toggle flag – actual sending happens in CallScreen
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

  // Handle incoming screen-sharing flag
  useEffect(() => {
    if (onScreenSharingChange) {
      onScreenSharingChange(isScreenSharing)
    }
  }, [isScreenSharing])

  const cleanup = () => {
    console.log('🧹 Cleaning up WebRTC...')

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
