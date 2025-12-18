import { useRef, useState, useCallback } from 'react'
import { Platform, Alert, Vibration } from 'react-native'
import * as ScreenCapture from 'expo-screen-capture'
import { Audio } from 'expo-av'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'

const API_URL = process.env.EXPO_PUBLIC_API_URL

export function useExpoWebRTC(
  callType,
  isFrontCamera,
  sendMessage,
  handleRemoteStream,
  handleConnectionStateChange
) {
  // Refs
  const pcRef = useRef(null)
  const localStreamRef = useRef(null)
  const screenStreamRef = useRef(null)
  const remoteStreamRef = useRef(null)
  const dataChannelRef = useRef(null)
  const screenCaptureIntervalRef = useRef(null)
  const chatIdRef = useRef(null)

  // State
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [screenStream, setScreenStream] = useState(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video')
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [screenSharingType, setScreenSharingType] = useState(null) // 'video' or 'image'
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false)

  // Configuration
  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: 'turn:turn.example.com:3478',
        username: 'username',
        credential: 'password',
      },
    ],
    iceCandidatePoolSize: 10,
  }

  // Initialize audio session
  const initializeAudio = useCallback(async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      })
      console.log('✅ Audio session configured')
    } catch (error) {
      console.error('❌ Failed to configure audio:', error)
    }
  }, [])

  // Get user media for Expo
  const getExpoUserMedia = useCallback(async (constraints) => {
    try {
      if (Platform.OS === 'web') {
        // Web platform - use browser APIs
        return await navigator.mediaDevices.getUserMedia(constraints)
      } else {
        // Mobile platform - we'll use expo-av
        const { Camera } = await import('expo-camera')

        // Request permissions
        const { status: cameraStatus } =
          await Camera.requestCameraPermissionsAsync()
        const { status: audioStatus } = await Audio.requestPermissionsAsync()

        if (cameraStatus !== 'granted' || audioStatus !== 'granted') {
          throw new Error('Camera and microphone permissions are required')
        }

        // For mobile, we'll create a different approach
        // This is a simplified version - in production you'd use react-native-webrtc
        console.log('📱 Mobile media access - using fallback approach')

        // Return null for now - actual implementation would use react-native-webrtc
        return null
      }
    } catch (error) {
      console.error('Error getting user media:', error)
      throw error
    }
  }, [])

  // Create offer
  const createOffer = useCallback(
    async (remoteUserId, chatId, userId) => {
      try {
        if (!pcRef.current) {
          throw new Error('Peer connection not initialized')
        }

        console.log('📤 Creating offer...')

        const offerOptions = {
          offerToReceiveAudio: true,
          offerToReceiveVideo: callType === 'video',
        }

        const offer = await pcRef.current.createOffer(offerOptions)
        await pcRef.current.setLocalDescription(offer)

        sendMessage({
          type: 'webrtc-offer',
          to: remoteUserId,
          offer: offer,
          chatId,
        })

        console.log('✅ Offer created and sent')
        return offer
      } catch (error) {
        console.error('❌ Failed to create offer:', error)
        throw error
      }
    },
    [callType, sendMessage]
  )

  // Handle offer
  const handleOffer = useCallback(
    async (offer, remoteUserId, chatId, userId) => {
      try {
        if (!pcRef.current) {
          throw new Error('Peer connection not initialized')
        }

        console.log('📥 Setting remote description (offer)...')

        // Ensure we have a proper RTCSessionDescription
        let remoteDescription
        if (Platform.OS === 'web') {
          remoteDescription = new RTCSessionDescription(offer)
        } else {
          // For React Native, create a plain object
          remoteDescription = offer
        }

        await pcRef.current.setRemoteDescription(remoteDescription)

        console.log('📤 Creating answer...')
        const answer = await pcRef.current.createAnswer()
        await pcRef.current.setLocalDescription(answer)

        sendMessage({
          type: 'webrtc-answer',
          to: remoteUserId,
          answer: answer,
          chatId,
        })

        console.log('✅ Answer created and sent')
      } catch (error) {
        console.error('❌ Failed to handle offer:', error)
        throw error
      }
    },
    [sendMessage]
  )

  // Handle answer
  const handleAnswer = useCallback(async (answer) => {
    try {
      if (!pcRef.current) {
        throw new Error('Peer connection not initialized')
      }

      console.log('📥 Setting remote description (answer)...')

      let remoteDescription
      if (Platform.OS === 'web') {
        remoteDescription = new RTCSessionDescription(answer)
      } else {
        remoteDescription = answer
      }

      await pcRef.current.setRemoteDescription(remoteDescription)
      console.log('✅ Remote description set')
    } catch (error) {
      console.error('❌ Failed to handle answer:', error)
      throw error
    }
  }, [])

  // Handle ICE candidate
  const handleICECandidate = useCallback(async (candidate) => {
    try {
      if (!pcRef.current) {
        console.warn('⚠️ Peer connection not ready for ICE candidate')
        return
      }

      let iceCandidate
      if (Platform.OS === 'web') {
        iceCandidate = new RTCIceCandidate(candidate)
      } else {
        iceCandidate = candidate
      }

      await pcRef.current.addIceCandidate(iceCandidate)
      console.log('✅ ICE candidate added')
    } catch (error) {
      console.error('❌ Failed to add ICE candidate:', error)
    }
  }, [])

  // Screen sharing for Web platform
  const startWebScreenShare = useCallback(async () => {
    try {
      if (Platform.OS !== 'web') {
        throw new Error('Web screen sharing only available on web platform')
      }

      // Request screen sharing permission
      const displayMediaOptions = {
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
          frameRate: 15,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false, // Screen sharing typically doesn't include audio
      }

      const stream = await navigator.mediaDevices.getDisplayMedia(
        displayMediaOptions
      )
      screenStreamRef.current = stream
      setScreenStream(stream)

      // Replace video track with screen share
      const senders = pcRef.current?.getSenders() || []
      const videoSender = senders.find((s) => s.track?.kind === 'video')

      if (videoSender && stream.getVideoTracks()[0]) {
        await videoSender.replaceTrack(stream.getVideoTracks()[0])
      }

      // Handle when user stops screen sharing via browser UI
      stream.getVideoTracks()[0].onended = () => {
        stopScreenSharing()
      }

      setScreenSharingType('video')
      return stream
    } catch (error) {
      console.error('Failed to start web screen sharing:', error)
      throw error
    }
  }, [])

  // Start mobile screen sharing (screenshot method)
  const startMobileScreenSharing = useCallback(async (chatId) => {
    try {
      // Request permissions
      const { status } = await ScreenCapture.requestPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Screen capture permission is required for screen sharing.'
        )
        throw new Error('Permission denied')
      }

      // Prevent screen capture (we want to control it)
      await ScreenCapture.preventScreenCaptureAsync()

      // Store chatId for later use
      chatIdRef.current = chatId

      setScreenSharingType('image')
      return true
    } catch (error) {
      console.error('Failed to start mobile screen sharing:', error)
      throw error
    }
  }, [])

  // Take screenshot for sharing
  const takeScreenshot = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        // Web screenshot
        const canvas = document.createElement('canvas')
        const video = document.querySelector('video')

        if (!video) return null

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        return canvas.toDataURL('image/jpeg', 0.7).split(',')[1] // Return base64 without prefix
      } else {
        // Mobile screenshot - using expo
        const result = await ScreenCapture.takeScreenshotAsync({
          quality: 0.7,
          format: 'jpeg',
        })

        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(result.uri, {
          encoding: FileSystem.EncodingType.Base64,
        })

        return base64
      }
    } catch (error) {
      console.error('Failed to take screenshot:', error)
      return null
    }
  }, [])

  // Share document/image
  const shareDocument = useCallback(async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Media library permission is required to share documents.'
        )
        return
      }

      // Pick an image/document
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]

        // Send via data channel
        if (dataChannelRef.current?.readyState === 'open') {
          const message = {
            type: 'document-share',
            fileName: asset.fileName || `document_${Date.now()}`,
            mimeType: asset.mimeType || 'image/jpeg',
            data: asset.base64,
            timestamp: Date.now(),
          }

          dataChannelRef.current.send(JSON.stringify(message))

          // Also notify via WebSocket
          sendMessage({
            type: 'document-shared',
            fileName: message.fileName,
            mimeType: message.mimeType,
            timestamp: message.timestamp,
            chatId: chatIdRef.current,
          })

          Alert.alert('Success', 'Document shared successfully')
        } else {
          Alert.alert('Error', 'Data channel not available')
        }
      }
    } catch (error) {
      console.error('Failed to share document:', error)
      Alert.alert('Error', 'Failed to share document')
    }
  }, [sendMessage])

  // Stop screen sharing
  const stopScreenSharing = useCallback(async () => {
    try {
      if (Platform.OS === 'web' && screenStreamRef.current) {
        // Stop web screen sharing
        screenStreamRef.current.getTracks().forEach((track) => track.stop())
        screenStreamRef.current = null
        setScreenStream(null)

        // Switch back to camera
        if (localStreamRef.current && pcRef.current) {
          const senders = pcRef.current.getSenders() || []
          const videoSender = senders.find((s) => s.track?.kind === 'video')

          if (videoSender && localStreamRef.current.getVideoTracks()[0]) {
            await videoSender.replaceTrack(
              localStreamRef.current.getVideoTracks()[0]
            )
          }
        }
      } else if (Platform.OS !== 'web') {
        // Stop mobile screen sharing
        if (screenCaptureIntervalRef.current) {
          clearInterval(screenCaptureIntervalRef.current)
          screenCaptureIntervalRef.current = null
        }

        await ScreenCapture.allowScreenCaptureAsync()
      }

      // Notify other participant
      if (chatIdRef.current) {
        sendMessage({
          type: 'screen-sharing',
          enabled: false,
          chatId: chatIdRef.current,
        })
      }

      setIsScreenSharing(false)
      setScreenSharingType(null)
      chatIdRef.current = null
      console.log('✅ Screen sharing stopped')
    } catch (error) {
      console.error('❌ Failed to stop screen sharing:', error)
    }
  }, [sendMessage])

  // Toggle screen sharing
  const toggleScreenShare = useCallback(
    async (chatId) => {
      try {
        Vibration.vibrate(50)

        if (isScreenSharing) {
          await stopScreenSharing()
          return false
        } else {
          if (Platform.OS === 'web') {
            const stream = await startWebScreenShare()
            setIsScreenSharing(true)

            // Notify other participant
            sendMessage({
              type: 'screen-sharing',
              enabled: true,
              chatId,
            })

            return true
          } else {
            // Mobile - show options
            Alert.alert('Screen Sharing', 'Choose sharing method:', [
              {
                text: 'Share Document/Image',
                onPress: async () => {
                  await shareDocument()
                },
              },
              {
                text: 'Cancel',
                style: 'cancel',
              },
            ])
            return false
          }
        }
      } catch (error) {
        console.error('❌ Failed to toggle screen share:', error)
        Alert.alert(
          'Screen Share Error',
          error.message || 'Failed to start screen sharing'
        )
        return isScreenSharing
      }
    },
    [
      isScreenSharing,
      stopScreenSharing,
      startWebScreenShare,
      shareDocument,
      sendMessage,
    ]
  )

  // Initialize media for Expo
  const initializeMedia = useCallback(async () => {
    try {
      await initializeAudio()

      if (Platform.OS === 'web') {
        // Web platform
        const constraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video:
            callType === 'video'
              ? {
                  facingMode: isFrontCamera ? 'user' : 'environment',
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                  frameRate: { ideal: 30 },
                }
              : false,
        }

        const stream = await getExpoUserMedia(constraints)
        localStreamRef.current = stream
        setLocalStream(stream)

        // Set initial track states
        const audioTrack = stream.getAudioTracks()[0]
        const videoTrack = stream.getVideoTracks()[0]

        if (audioTrack) setIsMuted(!audioTrack.enabled)
        if (videoTrack) setIsVideoEnabled(videoTrack.enabled)

        console.log('✅ Web media initialized')
        return stream
      } else {
        // Mobile platform
        console.log('📱 Mobile media initialization - WebRTC setup required')
        // Note: For actual mobile implementation, you need react-native-webrtc
        return null
      }
    } catch (error) {
      console.error('❌ Failed to initialize media:', error)
      throw error
    }
  }, [callType, isFrontCamera, initializeAudio, getExpoUserMedia])

  // Create peer connection
  const createPeerConnection = useCallback(
    async (remoteUserId, chatId, userId) => {
      try {
        if (pcRef.current) {
          console.log('⚠️ Peer connection already exists')
          return pcRef.current
        }

        console.log('🔗 Creating peer connection...')

        let RTCPeerConnection
        if (Platform.OS === 'web') {
          RTCPeerConnection = window.RTCPeerConnection
        } else {
          // For React Native with react-native-webrtc
          try {
            const WebRTC = await import('react-native-webrtc')
            RTCPeerConnection = WebRTC.RTCPeerConnection
          } catch (error) {
            console.error('react-native-webrtc not installed')
            throw new Error(
              'WebRTC not available on mobile. Please install react-native-webrtc.'
            )
          }
        }

        if (!RTCPeerConnection) {
          throw new Error('WebRTC not supported on this platform')
        }

        const pc = new RTCPeerConnection(configuration)

        // Add local stream tracks
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => {
            pc.addTrack(track, localStreamRef.current)
          })
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            console.log('🧊 Sending ICE candidate:', event.candidate)
            sendMessage({
              type: 'webrtc-ice-candidate',
              to: remoteUserId,
              candidate: event.candidate,
              chatId,
            })
          }
        }

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
          console.log('🔗 Connection state:', pc.connectionState)
          handleConnectionStateChange(pc.connectionState)

          if (pc.connectionState === 'connected') {
            console.log('✅ Peer connection established!')
          } else if (pc.connectionState === 'failed') {
            console.error('❌ Peer connection failed')
          }
        }

        // Handle ICE connection state
        pc.oniceconnectionstatechange = () => {
          console.log('🧊 ICE connection state:', pc.iceConnectionState)
        }

        // Handle signaling state
        pc.onsignalingstatechange = () => {
          console.log('📡 Signaling state:', pc.signalingState)
        }

        // Handle track events
        pc.ontrack = (event) => {
          console.log('📹 Received remote track:', event.track.kind)

          if (!remoteStreamRef.current) {
            if (Platform.OS === 'web') {
              remoteStreamRef.current = new MediaStream()
            } else {
              const WebRTC = require('react-native-webrtc')
              remoteStreamRef.current = new WebRTC.MediaStream()
            }
            setRemoteStream(remoteStreamRef.current)
          }

          remoteStreamRef.current.addTrack(event.track)
          handleRemoteStream(remoteStreamRef.current)
        }

        // Create data channel for messaging
        dataChannelRef.current = pc.createDataChannel('chat', {
          ordered: true,
          maxRetransmits: 3,
        })

        dataChannelRef.current.onopen = () => {
          console.log('📨 Data channel opened')

          // Send initial metadata
          dataChannelRef.current.send(
            JSON.stringify({
              type: 'metadata',
              platform: Platform.OS,
              timestamp: Date.now(),
            })
          )
        }

        dataChannelRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('📨 Data channel message:', data.type)

            switch (data.type) {
              case 'screenshot-update':
                console.log('Received screenshot update')
                break
              case 'document-share':
                console.log('Received document:', data.fileName)
                // Handle document reception
                break
              case 'metadata':
                console.log('Peer metadata:', data)
                break
            }
          } catch (error) {
            console.error('Failed to parse data channel message:', error)
          }
        }

        dataChannelRef.current.onerror = (error) => {
          console.error('Data channel error:', error)
        }

        dataChannelRef.current.onclose = () => {
          console.log('Data channel closed')
        }

        // Handle incoming data channels
        pc.ondatachannel = (event) => {
          console.log('📨 Incoming data channel:', event.channel.label)
          const channel = event.channel

          channel.onmessage = (event) => {
            console.log('Incoming data channel message:', event.data)
          }
        }

        pcRef.current = pc
        console.log('✅ Peer connection created')
        return pc
      } catch (error) {
        console.error('❌ Failed to create peer connection:', error)
        throw error
      }
    },
    [sendMessage, handleRemoteStream, handleConnectionStateChange]
  )

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      if (audioTracks.length > 0) {
        const enabled = !audioTracks[0].enabled
        audioTracks.forEach((track) => {
          track.enabled = enabled
        })

        setIsMuted(!enabled)

        // Notify other participant via data channel
        if (dataChannelRef.current?.readyState === 'open') {
          dataChannelRef.current.send(
            JSON.stringify({
              type: 'audio-toggle',
              muted: !enabled,
              timestamp: Date.now(),
            })
          )
        }

        Vibration.vibrate(50)
        return !enabled
      }
    }
    return false
  }, [])

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks()
      if (videoTracks.length > 0) {
        const enabled = !videoTracks[0].enabled
        videoTracks.forEach((track) => {
          track.enabled = enabled
        })

        setIsVideoEnabled(enabled)

        // Notify other participant via data channel
        if (dataChannelRef.current?.readyState === 'open') {
          dataChannelRef.current.send(
            JSON.stringify({
              type: 'video-toggle',
              enabled: enabled,
              timestamp: Date.now(),
            })
          )
        }

        Vibration.vibrate(50)
        return !enabled
      }
    }
    return false
  }, [])

  // Switch camera
  const switchCamera = useCallback(async () => {
    if (isSwitchingCamera || !localStreamRef.current) {
      return isFrontCamera
    }

    setIsSwitchingCamera(true)

    try {
      if (Platform.OS === 'web') {
        // Web: Get new stream with opposite facing mode
        const constraints = {
          video: {
            facingMode: isFrontCamera ? 'environment' : 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false, // Keep existing audio
        }

        const newStream = await navigator.mediaDevices.getUserMedia(constraints)
        const newVideoTrack = newStream.getVideoTracks()[0]

        if (pcRef.current && newVideoTrack) {
          // Replace the video track in the peer connection
          const senders = pcRef.current.getSenders()
          const videoSender = senders.find((s) => s.track?.kind === 'video')

          if (videoSender) {
            await videoSender.replaceTrack(newVideoTrack)

            // Stop old video track
            const oldTracks = localStreamRef.current.getVideoTracks()
            oldTracks.forEach((track) => track.stop())

            // Add new video track to local stream
            localStreamRef.current.addTrack(newVideoTrack)

            // Remove old tracks from stream
            oldTracks.forEach((track) => {
              localStreamRef.current.removeTrack(track)
            })

            setLocalStream(localStreamRef.current)
          }
        }

        newStream.getTracks().forEach((track) => {
          if (track.kind === 'audio') track.stop()
        })
      } else {
        // Mobile with react-native-webrtc
        // This would typically use track._switchCamera() method
        console.log(
          '📱 Camera switching on mobile requires react-native-webrtc'
        )
      }

      const newCameraState = !isFrontCamera
      setIsFrontCamera(newCameraState)
      Vibration.vibrate(50)

      return newCameraState
    } catch (error) {
      console.error('❌ Failed to switch camera:', error)
      Alert.alert('Error', 'Failed to switch camera')
      return isFrontCamera
    } finally {
      setIsSwitchingCamera(false)
    }
  }, [isFrontCamera, isSwitchingCamera])

  // Send screenshot via data channel
  const sendScreenshot = useCallback(async () => {
    try {
      const screenshot = await takeScreenshot()
      if (screenshot && dataChannelRef.current?.readyState === 'open') {
        dataChannelRef.current.send(
          JSON.stringify({
            type: 'screenshot-update',
            data: screenshot,
            timestamp: Date.now(),
          })
        )
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to send screenshot:', error)
      return false
    }
  }, [takeScreenshot])

  // Start periodic screenshot sharing
  const startPeriodicScreenshotSharing = useCallback(
    (interval = 2000) => {
      if (screenCaptureIntervalRef.current) {
        clearInterval(screenCaptureIntervalRef.current)
      }

      screenCaptureIntervalRef.current = setInterval(async () => {
        await sendScreenshot()
      }, interval)

      console.log(`📸 Started periodic screenshot sharing every ${interval}ms`)
    },
    [sendScreenshot]
  )

  // Stop periodic screenshot sharing
  const stopPeriodicScreenshotSharing = useCallback(() => {
    if (screenCaptureIntervalRef.current) {
      clearInterval(screenCaptureIntervalRef.current)
      screenCaptureIntervalRef.current = null
      console.log('📸 Stopped periodic screenshot sharing')
    }
  }, [])

  // Update call status via data channel
  const updateCallStatus = useCallback((status, details = {}) => {
    if (dataChannelRef.current?.readyState === 'open') {
      dataChannelRef.current.send(
        JSON.stringify({
          type: 'call-status',
          status: status,
          details: details,
          timestamp: Date.now(),
        })
      )
    }
  }, [])

  // Send custom message via data channel
  const sendDataChannelMessage = useCallback((type, data = {}) => {
    if (dataChannelRef.current?.readyState === 'open') {
      const message = {
        type: type,
        ...data,
        timestamp: Date.now(),
      }
      dataChannelRef.current.send(JSON.stringify(message))
      return true
    }
    return false
  }, [])

  // Get connection statistics
  const getConnectionStats = useCallback(async () => {
    if (!pcRef.current) return null

    try {
      const stats = await pcRef.current.getStats()
      const results = {}

      stats.forEach((report) => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          results.candidatePair = report
        } else if (report.type === 'inbound-rtp') {
          results.inboundRtp = report
        } else if (report.type === 'outbound-rtp') {
          results.outboundRtp = report
        }
      })

      return results
    } catch (error) {
      console.error('Failed to get connection stats:', error)
      return null
    }
  }, [])

  // Cleanup
  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up WebRTC...')

    // Stop screen sharing if active
    if (isScreenSharing) {
      stopScreenSharing()
    }

    // Stop periodic screenshot sharing
    stopPeriodicScreenshotSharing()

    // Stop all media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
      setLocalStream(null)
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop())
      screenStreamRef.current = null
      setScreenStream(null)
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop())
      remoteStreamRef.current = null
      setRemoteStream(null)
    }

    // Close data channel
    if (dataChannelRef.current) {
      dataChannelRef.current.close()
      dataChannelRef.current = null
    }

    // Close peer connection
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }

    // Reset states
    setIsMuted(false)
    setIsVideoEnabled(callType === 'video')
    setIsScreenSharing(false)
    setIsSwitchingCamera(false)
    setScreenSharingType(null)
    chatIdRef.current = null

    // Allow screen capture again
    if (Platform.OS !== 'web') {
      ScreenCapture.allowScreenCaptureAsync()
    }

    console.log('✅ WebRTC cleanup complete')
  }, [
    callType,
    isScreenSharing,
    stopScreenSharing,
    stopPeriodicScreenshotSharing,
  ])

  // Check WebRTC support
  const checkWebRTCSupport = useCallback(() => {
    if (Platform.OS === 'web') {
      const supported = !!(
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia &&
        window.RTCPeerConnection
      )
      console.log('🌐 WebRTC Web support:', supported)
      return supported
    } else {
      // Check if react-native-webrtc is available
      try {
        require('react-native-webrtc')
        console.log('📱 WebRTC Mobile support: Available (react-native-webrtc)')
        return true
      } catch {
        console.log('📱 WebRTC Mobile support: Not available')
        return false
      }
    }
  }, [])

  return {
    // Streams
    localStream,
    remoteStream,
    screenStream,

    // Refs
    pcRef,
    localStreamRef,
    screenStreamRef,
    remoteStreamRef,
    dataChannelRef,
    chatIdRef,

    // States
    isMuted,
    isVideoEnabled,
    isScreenSharing,
    screenSharingType,
    isFrontCamera,
    isSwitchingCamera,

    // Core WebRTC Methods
    initializeMedia,
    createPeerConnection,
    createOffer,
    handleOffer,
    handleAnswer,
    handleICECandidate,

    // Media Control Methods
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    switchCamera,

    // Screen Sharing Methods
    startWebScreenShare,
    startMobileScreenSharing,
    stopScreenSharing,
    startPeriodicScreenshotSharing,
    stopPeriodicScreenshotSharing,
    sendScreenshot,
    shareDocument,

    // Utility Methods
    sendDataChannelMessage,
    updateCallStatus,
    getConnectionStats,
    checkWebRTCSupport,
    cleanup,

    // Helper Methods
    getExpoUserMedia,
    takeScreenshot,
  }
}
