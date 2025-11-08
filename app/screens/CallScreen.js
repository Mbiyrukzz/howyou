import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
  Dimensions,
  BackHandler,
} from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import styled from 'styled-components/native'
import { Video } from 'expo-video'
import { Audio } from 'expo-av'
import { Camera } from 'expo-camera'
import * as MediaLibrary from 'expo-media-library'
import { useUser } from '../hooks/useUser'

// WebRTC imports
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

const SIGNALING_URL = 'ws://localhost:5000'
const RING_TIMEOUT = 40000 // 40 seconds

const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
}

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

  // State management
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [callStatus, setCallStatus] = useState(
    isIncoming ? 'ringing' : 'connecting'
  )
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video')
  const [isFrontCamera, setIsFrontCamera] = useState(true)
  const [callDuration, setCallDuration] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [callAnswered, setCallAnswered] = useState(!isIncoming)
  const [callWsConnected, setCallWsConnected] = useState(false)

  // Refs
  const wsRef = useRef(null)
  const pcRef = useRef(null)
  const localStreamRef = useRef(null)
  const screenStreamRef = useRef(null)
  const candidatesQueue = useRef([])
  const callStartTime = useRef(null)
  const durationInterval = useRef(null)
  const ringTimerRef = useRef(null)
  const ringtoneRef = useRef(null)
  const ringbackToneRef = useRef(null)

  const isStoppingRingtones = useRef(false)
  const isRingtonesSetup = useRef(false)

  // Initialize ring timer and sounds
  useEffect(() => {
    setupRingtones()

    if (isIncoming) {
      playRingtone()
      startRingTimer()
    } else {
      playRingbackTone()
      startRingTimer()
    }

    return () => {
      stopRingtones() // safe now
      clearRingTimer()
    }
  }, [])

  const setupRingtones = async () => {
    if (isRingtonesSetup.current) return
    isRingtonesSetup.current = true

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      })

      const { sound: ringtone } = await Audio.Sound.createAsync(
        require('../assets/ringtone.mp3'),
        { isLooping: true, volume: 1.0 }
      )
      ringtoneRef.current = ringtone

      const { sound: ringback } = await Audio.Sound.createAsync(
        require('../assets/ringbacktone.mp3'),
        { isLooping: true, volume: 0.8 }
      )
      ringbackToneRef.current = ringback
    } catch (error) {
      console.error('Setup ringtones error:', error)
      isRingtonesSetup.current = false // allow retry if needed
    }
  }

  const playRingtone = async () => {
    try {
      if (ringtoneRef.current) {
        await ringtoneRef.current.playAsync()
      }
    } catch (error) {
      console.error('❌ Play ringtone error:', error)
    }
  }

  const playRingbackTone = async () => {
    try {
      if (ringbackToneRef.current) {
        await ringbackToneRef.current.playAsync()
      }
    } catch (error) {
      console.error('❌ Play ringback tone error:', error)
    }
  }

  const stopRingtones = async () => {
    if (isStoppingRingtones.current) return
    isStoppingRingtones.current = true

    try {
      if (ringtoneRef.current) {
        await ringtoneRef.current.stopAsync().catch(() => {})
        await ringtoneRef.current.unloadAsync().catch(() => {})
        ringtoneRef.current = null
      }
      if (ringbackToneRef.current) {
        await ringbackToneRef.current.stopAsync().catch(() => {})
        await ringbackToneRef.current.unloadAsync().catch(() => {})
        ringbackToneRef.current = null
      }
    } catch (error) {
      console.warn('Stop ringtones error:', error)
    } finally {
      isStoppingRingtones.current = false
    }
  }

  const startRingTimer = () => {
    ringTimerRef.current = setTimeout(() => {
      console.log('⏰ Ring timeout - call not answered')
      handleCallTimeout()
    }, RING_TIMEOUT)
  }

  const clearRingTimer = () => {
    if (ringTimerRef.current) {
      clearTimeout(ringTimerRef.current)
      ringTimerRef.current = null
    }
  }

  const handleRejectCall = useCallback(async () => {
    console.log('📵 User rejecting call...')

    stopRingtones()
    clearRingTimer()

    try {
      // ✅ Notify backend that call was rejected
      const response = await fetch(
        `http://localhost:5000/answer-call/${route.params?.callId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify({ accepted: false }),
        }
      )

      const data = await response.json()
      console.log('✅ Call rejection sent:', data)

      // Send WebSocket notification to caller
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'end-call',
            chatId,
            userId: user?.uid,
            remoteUserId,
            reason: 'rejected',
          })
        )
      }
    } catch (error) {
      console.error('❌ Error rejecting call:', error)
    }

    cleanup()
    navigation.goBack()
  }, [route.params?.callId, user, chatId, remoteUserId, navigation])

  // Update handleEndCall to use proper reason:
  const handleEndCall = useCallback(() => {
    console.log('🔴 Ending call')

    stopRingtones()
    clearRingTimer()

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'end-call',
          chatId,
          userId: user?.uid,
          remoteUserId,
          reason: callAnswered ? 'user_ended' : 'cancelled',
        })
      )
    }

    cleanup()

    // Small delay to ensure cleanup completes
    setTimeout(() => {
      navigation.goBack()
    }, 100)
  }, [chatId, user?.uid, remoteUserId, callAnswered, navigation])

  // Update handleCallTimeout:
  const handleCallTimeout = useCallback(() => {
    console.log('⏰ Handling call timeout')
    stopRingtones()
    clearRingTimer()

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'end-call',
          chatId,
          userId: user?.uid,
          remoteUserId,
          reason: 'timeout',
        })
      )
    }

    cleanup()

    Alert.alert(
      'Call Ended',
      'No answer',
      [{ text: 'OK', onPress: () => navigation.goBack() }],
      { cancelable: false }
    )

    setTimeout(() => {
      navigation.goBack()
    }, 100)
  }, [chatId, user?.uid, remoteUserId, navigation])

  useEffect(() => {
    // ✅ Only setup immediately if NOT incoming OR already answered
    if (!isIncoming || callAnswered) {
      setupCall()
    }

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleEndCall()
        return true
      }
    )

    return () => {
      cleanup()
      backHandler.remove()
    }
  }, [callAnswered])

  useEffect(() => {
    if (!user?.uid || !chatId) {
      console.warn(
        '🕓 Waiting for user or chatId before connecting call WebSocket...'
      )
      return
    }

    const wsUrl = `${SIGNALING_URL}/signaling?userId=${user.uid}&chatId=${chatId}`
    console.log('🔌 Connecting call WebSocket to:', wsUrl)

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    let intentionalClose = false

    ws.onopen = () => {
      console.log('✅ Call WebSocket connected to /signaling')
      setCallWsConnected(true)

      // Join the call room
      ws.send(
        JSON.stringify({
          type: 'join-call',
          chatId,
          userId: user.uid,
        })
      )

      // ✅ If caller and already setup, wait a moment then create offer
      if (!isIncoming && pcRef.current && localStreamRef.current) {
        console.log('📞 Caller connected, waiting for recipient to join...')
        // The offer will be created when we receive 'user-joined' event
      }

      // ✅ If answerer just connected after accepting, create offer
      if (isIncoming && callAnswered && pcRef.current) {
        console.log('📞 Answerer connected, creating offer...')
        setTimeout(() => {
          if (pcRef.current && !pcRef.current.localDescription) {
            createOffer()
          }
        }, 1000)
      }
    }

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data)
        await handleWebSocketMessage(data)
      } catch (error) {
        console.error('❌ Call WebSocket message error:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('❌ Call WebSocket error:', error)
      setCallWsConnected(false)
    }

    ws.onclose = (event) => {
      console.log('🔴 Call WebSocket disconnected:', {
        code: event.code,
        reason: event.reason,
        clean: event.wasClean,
        intentional: intentionalClose,
      })
      setCallWsConnected(false)

      if (!intentionalClose && event.code !== 1000) {
        Alert.alert(
          'Connection Lost',
          'Call connection was lost. Please try again.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        )
      }
    }

    return () => {
      console.log('🧹 Cleaning up call WebSocket')
      intentionalClose = true
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close(1000, 'Component unmount')
      }
    }
  }, [user?.uid, chatId, navigation])

  const handleWebSocketMessage = async (data) => {
    console.log('📨 CallScreen received:', data.type)

    switch (data.type) {
      case 'connected':
        console.log('✅ WebSocket connection confirmed on /signaling')

        // ✅ FIX: If you connected AFTER answering, create offer immediately
        if (isIncoming && callAnswered && !pcRef.current) {
          console.log('📞 Late connection detected, setting up call now...')
          setTimeout(async () => {
            if (!pcRef.current) {
              await setupCall()
              await createOffer()
            }
          }, 500)
        }
        break

      case 'user-joined':
        // When remote user joins the signaling channel
        if (data.userId !== user?.uid) {
          console.log('👤 Remote user joined /signaling:', data.userId)
          stopRingtones()
          clearRingTimer()

          // ✅ Caller creates offer when recipient joins
          if (!isIncoming) {
            console.log('📞 Caller creating offer for newly joined user...')
            // Small delay to ensure recipient's peer connection is ready
            setTimeout(async () => {
              if (pcRef.current && !pcRef.current.localDescription) {
                await createOffer()
              }
            }, 500)
          }
        }
        break

      case 'user-already-in-room':
        // When you join and someone is already there
        if (data.userId !== user?.uid) {
          console.log('👤 User already in room:', data.userId)

          // ✅ If you're the answerer and joining late, create offer
          if (isIncoming && callAnswered) {
            console.log('📞 Answerer creating offer for existing user...')
            setTimeout(async () => {
              if (pcRef.current && !pcRef.current.localDescription) {
                await createOffer()
              }
            }, 500)
          }
        }
        break

      case 'call-answered':
      case 'call_accepted':
        if (data.from !== user?.uid) {
          console.log('✅ Call accepted by recipient')
          stopRingtones()
          clearRingTimer()
          setCallStatus('connecting')

          // The recipient will join /signaling and trigger user-joined event
          // which will cause the caller to create an offer
        }
        break

      case 'call_rejected':
      case 'call-rejected':
        console.log('📵 Call rejected by recipient')
        stopRingtones()
        clearRingTimer()
        cleanup()

        Alert.alert(
          'Call Declined',
          `${data.recipientName || 'The other person'} declined your call`,
          [{ text: 'OK', onPress: () => navigation.goBack() }],
          { cancelable: false }
        )

        setTimeout(() => {
          navigation.goBack()
        }, 100)
        break

      case 'webrtc-offer':
        if (data.from !== user?.uid) {
          console.log('📞 Received WebRTC offer')
          await handleOffer(data.offer)
        }
        break

      case 'webrtc-answer':
        if (data.from !== user?.uid) {
          console.log('📞 Received WebRTC answer')
          await handleAnswer(data.answer)
        }
        break

      case 'webrtc-ice-candidate':
        if (data.from !== user?.uid) {
          console.log('🧊 Received ICE candidate')
          await handleNewICECandidate(data.candidate)
        }
        break

      case 'user-left':
        if (data.userId === remoteUserId) {
          handleCallEnded('User left the call')
        }
        break

      case 'call-ended':
      case 'call_ended':
        console.log('📵 Call ended:', data.reason)
        stopRingtones()
        clearRingTimer()
        cleanup()

        let endMessage = 'The call has ended'

        if (data.reason === 'timeout') {
          endMessage = 'Call was not answered'
        } else if (data.reason === 'user_ended') {
          endMessage = 'Call ended by other user'
        } else if (data.duration) {
          const mins = Math.floor(data.duration / 60)
          const secs = data.duration % 60
          endMessage = `Call duration: ${mins}:${secs
            .toString()
            .padStart(2, '0')}`
        }

        Alert.alert(
          'Call Ended',
          endMessage,
          [{ text: 'OK', onPress: () => navigation.goBack() }],
          { cancelable: false }
        )

        setTimeout(() => {
          navigation.goBack()
        }, 100)
        break

      case 'screen-sharing':
        if (data.from !== user?.uid) {
          console.log('📺 Remote user toggled screen sharing:', data.enabled)
        }
        break

      default:
        console.log('⚠️ Unknown message type:', data.type)
    }
  }

  // ✅ Update handleAnswerCall to ensure proper setup
  const handleAnswerCall = async () => {
    console.log('📞 User answering call...')

    stopRingtones()
    clearRingTimer()
    setCallAnswered(true)
    setCallStatus('connecting')

    try {
      // ✅ Step 1: Notify backend that call was accepted
      const response = await fetch(
        `http://localhost:5000/answer-call/${route.params?.callId}`,
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
        console.error('❌ Failed to answer call:', data.error)
        Alert.alert('Error', 'Failed to answer call')
        navigation.goBack()
        return
      }

      console.log('✅ Backend notified of call acceptance')

      // ✅ Step 2: Setup local media FIRST before connecting to signaling
      console.log('📹 Setting up local media...')
      await setupCall()

      // ✅ Step 3: Wait for WebSocket to /signaling to connect
      // The useEffect will handle the connection
      // Once connected, we'll receive 'connected' event and create offer

      console.log(
        '✅ Call answer complete, waiting for signaling connection...'
      )
    } catch (error) {
      console.error('❌ Error answering call:', error)
      Alert.alert('Error', 'Failed to answer call')
      navigation.goBack()
    }
  }
  // Add a helper function for call ended scenarios:
  const handleCallEnded = (reason) => {
    console.log('📵 Call ended:', reason)
    stopRingtones()
    clearRingTimer()
    cleanup()

    Alert.alert(
      'Call Ended',
      reason || 'The call has ended',
      [{ text: 'OK', onPress: () => navigation.goBack() }],
      { cancelable: false }
    )

    setTimeout(() => {
      navigation.goBack()
    }, 100)
  }
  // Initialize media and WebRTC
  useEffect(() => {
    if (!isIncoming || callAnswered) {
      setupCall()
    }

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleEndCall()
        return true
      }
    )

    return () => {
      cleanup()
      backHandler.remove()
    }
  }, [callAnswered])

  const setupCall = async () => {
    try {
      await requestPermissions()
      const stream = await getUserMedia()
      setLocalStream(stream)
      localStreamRef.current = stream
      await createPeerConnection()

      console.log('✅ Call setup complete, media and peer connection ready')

      // ✅ Don't create offer here - wait for user-joined event
    } catch (error) {
      console.error('❌ Setup call error:', error)
      Alert.alert(
        'Setup Error',
        'Failed to initialize call. Please check permissions.',
        [{ text: 'OK', onPress: handleEndCall }]
      )
    }
  }
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } =
        await Camera.requestCameraPermissionsAsync()
      const { status: micStatus } = await Audio.requestPermissionsAsync()
      const { status: mediaStatus } =
        await MediaLibrary.requestPermissionsAsync()

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
        audio: true,
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

      return stream
    } catch (error) {
      console.error('❌ getUserMedia error:', error)
      throw error
    }
  }

  const getScreenShareStream = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Error', 'Screen sharing is not supported on mobile devices.')
      return null
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      })

      stream.getVideoTracks()[0].onended = () => {
        stopScreenSharing()
      }

      return stream
    } catch (error) {
      console.error('❌ getDisplayMedia error:', error)
      Alert.alert('Error', 'Failed to start screen sharing.')
      return null
    }
  }

  const createPeerConnection = async () => {
    try {
      const pc = new RTCPeerConnection(iceServers)
      pcRef.current = pc

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current)
        })
      }

      pc.ontrack = (event) => {
        console.log('🎥 Received remote track')
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0])
          setCallStatus('connected')
          setIsConnected(true)
          stopRingtones()
          clearRingTimer()
          startCallTimer()
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'webrtc-ice-candidate',
              candidate: event.candidate,
              to: remoteUserId,
              chatId,
            })
          )
        }
      }

      pc.onconnectionstatechange = () => {
        console.log('📶 Connection state:', pc.connectionState)
        switch (pc.connectionState) {
          case 'connected':
            setCallStatus('connected')
            setIsConnected(true)
            stopRingtones()
            clearRingTimer()
            startCallTimer()
            break
          case 'disconnected':
          case 'failed':
            handleEndCall()
            break
        }
      }

      pc.oniceconnectionstatechange = () => {
        console.log('🧊 ICE connection state:', pc.iceConnectionState)
        if (pc.iceConnectionState === 'connected') {
          setCallStatus('connected')
          setIsConnected(true)
          stopRingtones()
          clearRingTimer()
          startCallTimer()
        }
      }

      return pc
    } catch (error) {
      console.error('❌ Create peer connection error:', error)
      throw error
    }
  }

  const startCallTimer = () => {
    callStartTime.current = Date.now()
    durationInterval.current = setInterval(() => {
      if (callStartTime.current) {
        const elapsed = Math.floor((Date.now() - callStartTime.current) / 1000)
        setCallDuration(elapsed)
      }
    }, 1000)
  }

  const createOffer = async () => {
    try {
      if (!pcRef.current) {
        console.error('❌ Cannot create offer: No peer connection')
        return
      }

      if (!localStreamRef.current) {
        console.error('❌ Cannot create offer: No local stream')
        return
      }

      console.log('📞 Creating WebRTC offer...')

      const offer = await pcRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === 'video' || isScreenSharing,
      })

      console.log('📞 Setting local description...')
      await pcRef.current.setLocalDescription(offer)

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('📞 Sending offer to remote peer...')
        wsRef.current.send(
          JSON.stringify({
            type: 'webrtc-offer',
            offer,
            to: remoteUserId,
            chatId,
          })
        )
        console.log('✅ Offer sent successfully')
      } else {
        console.error('❌ Cannot send offer: WebSocket not open')
      }
    } catch (error) {
      console.error('❌ Create offer error:', error)
    }
  }
  const handleOffer = async (offer) => {
    try {
      if (!pcRef.current) {
        await createPeerConnection()
      }

      await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer))

      while (candidatesQueue.current.length > 0) {
        const candidate = candidatesQueue.current.shift()
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate))
      }

      const answer = await pcRef.current.createAnswer()
      await pcRef.current.setLocalDescription(answer)

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'webrtc-answer',
            answer,
            to: remoteUserId,
            chatId,
          })
        )
      }
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

  const handleNewICECandidate = async (candidate) => {
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

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current && callType === 'video') {
      const videoTracks = localStreamRef.current.getVideoTracks()
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsVideoEnabled(!isVideoEnabled)
    }
  }

  const switchCamera = async () => {
    if (Platform.OS === 'web' || !localStreamRef.current) return

    try {
      const videoTracks = localStreamRef.current.getVideoTracks()
      videoTracks.forEach((track) => track.stop())

      setIsFrontCamera(!isFrontCamera)

      const newStream = await getUserMedia()
      setLocalStream(newStream)
      localStreamRef.current = newStream

      if (pcRef.current) {
        const senders = pcRef.current.getSenders()
        const newVideoTrack = newStream.getVideoTracks()[0]
        const videoSender = senders.find(
          (sender) => sender.track && sender.track.kind === 'video'
        )

        if (videoSender && newVideoTrack) {
          await videoSender.replaceTrack(newVideoTrack)
        }
      }
    } catch (error) {
      console.error('❌ Switch camera error:', error)
      Alert.alert('Error', 'Failed to switch camera')
    }
  }

  const toggleScreenSharing = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Error', 'Screen sharing is not supported on mobile devices.')
      return
    }

    if (isScreenSharing) {
      stopScreenSharing()
    } else {
      const screenStream = await getScreenShareStream()
      if (!screenStream) return

      setIsScreenSharing(true)
      screenStreamRef.current = screenStream

      if (pcRef.current) {
        const senders = pcRef.current.getSenders()
        const videoTrack = screenStream.getVideoTracks()[0]
        const videoSender = senders.find(
          (sender) => sender.track && sender.track.kind === 'video'
        )

        if (videoSender) {
          await videoSender.replaceTrack(videoTrack)
        } else {
          pcRef.current.addTrack(videoTrack, screenStream)
        }

        await createOffer()

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'screen-sharing',
              enabled: true,
              to: remoteUserId,
              chatId,
            })
          )
        }
      }
    }
  }

  const stopScreenSharing = async () => {
    if (!isScreenSharing || !screenStreamRef.current) return

    screenStreamRef.current.getTracks().forEach((track) => track.stop())
    screenStreamRef.current = null
    setIsScreenSharing(false)

    if (callType === 'video') {
      const newStream = await getUserMedia()
      setLocalStream(newStream)
      localStreamRef.current = newStream

      if (pcRef.current) {
        const senders = pcRef.current.getSenders()
        const newVideoTrack = newStream.getVideoTracks()[0]
        const videoSender = senders.find(
          (sender) => sender.track && sender.track.kind === 'video'
        )

        if (videoSender && newVideoTrack) {
          await videoSender.replaceTrack(newVideoTrack)
        }

        await createOffer()
      }
    } else {
      if (pcRef.current) {
        const senders = pcRef.current.getSenders()
        const videoSender = senders.find(
          (sender) => sender.track && sender.track.kind === 'video'
        )
        if (videoSender) {
          pcRef.current.removeTrack(videoSender)
        }
        await createOffer()
      }
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'screen-sharing',
          enabled: false,
          to: remoteUserId,
          chatId,
        })
      )
    }
  }

  const cleanup = () => {
    console.log('🧹 Starting cleanup...')

    stopRingtones()
    clearRingTimer()

    if (durationInterval.current) {
      clearInterval(durationInterval.current)
      durationInterval.current = null
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop()
        console.log('🎥 Stopped track:', track.kind)
      })
      localStreamRef.current = null
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        track.stop()
        console.log('📺 Stopped screen share track')
      })
      screenStreamRef.current = null
    }

    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
      console.log('📞 Closed peer connection')
    }

    // Close WebSocket with proper code
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'Call ended')
        console.log('🔌 Closed call WebSocket')
      }
      wsRef.current = null
    }

    if (Platform.OS !== 'web') {
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: false,
      }).catch(console.error)
    }

    setLocalStream(null)
    setRemoteStream(null)
    setIsConnected(false)
    setIsScreenSharing(false)
    setCallWsConnected(false)

    console.log('✅ Cleanup complete')
  }
  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`
  }

  const renderLocalVideo = () => {
    if (!localStream && !screenStreamRef.current) return null

    if (Platform.OS === 'web') {
      const stream = isScreenSharing ? screenStreamRef.current : localStream
      return (
        <LocalVideoContainer>
          <video
            ref={(video) => {
              if (video && stream) {
                video.srcObject = stream
              }
            }}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform:
                isScreenSharing || !isFrontCamera ? 'none' : 'scaleX(-1)',
            }}
          />
        </LocalVideoContainer>
      )
    }

    if (!isVideoEnabled && !isScreenSharing) {
      return (
        <LocalVideoContainer>
          <LocalVideoPlaceholder>
            <Ionicons name="videocam-off" size={32} color="#666" />
          </LocalVideoPlaceholder>
        </LocalVideoContainer>
      )
    }

    const stream = isScreenSharing ? screenStreamRef.current : localStream
    return (
      <LocalVideoContainer>
        <Video
          source={{ uri: stream?.toURL?.() }}
          style={{
            width: '100%',
            height: '100%',
            transform:
              isScreenSharing || !isFrontCamera ? [] : [{ scaleX: -1 }],
          }}
          shouldPlay
          isMuted
          resizeMode="cover"
        />
      </LocalVideoContainer>
    )
  }

  const renderRemoteVideo = () => {
    if (!remoteStream || !isConnected) {
      return (
        <PlaceholderView>
          <PlaceholderAvatar>
            {remoteUserName?.[0]?.toUpperCase() || '?'}
          </PlaceholderAvatar>
          <PlaceholderText>
            {callStatus === 'ringing'
              ? isIncoming
                ? `${remoteUserName} is calling...`
                : `Calling ${remoteUserName}...`
              : callStatus === 'connecting'
              ? `Connecting to ${remoteUserName}...`
              : callStatus === 'connected'
              ? 'Waiting for video...'
              : callStatus}
          </PlaceholderText>
        </PlaceholderView>
      )
    }

    if (callType === 'voice') {
      return (
        <AudioCallView>
          <AvatarLarge>{remoteUserName?.[0]?.toUpperCase() || '?'}</AvatarLarge>
          <CallerName>{remoteUserName}</CallerName>
          <CallTimer>{formatCallDuration(callDuration)}</CallTimer>
        </AudioCallView>
      )
    }

    if (Platform.OS === 'web') {
      return (
        <video
          ref={(video) => {
            if (video && remoteStream) {
              video.srcObject = remoteStream
            }
          }}
          autoPlay
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#f5f5f5',
          }}
        />
      )
    }

    return (
      <Video
        source={{ uri: remoteStream.toURL() }}
        style={{ width: '100%', height: '100%' }}
        shouldPlay
        resizeMode="cover"
      />
    )
  }

  if (isIncoming && !callAnswered) {
    return (
      <Container>
        <IncomingCallView>
          <IncomingAvatar>
            {remoteUserName?.[0]?.toUpperCase() || '?'}
          </IncomingAvatar>
          <IncomingCallerName>{remoteUserName}</IncomingCallerName>
          <IncomingCallType>
            {callType === 'video' ? 'Video Call' : 'Voice Call'}
          </IncomingCallType>

          <IncomingCallActions>
            {/* ✅ Changed from handleEndCall to handleRejectCall */}
            <DeclineButton onPress={handleRejectCall}>
              <Ionicons name="close" size={36} color="#fff" />
            </DeclineButton>
            <AcceptButton onPress={handleAnswerCall}>
              <Ionicons name="call" size={36} color="#fff" />
            </AcceptButton>
          </IncomingCallActions>
        </IncomingCallView>
      </Container>
    )
  }
  return (
    <Container>
      <Header>
        <BackButton onPress={handleEndCall}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </BackButton>
        <HeaderInfo>
          <Title>{remoteUserName || 'Unknown'}</Title>
          <CallStatusText>
            {isConnected ? formatCallDuration(callDuration) : callStatus}
          </CallStatusText>
        </HeaderInfo>
        {callType === 'video' && Platform.OS !== 'web' && (
          <IconButton onPress={switchCamera}>
            <Ionicons name="camera-reverse" size={24} color="#333" />
          </IconButton>
        )}
      </Header>

      <VideoContainer>
        <RemoteVideoWrapper>{renderRemoteVideo()}</RemoteVideoWrapper>
        {callType === 'video' && renderLocalVideo()}
      </VideoContainer>

      <Controls>
        <ControlButton onPress={toggleMute} active={isMuted}>
          <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={28} color="#333" />
        </ControlButton>

        {callType === 'video' && Platform.OS === 'web' && (
          <ControlButton onPress={toggleScreenSharing} active={isScreenSharing}>
            <Ionicons
              name={isScreenSharing ? 'stop-circle' : 'share'}
              size={28}
              color="#333"
            />
          </ControlButton>
        )}

        <EndCallButton onPress={handleEndCall}>
          <Ionicons name="call" size={28} color="#fff" />
        </EndCallButton>

        {callType === 'video' && (
          <ControlButton onPress={toggleVideo} active={!isVideoEnabled}>
            <Ionicons
              name={isVideoEnabled ? 'videocam' : 'videocam-off'}
              size={28}
              color="#333"
            />
          </ControlButton>
        )}

        <ControlButton>
          <Ionicons name="volume-high" size={28} color="#333" />
        </ControlButton>
      </Controls>
    </Container>
  )
}

// Styled Components - Light Theme
const Container = styled.View`
  flex: 1;
  background-color: #f5f5f5;
`

const Header = styled.View`
  padding-top: ${Platform.OS === 'ios' ? '50px' : '30px'};
  padding-horizontal: 20px;
  padding-bottom: 20px;
  flex-direction: row;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.95);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  border-bottom-width: 1px;
  border-bottom-color: #e0e0e0;
`

const BackButton = styled.TouchableOpacity`
  padding: 10px;
  margin-right: 10px;
`

const HeaderInfo = styled.View`
  flex: 1;
`

const Title = styled.Text`
  color: #333;
  font-size: 18px;
  font-weight: bold;
`

const CallStatusText = styled.Text`
  color: #666;
  font-size: 14px;
  margin-top: 2px;
`

const IconButton = styled.TouchableOpacity`
  padding: 10px;
`

const VideoContainer = styled.View`
  flex: 1;
`

const RemoteVideoWrapper = styled.View`
  flex: 1;
  background-color: #f5f5f5;
`

const LocalVideoContainer = styled.View`
  position: absolute;
  top: ${Platform.OS === 'ios' ? '100px' : '80px'};
  right: 20px;
  width: 120px;
  height: 160px;
  border-radius: 12px;
  overflow: hidden;
  background-color: #e0e0e0;
  border-width: 2px;
  border-color: #fff;
  z-index: 5;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.25;
  shadow-radius: 3.84px;
  elevation: 5;
`

const PlaceholderView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
`

const PlaceholderAvatar = styled.Text`
  font-size: 80px;
  color: #fff;
  background-color: #4caf50;
  width: 120px;
  height: 120px;
  border-radius: 60px;
  text-align: center;
  line-height: 120px;
  margin-bottom: 20px;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 4.65px;
  elevation: 8;
`

const PlaceholderText = styled.Text`
  color: #666;
  font-size: 16px;
  text-align: center;
`

const AudioCallView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
`

const AvatarLarge = styled.Text`
  font-size: 100px;
  color: #fff;
  background-color: #4caf50;
  width: 180px;
  height: 180px;
  border-radius: 90px;
  text-align: center;
  line-height: 180px;
  margin-bottom: 30px;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 4.65px;
  elevation: 8;
`

const CallerName = styled.Text`
  color: #333;
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 10px;
`

const CallTimer = styled.Text`
  color: #666;
  font-size: 18px;
`

const Controls = styled.View`
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  padding: 20px;
  padding-bottom: ${Platform.OS === 'ios' ? '40px' : '20px'};
  background-color: rgba(255, 255, 255, 0.95);
  border-top-width: 1px;
  border-top-color: #e0e0e0;
`

const ControlButton = styled.TouchableOpacity`
  background-color: ${(props) => (props.active ? '#e0e0e0' : '#fff')};
  width: 60px;
  height: 60px;
  border-radius: 30px;
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-color: #e0e0e0;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3.84px;
  elevation: 3;
`

const EndCallButton = styled.TouchableOpacity`
  background-color: #f44336;
  width: 70px;
  height: 70px;
  border-radius: 35px;
  justify-content: center;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 4.65px;
  elevation: 8;
`

const LocalVideoPlaceholder = styled.View`
  width: 100%;
  height: 100%;
  background-color: #e0e0e0;
  justify-content: center;
  align-items: center;
`

// Incoming Call Styles
const IncomingCallView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-color: #667eea;
  padding: 40px;
`

const IncomingAvatar = styled.Text`
  font-size: 120px;
  color: #fff;
  background-color: rgba(255, 255, 255, 0.2);
  width: 200px;
  height: 200px;
  border-radius: 100px;
  text-align: center;
  line-height: 200px;
  margin-bottom: 30px;
  border-width: 4px;
  border-color: rgba(255, 255, 255, 0.3);
`

const IncomingCallerName = styled.Text`
  color: #fff;
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
`

const IncomingCallType = styled.Text`
  color: rgba(255, 255, 255, 0.9);
  font-size: 18px;
  margin-bottom: 60px;
  text-align: center;
`

const IncomingCallActions = styled.View`
  flex-direction: row;
  justify-content: space-around;
  width: 100%;
  max-width: 300px;
  margin-top: 40px;
`

const DeclineButton = styled.TouchableOpacity`
  background-color: #f44336;
  width: 80px;
  height: 80px;
  border-radius: 40px;
  justify-content: center;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 4.65px;
  elevation: 8;
`

const AcceptButton = styled.TouchableOpacity`
  background-color: #4caf50;
  width: 80px;
  height: 80px;
  border-radius: 40px;
  justify-content: center;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 4.65px;
  elevation: 8;
`

export default CallScreen
