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
import { Video } from 'expo-av'
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
  var { RTCView } = WebRTC
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

const SIGNALING_URL =
  Platform.OS === 'web' ? 'ws://localhost:5000' : 'ws://10.225.164.87:5000'
const RING_TIMEOUT = 40000

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
  const setupInProgress = useRef(false)
  const isCleaningUp = useRef(false)

  // =================== RINGTONES ===================
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
      stopRingtones()
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
      isRingtonesSetup.current = false
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

  // =================== CALL HANDLERS ===================
  const handleRejectCall = useCallback(async () => {
    console.log('📵 User rejecting call...')

    stopRingtones()
    clearRingTimer()

    try {
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

    setTimeout(() => {
      navigation.goBack()
    }, 100)
  }, [chatId, user?.uid, remoteUserId, callAnswered, navigation])

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
  }, [chatId, user?.uid, remoteUserId, navigation])

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
  }

  const handleAnswerCall = async () => {
    console.log('📞 ANSWERER: User answering call...')

    stopRingtones()
    clearRingTimer()
    setCallAnswered(true)
    setCallStatus('connecting')

    try {
      console.log('📡 ANSWERER: Notifying backend of call acceptance...')
      const response = await fetch(
        `http://10.225.164.87:5000/answer-call/${route.params?.callId}`,
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

      console.log('✅ Backend notified successfully')
      console.log('📹 ANSWERER: Setting up media...')

      // Setup will happen in the useEffect
    } catch (error) {
      console.error('❌ Error answering call:', error)
      Alert.alert('Error', 'Failed to answer call')
      navigation.goBack()
    }
  }

  // =================== SETUP CALL - SINGLE EFFECT ===================
  useEffect(() => {
    // ✅ ONLY setup if we should (not incoming OR already answered)
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

    return () => {
      backHandler.remove()
    }
  }, [callAnswered, isIncoming])

  const setupCall = async () => {
    if (setupInProgress.current) {
      console.log('⚠️ Setup already in progress, skipping')
      return
    }

    setupInProgress.current = true
    console.log('🎬 Starting call setup...')

    try {
      await requestPermissions()
      const stream = await getUserMedia()

      setLocalStream(stream)
      localStreamRef.current = stream

      // ✅ Wait a moment for state to settle
      await new Promise((resolve) => setTimeout(resolve, 300))

      await createPeerConnection()

      console.log('✅ Call setup complete')
    } catch (error) {
      console.error('❌ Setup call error:', error)
      Alert.alert(
        'Setup Error',
        'Failed to initialize call. Please check permissions.',
        [{ text: 'OK', onPress: handleEndCall }]
      )
    } finally {
      setupInProgress.current = false
    }
  }

  // =================== WEBSOCKET CONNECTION ===================
  useEffect(() => {
    if (!user?.uid || !chatId) {
      console.warn('🕓 Waiting for user or chatId...')
      return
    }

    const wsUrl = `${SIGNALING_URL}/signaling?userId=${user.uid}&chatId=${chatId}`
    console.log('🔌 Connecting WebSocket:', wsUrl)

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    let intentionalClose = false

    ws.onopen = () => {
      console.log('✅ WebSocket connected')
      setCallWsConnected(true)

      ws.send(
        JSON.stringify({
          type: 'join-call',
          chatId,
          userId: user.uid,
        })
      )

      console.log('👤 Joined as:', isIncoming ? 'ANSWERER' : 'CALLER')
    }

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data)
        await handleWebSocketMessage(data)
      } catch (error) {
        console.error('❌ WebSocket message error:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error)
      setCallWsConnected(false)
    }

    ws.onclose = (event) => {
      console.log('🔴 WebSocket disconnected:', event.code)
      setCallWsConnected(false)

      if (!intentionalClose && event.code !== 1000 && event.code !== 1006) {
        Alert.alert('Connection Lost', 'Call connection was lost.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ])
      }
    }

    return () => {
      console.log('🧹 Cleaning up WebSocket')
      intentionalClose = true
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close(1000, 'Component unmount')
      }
    }
  }, [user?.uid, chatId, navigation, isIncoming])

  const handleWebSocketMessage = async (data) => {
    console.log('📨 Received:', data.type)

    switch (data.type) {
      case 'user-joined':
      case 'user-already-in-room':
        if (data.userId !== user?.uid) {
          console.log('👤 Remote user ready:', data.userId)
          stopRingtones()
          clearRingTimer()

          // ✅ ONLY caller creates offer, and ONLY after ensuring setup is complete
          if (!isIncoming) {
            console.log('📞 CALLER: Will create offer...')

            // Wait for setup to complete
            const waitForSetup = setInterval(() => {
              if (
                !setupInProgress.current &&
                pcRef.current &&
                localStreamRef.current
              ) {
                clearInterval(waitForSetup)

                setTimeout(async () => {
                  if (pcRef.current && !pcRef.current.localDescription) {
                    console.log('📞 Creating offer now...')
                    await createOffer()
                  }
                }, 500)
              }
            }, 100)

            // Timeout after 5 seconds
            setTimeout(() => clearInterval(waitForSetup), 5000)
          }
        }
        break

      case 'webrtc-offer':
        if (data.from !== user?.uid) {
          console.log('📞 ANSWERER: Received offer')
          await handleOffer(data.offer)
        }
        break

      case 'webrtc-answer':
        if (data.from !== user?.uid) {
          console.log('📞 CALLER: Received answer')
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
        } else if (data.reason === 'rejected') {
          endMessage = 'Call was declined'
        } else if (data.reason === 'user_ended') {
          endMessage = 'Call ended by other user'
        }

        Alert.alert(
          'Call Ended',
          endMessage,
          [{ text: 'OK', onPress: () => navigation.goBack() }],
          { cancelable: false }
        )
        break
    }
  }

  // =================== WEBRTC FUNCTIONS ===================
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
        console.log('🎤 Track:', track.kind, 'enabled:', track.enabled)
        track.enabled = true
      })

      return stream
    } catch (error) {
      console.error('❌ getUserMedia error:', error)
      throw error
    }
  }

  const createPeerConnection = async () => {
    try {
      const pc = new RTCPeerConnection(iceServers)
      pcRef.current = pc

      // ✅ Add tracks
      if (localStreamRef.current) {
        const tracks = localStreamRef.current.getTracks()
        console.log('🎤 Adding tracks:', tracks.length)

        tracks.forEach((track) => {
          console.log('🎤 Adding:', track.kind)
          pc.addTrack(track, localStreamRef.current)
        })
      }

      // ✅ Handle remote tracks
      pc.ontrack = (event) => {
        console.log('🎥 Received remote track:', event.track.kind)

        if (event.streams && event.streams[0]) {
          console.log('📺 Setting remote stream')
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

        if (pc.connectionState === 'connected') {
          setCallStatus('connected')
          setIsConnected(true)
          stopRingtones()
          clearRingTimer()
          startCallTimer()
        } else if (pc.connectionState === 'failed') {
          Alert.alert(
            'Connection Failed',
            'Unable to establish call connection.',
            [{ text: 'OK', onPress: handleEndCall }]
          )
        }
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

  const createOffer = async () => {
    try {
      if (!pcRef.current || !localStreamRef.current) {
        console.error('❌ Cannot create offer: missing pc or stream')
        return
      }

      const senders = pcRef.current.getSenders()
      console.log('📡 Senders:', senders.length)

      const offer = await pcRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === 'video',
      })

      await pcRef.current.setLocalDescription(offer)

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'webrtc-offer',
            offer,
            to: remoteUserId,
            chatId,
            from: user?.uid,
          })
        )
        console.log('✅ Offer sent')
      }
    } catch (error) {
      console.error('❌ Create offer error:', error)
    }
  }

  const handleOffer = async (offer) => {
    try {
      console.log('📞 ANSWERER: Handling offer')

      if (!pcRef.current) {
        console.error('❌ No peer connection')
        return
      }

      await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer))

      // Process queued candidates
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
            from: user?.uid,
          })
        )
        console.log('✅ Answer sent')
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

  // =================== CONTROLS ===================
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

  const startCallTimer = () => {
    callStartTime.current = Date.now()
    durationInterval.current = setInterval(() => {
      if (callStartTime.current) {
        const elapsed = Math.floor((Date.now() - callStartTime.current) / 1000)
        setCallDuration(elapsed)
      }
    }, 1000)
  }

  // =================== CLEANUP ===================
  const cleanup = () => {
    if (isCleaningUp.current) {
      console.log('⚠️ Cleanup already in progress')
      return
    }

    isCleaningUp.current = true
    console.log('🧹 Starting cleanup...')

    stopRingtones()
    clearRingTimer()

    if (durationInterval.current) {
      clearInterval(durationInterval.current)
      durationInterval.current = null
    }

    // ✅ Stop all tracks BEFORE closing peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop()
        console.log('🎥 Stopped track:', track.kind)
      })
      localStreamRef.current = null
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop())
      screenStreamRef.current = null
    }

    // ✅ Close peer connection AFTER stopping tracks
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
      console.log('📞 Closed peer connection')
    }

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'Call ended')
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

    setupInProgress.current = false
    isCleaningUp.current = false

    console.log('✅ Cleanup complete')
  }

  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`
  }

  // =================== NAVIGATION GUARD ===================
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (isConnected && callStatus === 'connected') {
        e.preventDefault()

        Alert.alert('End Call', 'Are you sure you want to end this call?', [
          { text: "Don't end", style: 'cancel' },
          {
            text: 'End Call',
            style: 'destructive',
            onPress: () => {
              handleEndCall()
              setTimeout(() => {
                navigation.dispatch(e.data.action)
              }, 100)
            },
          },
        ])
      } else {
        cleanup()
      }
    })

    return unsubscribe
  }, [navigation, isConnected, callStatus])

  // =================== RENDER FUNCTIONS ===================
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

    if (Platform.OS === 'android') {
      const stream = isScreenSharing ? screenStreamRef.current : localStream
      if (!stream) return null

      return (
        <LocalVideoContainer>
          <RTCView
            streamURL={stream.toURL()}
            style={{ width: '100%', height: '100%' }}
            objectFit="cover"
            mirror={callType === 'video' && isFrontCamera}
            zOrder={1}
          />
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
    console.log('🎬 renderRemoteVideo:', {
      hasRemoteStream: !!remoteStream,
      isConnected,
      callType,
    })

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
              : 'Waiting for video...'}
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

    if (Platform.OS === 'android') {
      return (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
          objectFit="cover"
          mirror={false}
          zOrder={0}
        />
      )
    }

    if (Platform.OS === 'ios') {
      return (
        <Video
          source={{ uri: remoteStream.toURL() }}
          style={{ width: '100%', height: '100%' }}
          shouldPlay
          isMuted={false}
          resizeMode="cover"
          useNativeControls={false}
        />
      )
    }

    return (
      <video
        ref={(video) => {
          if (video && remoteStream) {
            video.srcObject = remoteStream
          }
        }}
        autoPlay
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    )
  }

  // =================== MAIN RENDER ===================
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

// =================== STYLED COMPONENTS ===================
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
