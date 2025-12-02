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

  const createPeerConnection = async (remoteUserId, chatId) => {
    try {
      const pc = new RTCPeerConnection(iceServers)
      pcRef.current = pc

      if (localStreamRef.current) {
        const tracks = localStreamRef.current.getTracks()
        tracks.forEach((track) => {
          pc.addTrack(track, localStreamRef.current)
        })
      }

      pc.ontrack = (event) => {
        console.log('🎥 Received remote track:', event.track.kind)
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0])
          onRemoteStream?.(event.streams[0])
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendWebSocketMessage({
            type: 'webrtc-ice-candidate',
            candidate: event.candidate,
            to: remoteUserId,
            chatId,
          })
        }
      }

      pc.onconnectionstatechange = () => {
        console.log('📶 Connection state:', pc.connectionState)
        onConnectionStateChange?.(pc.connectionState)
      }

      pc.oniceconnectionstatechange = () => {
        console.log('🧊 ICE state:', pc.iceConnectionState)
        if (pc.iceConnectionState === 'failed') {
          pc.restartIce()
        }
      }

      return pc
    } catch (error) {
      console.error('❌ Create peer connection error:', error)
      throw error
    }
  }

  const createOffer = async (remoteUserId, chatId, userId) => {
    try {
      if (!pcRef.current || !localStreamRef.current) {
        console.error('❌ Cannot create offer: missing pc or stream')
        return
      }

      const offer = await pcRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === 'video',
      })

      await pcRef.current.setLocalDescription(offer)

      sendWebSocketMessage({
        type: 'webrtc-offer',
        offer,
        to: remoteUserId,
        chatId,
        from: userId,
      })
    } catch (error) {
      console.error('❌ Create offer error:', error)
    }
  }

  const handleOffer = async (offer, remoteUserId, chatId, userId) => {
    try {
      if (!pcRef.current) return

      await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer))

      while (candidatesQueue.current.length > 0) {
        const candidate = candidatesQueue.current.shift()
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate))
      }

      const answer = await pcRef.current.createAnswer()
      await pcRef.current.setLocalDescription(answer)

      sendWebSocketMessage({
        type: 'webrtc-answer',
        answer,
        to: remoteUserId,
        chatId,
        from: userId,
      })
    } catch (error) {
      console.error('❌ Handle offer error:', error)
    }
  }

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
