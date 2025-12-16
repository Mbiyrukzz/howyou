import { useState, useRef, useCallback } from 'react'
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
  onConnectionStateChange
) {
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const pcRef = useRef(null)
  const localStreamRef = useRef(null)
  const candidatesQueue = useRef([])

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
      const pc = new RTCPeerConnection(iceServers)
      pcRef.current = pc

      // 🔑 CRITICAL: declare intent BEFORE offer/answer
      pc.addTransceiver('audio', { direction: 'sendrecv' })

      if (callType === 'video') {
        pc.addTransceiver('video', { direction: 'sendrecv' })
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current)
        })
      }

      pc.ontrack = (event) => {
        if (event.streams?.[0]) {
          setRemoteStream(event.streams[0])
          onRemoteStream?.(event.streams[0])
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendWebSocketMessage({
            type: 'webrtc-ice-candidate',
            to: remoteUserId,
            from: currentUserId,
            candidate: event.candidate,
            chatId,
          })
        }
      }

      return pc
    },
    [callType, sendWebSocketMessage, onRemoteStream]
  )

  const createOffer = useCallback(
    async (remoteUserId, chatId, currentUserId) => {
      if (!pcRef.current) {
        throw new Error('PeerConnection not initialized')
      }

      const offer = await pcRef.current.createOffer()
      await pcRef.current.setLocalDescription(offer)

      sendWebSocketMessage({
        type: 'webrtc-offer',
        to: remoteUserId,
        from: currentUserId,
        offer,
        chatId,
      })
    },
    [sendWebSocketMessage]
  )

  const handleOffer = useCallback(
    async (offer, remoteUserId, chatId, currentUserId) => {
      try {
        if (!pcRef.current) {
          await createPeerConnection(remoteUserId, chatId, currentUserId)
        }

        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        )

        while (candidatesQueue.current.length > 0) {
          const candidate = candidatesQueue.current.shift()
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate))
        }

        const answer = await pcRef.current.createAnswer()
        await pcRef.current.setLocalDescription(answer)

        sendWebSocketMessage({
          type: 'webrtc-answer',
          to: remoteUserId,
          from: currentUserId,
          answer,
          chatId,
        })
      } catch (error) {
        console.error('Handle offer failed:', error)
        Alert.alert('Connection Error', 'Failed to establish call connection.')
      }
    },
    [sendWebSocketMessage, createPeerConnection]
  )

  const handleAnswer = async (answer) => {
    try {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        )

        while (candidatesQueue.current.length > 0) {
          const candidate = candidatesQueue.current.shift()
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate))
        }
      }
    } catch (error) {
      console.error('❌ Handle answer error:', error)
    }
  }

  const handleICECandidate = async (candidate) => {
    try {
      if (pcRef.current && pcRef.current.remoteDescription) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate))
      } else {
        candidatesQueue.current.push(candidate)
      }
    } catch (error) {
      console.error('❌ Handle ICE candidate error:', error)
    }
  }

  const initializeMedia = async () => {
    await requestPermissions()
    const stream = await getUserMedia()
    setLocalStream(stream)
    localStreamRef.current = stream
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

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }

    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }

    setLocalStream(null)
    setRemoteStream(null)
  }

  return {
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
