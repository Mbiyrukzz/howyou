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
import { Audio } from 'expo-audio'
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
  // For React Native, you'll need react-native-webrtc
  const WebRTC = require('react-native-webrtc')
  RTCPeerConnection = WebRTC.RTCPeerConnection
  RTCSessionDescription = WebRTC.RTCSessionDescription
  RTCIceCandidate = WebRTC.RTCIceCandidate
  mediaDevices = WebRTC.mediaDevices
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

// WebSocket connection
const SIGNALING_URL = 'ws://10.172.194.87:5000'

// WebRTC configuration
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // Add TURN server for production
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'username',
    //   credential: 'password'
    // }
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
  } = route.params || {}

  // State management
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [callStatus, setCallStatus] = useState('connecting')
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video')
  const [isFrontCamera, setIsFrontCamera] = useState(true)
  const [callDuration, setCallDuration] = useState(0)
  const [isConnected, setIsConnected] = useState(false)

  // Refs
  const wsRef = useRef(null)
  const pcRef = useRef(null)
  const localStreamRef = useRef(null)
  const candidatesQueue = useRef([])
  const callStartTime = useRef(null)
  const durationInterval = useRef(null)

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user?.uid || !chatId) {
      console.warn(
        '🕓 Waiting for user or chatId before connecting WebSocket...'
      )
      return
    }

    const wsUrl = `${SIGNALING_URL}?userId=${user.uid}&chatId=${chatId}`
    console.log('🔌 Connecting WebSocket to:', wsUrl)

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('✅ WebSocket connected')
      ws.send(
        JSON.stringify({
          type: 'join-call',
          chatId,
          userId: user.uid,
        })
      )
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
      Alert.alert('Connection Error', 'Failed to connect to call server')
    }

    ws.onclose = () => {
      console.log('🔴 WebSocket disconnected')
    }

    return () => {
      ws.close()
    }
  }, [user?.uid, chatId])

  // Handle WebSocket messages
  const handleWebSocketMessage = async (data) => {
    switch (data.type) {
      case 'user-joined':
        if (data.userId !== user?.uid) {
          await createOffer()
        }
        break
      case 'webrtc-offer':
        if (data.from !== user?.uid) {
          await handleOffer(data.offer)
        }
        break
      case 'webrtc-answer':
        if (data.from !== user?.uid) {
          await handleAnswer(data.answer)
        }
        break
      case 'webrtc-ice-candidate':
        if (data.from !== user?.uid) {
          await handleNewICECandidate(data.candidate)
        }
        break
      case 'user-left':
        if (data.userId === remoteUserId) {
          handleEndCall()
        }
        break
      case 'call-ended':
        handleEndCall()
        break
    }
  }

  // Initialize media and WebRTC
  useEffect(() => {
    setupCall()

    // Handle back button
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
  }, [])

  const setupCall = async () => {
    try {
      // Request permissions
      await requestPermissions()

      // Get media stream
      const stream = await getUserMedia()
      setLocalStream(stream)
      localStreamRef.current = stream

      // Create peer connection
      await createPeerConnection()
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
      // Configure audio session
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

  const createPeerConnection = async () => {
    try {
      const pc = new RTCPeerConnection(iceServers)
      pcRef.current = pc

      // Add local stream tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current)
        })
      }

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('🎥 Received remote track')
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0])
          setCallStatus('connected')
          setIsConnected(true)
          startCallTimer()
        }
      }

      // Handle ICE candidates
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

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log('📶 Connection state:', pc.connectionState)
        switch (pc.connectionState) {
          case 'connected':
            setCallStatus('connected')
            setIsConnected(true)
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
        await createPeerConnection()
      }

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
          })
        )
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

      // Process queued ICE candidates
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

        // Process queued ICE candidates
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

      // Replace video track in peer connection
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

  const handleEndCall = useCallback(() => {
    console.log('🔴 Ending call')

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'end-call',
          chatId,
          userId: user?.uid,
        })
      )
    }

    cleanup()
    navigation.goBack()
  }, [chatId, user?.uid, navigation])

  const cleanup = () => {
    // Stop call timer
    if (durationInterval.current) {
      clearInterval(durationInterval.current)
      durationInterval.current = null
    }

    // Stop media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }

    // Close peer connection
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    // Reset audio session
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
  }

  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`
  }

  // Update the renderLocalVideo function in CallScreen.js

  const renderLocalVideo = () => {
    if (!localStream) return null

    // For web platform
    if (Platform.OS === 'web') {
      return (
        <LocalVideoContainer>
          <video
            ref={(video) => {
              if (video && localStream) {
                video.srcObject = localStream
              }
            }}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: isFrontCamera ? 'scaleX(-1)' : 'none', // Mirror front camera
            }}
          />
        </LocalVideoContainer>
      )
    }

    // For React Native
    if (!isVideoEnabled) {
      return (
        <LocalVideoContainer>
          <LocalVideoPlaceholder>
            <Ionicons name="videocam-off" size={32} color="#fff" />
          </LocalVideoPlaceholder>
        </LocalVideoContainer>
      )
    }

    return (
      <LocalVideoContainer>
        <Video
          source={{ uri: localStream.toURL() }}
          style={{
            width: '100%',
            height: '100%',
            transform: isFrontCamera ? [{ scaleX: -1 }] : [], // Mirror front camera
          }}
          shouldPlay
          isMuted
          resizeMode="cover"
        />
      </LocalVideoContainer>
    )
  }

  // Update renderRemoteVideo for web support
  const renderRemoteVideo = () => {
    // Show placeholder when not connected or no remote stream
    if (!remoteStream || !isConnected) {
      return (
        <PlaceholderView>
          <PlaceholderAvatar>
            {remoteUserName?.[0]?.toUpperCase() || '?'}
          </PlaceholderAvatar>
          <PlaceholderText>
            {callStatus === 'connecting'
              ? `Connecting to ${remoteUserName}...`
              : callStatus === 'connected'
              ? 'Waiting for video...'
              : callStatus}
          </PlaceholderText>
        </PlaceholderView>
      )
    }

    // For audio calls, show avatar even when connected
    if (callType === 'voice') {
      return (
        <AudioCallView>
          <AvatarLarge>{remoteUserName?.[0]?.toUpperCase() || '?'}</AvatarLarge>
          <CallerName>{remoteUserName}</CallerName>
          <CallTimer>{formatCallDuration(callDuration)}</CallTimer>
        </AudioCallView>
      )
    }

    // For web platform
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
            backgroundColor: '#000',
          }}
        />
      )
    }

    // For React Native
    return (
      <Video
        source={{ uri: remoteStream.toURL() }}
        style={{ width: '100%', height: '100%' }}
        shouldPlay
        resizeMode="cover"
      />
    )
  }

  return (
    <Container>
      <Header>
        <BackButton onPress={handleEndCall}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </BackButton>
        <HeaderInfo>
          <Title>{remoteUserName || 'Unknown'}</Title>
          <CallStatusText>
            {isConnected ? formatCallDuration(callDuration) : callStatus}
          </CallStatusText>
        </HeaderInfo>
        {callType === 'video' && Platform.OS !== 'web' && (
          <IconButton onPress={switchCamera}>
            <Ionicons name="camera-reverse" size={24} color="#fff" />
          </IconButton>
        )}
      </Header>

      <VideoContainer>
        {/* Remote video takes full screen */}
        <RemoteVideoWrapper>{renderRemoteVideo()}</RemoteVideoWrapper>

        {/* Local video in corner - ALWAYS show for video calls */}
        {callType === 'video' && renderLocalVideo()}
      </VideoContainer>

      <Controls>
        <ControlButton onPress={toggleMute} active={isMuted}>
          <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={28} color="#fff" />
        </ControlButton>

        <EndCallButton onPress={handleEndCall}>
          <Ionicons name="call" size={28} color="#fff" />
        </EndCallButton>

        {callType === 'video' && (
          <ControlButton onPress={toggleVideo} active={!isVideoEnabled}>
            <Ionicons
              name={isVideoEnabled ? 'videocam' : 'videocam-off'}
              size={28}
              color="#fff"
            />
          </ControlButton>
        )}

        <ControlButton>
          <Ionicons name="volume-high" size={28} color="#fff" />
        </ControlButton>
      </Controls>
    </Container>
  )
}

// Styled Components
const Container = styled.View`
  flex: 1;
  background-color: #1a1a1a;
`

const Header = styled.View`
  padding-top: ${Platform.OS === 'ios' ? '50px' : '30px'};
  padding-horizontal: 20px;
  padding-bottom: 20px;
  flex-direction: row;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
`

const BackButton = styled.TouchableOpacity`
  padding: 10px;
  margin-right: 10px;
`

const HeaderInfo = styled.View`
  flex: 1;
`

const Title = styled.Text`
  color: #fff;
  font-size: 18px;
  font-weight: bold;
`

const CallStatusText = styled.Text`
  color: #aaa;
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
  background-color: #000;
`

const LocalVideoContainer = styled.View`
  position: absolute;
  top: ${Platform.OS === 'ios' ? '100px' : '80px'};
  right: 20px;
  width: 120px;
  height: 160px;
  border-radius: 12px;
  overflow: hidden;
  background-color: #333;
  border-width: 2px;
  border-color: #fff;
  z-index: 5;
`

const PlaceholderView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: #1a1a1a;
`

const PlaceholderAvatar = styled.Text`
  font-size: 80px;
  color: #fff;
  background-color: #3498db;
  width: 120px;
  height: 120px;
  border-radius: 60px;
  text-align: center;
  line-height: 120px;
  margin-bottom: 20px;
`

const PlaceholderText = styled.Text`
  color: #aaa;
  font-size: 16px;
  text-align: center;
`

const AudioCallView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`

const AvatarLarge = styled.Text`
  font-size: 100px;
  color: #fff;
  background-color: #3498db;
  width: 180px;
  height: 180px;
  border-radius: 90px;
  text-align: center;
  line-height: 180px;
  margin-bottom: 30px;
`

const CallerName = styled.Text`
  color: #fff;
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 10px;
`

const CallTimer = styled.Text`
  color: #aaa;
  font-size: 18px;
`

const Controls = styled.View`
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  padding: 20px;
  padding-bottom: ${Platform.OS === 'ios' ? '40px' : '20px'};
  background-color: rgba(0, 0, 0, 0.8);
`

const ControlButton = styled.TouchableOpacity`
  background-color: ${(props) =>
    props.active ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
  width: 60px;
  height: 60px;
  border-radius: 30px;
  justify-content: center;
  align-items: center;
`

const EndCallButton = styled.TouchableOpacity`
  background-color: #e74c3c;
  width: 70px;
  height: 70px;
  border-radius: 35px;
  justify-content: center;
  align-items: center;
`
const LocalVideoPlaceholder = styled.View`
  width: 100%;
  height: 100%;
  background-color: #333;
  justify-content: center;
  align-items: center;
`
export default CallScreen
