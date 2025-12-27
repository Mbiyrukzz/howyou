// hooks/useLiveKit.native.js - React Native LiveKit Implementation
import { useEffect, useState, useRef, useCallback } from 'react'
import { Platform } from 'react-native'
import {
  Room,
  RoomEvent,
  Track,
  ParticipantEvent,
  createLocalAudioTrack,
  createLocalVideoTrack,
  VideoPresets,
} from '@livekit/react-native'

export function useLiveKit(livekitUrl, token, callType, options = {}) {
  const {
    onParticipantConnected,
    onParticipantDisconnected,
    onCallEnded,
    onError,
  } = options

  const [room, setRoom] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [localParticipant, setLocalParticipant] = useState(null)
  const [remoteParticipants, setRemoteParticipants] = useState([])
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video')
  const [localVideoTrack, setLocalVideoTrack] = useState(null)
  const [localAudioTrack, setLocalAudioTrack] = useState(null)
  const [remoteVideoTrack, setRemoteVideoTrack] = useState(null)
  const [remoteAudioTrack, setRemoteAudioTrack] = useState(null)

  const roomRef = useRef(null)
  const cleanupInProgress = useRef(false)

  // Initialize room
  useEffect(() => {
    if (!livekitUrl || !token || cleanupInProgress.current) return

    let mounted = true
    const newRoom = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: VideoPresets.h720.resolution,
      },
    })

    roomRef.current = newRoom

    const connectToRoom = async () => {
      try {
        console.log('🔌 Connecting to LiveKit room...')

        await newRoom.connect(livekitUrl, token)

        if (!mounted) {
          await newRoom.disconnect()
          return
        }

        console.log('✅ Connected to LiveKit room')
        setRoom(newRoom)
        setIsConnected(true)
        setLocalParticipant(newRoom.localParticipant)

        // Publish local tracks
        await publishTracks(newRoom, callType)
      } catch (err) {
        console.error('❌ Failed to connect to LiveKit:', err)
        if (onError) onError(err)
      }
    }

    connectToRoom()

    return () => {
      mounted = false
      if (!cleanupInProgress.current) {
        disconnectRoom()
      }
    }
  }, [livekitUrl, token])

  // Publish local audio/video tracks
  const publishTracks = async (room, type) => {
    try {
      console.log('🎤 Publishing local tracks...')

      // Create and publish audio track
      const audioTrack = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
      })

      await room.localParticipant.publishTrack(audioTrack)
      setLocalAudioTrack(audioTrack)
      console.log('✅ Audio track published')

      // Create and publish video track if video call
      if (type === 'video') {
        const videoTrack = await createLocalVideoTrack({
          facingMode: 'user',
          resolution: VideoPresets.h720.resolution,
        })

        await room.localParticipant.publishTrack(videoTrack)
        setLocalVideoTrack(videoTrack)
        console.log('✅ Video track published')
      }
    } catch (err) {
      console.error('❌ Error publishing tracks:', err)
      if (onError) onError(err)
    }
  }

  // Room event listeners
  useEffect(() => {
    if (!room) return

    const handleParticipantConnected = (participant) => {
      console.log('👤 Participant connected:', participant.identity)
      setRemoteParticipants((prev) => [...prev, participant])

      if (onParticipantConnected) {
        onParticipantConnected(participant)
      }

      // Subscribe to participant's tracks
      participant.on(ParticipantEvent.TrackSubscribed, (track, publication) => {
        console.log('🎬 Track subscribed:', track.kind)

        if (track.kind === Track.Kind.Video) {
          setRemoteVideoTrack(track)
        } else if (track.kind === Track.Kind.Audio) {
          setRemoteAudioTrack(track)
        }
      })

      participant.on(ParticipantEvent.TrackUnsubscribed, (track) => {
        console.log('🔇 Track unsubscribed:', track.kind)

        if (track.kind === Track.Kind.Video) {
          setRemoteVideoTrack(null)
        } else if (track.kind === Track.Kind.Audio) {
          setRemoteAudioTrack(null)
        }
      })
    }

    const handleParticipantDisconnected = (participant) => {
      console.log('👋 Participant disconnected:', participant.identity)
      setRemoteParticipants((prev) =>
        prev.filter((p) => p.identity !== participant.identity)
      )

      if (onParticipantDisconnected) {
        onParticipantDisconnected(participant)
      }
    }

    const handleDisconnected = (reason) => {
      console.log('🔴 Disconnected from room:', reason)
      setIsConnected(false)

      if (onCallEnded) {
        onCallEnded(reason)
      }
    }

    const handleReconnecting = () => {
      console.log('🔄 Reconnecting...')
    }

    const handleReconnected = () => {
      console.log('✅ Reconnected')
      setIsConnected(true)
    }

    // Attach listeners
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected)
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
    room.on(RoomEvent.Disconnected, handleDisconnected)
    room.on(RoomEvent.Reconnecting, handleReconnecting)
    room.on(RoomEvent.Reconnected, handleReconnected)

    // Check for already connected participants
    room.remoteParticipants.forEach((participant) => {
      handleParticipantConnected(participant)
    })

    return () => {
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected)
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
      room.off(RoomEvent.Disconnected, handleDisconnected)
      room.off(RoomEvent.Reconnecting, handleReconnecting)
      room.off(RoomEvent.Reconnected, handleReconnected)
    }
  }, [room, onParticipantConnected, onParticipantDisconnected, onCallEnded])

  // Toggle microphone
  const toggleMute = useCallback(async () => {
    if (!localAudioTrack) return

    try {
      const newMuted = !isMuted
      await localAudioTrack.setEnabled(!newMuted)
      setIsMuted(newMuted)
      console.log('🎤 Microphone:', newMuted ? 'muted' : 'unmuted')
      return newMuted
    } catch (err) {
      console.error('❌ Error toggling mute:', err)
      return isMuted
    }
  }, [localAudioTrack, isMuted])

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (!localVideoTrack) return

    try {
      const newDisabled = !isVideoEnabled
      await localVideoTrack.setEnabled(!newDisabled)
      setIsVideoEnabled(!newDisabled)
      console.log('📹 Video:', newDisabled ? 'disabled' : 'enabled')
      return newDisabled
    } catch (err) {
      console.error('❌ Error toggling video:', err)
      return !isVideoEnabled
    }
  }, [localVideoTrack, isVideoEnabled])

  // Switch camera (mobile only)
  const switchCamera = useCallback(async () => {
    if (!localVideoTrack) return

    try {
      // Get current facing mode
      const currentFacingMode =
        localVideoTrack.mediaStreamTrack.getSettings().facingMode
      const newFacingMode =
        currentFacingMode === 'user' ? 'environment' : 'user'

      console.log('🔄 Switching camera to:', newFacingMode)

      // Stop current track
      localVideoTrack.stop()

      // Create new track with opposite facing mode
      const newVideoTrack = await createLocalVideoTrack({
        facingMode: newFacingMode,
        resolution: VideoPresets.h720.resolution,
      })

      // Replace track in room
      if (room && localParticipant) {
        await localParticipant.publishTrack(newVideoTrack, {
          name: 'camera',
        })
      }

      setLocalVideoTrack(newVideoTrack)
      console.log('✅ Camera switched')
    } catch (err) {
      console.error('❌ Error switching camera:', err)
    }
  }, [localVideoTrack, room, localParticipant])

  // Disconnect from room
  const disconnectRoom = useCallback(async () => {
    if (cleanupInProgress.current) return
    cleanupInProgress.current = true

    console.log('🧹 Disconnecting from LiveKit room...')

    try {
      if (localVideoTrack) {
        localVideoTrack.stop()
      }
      if (localAudioTrack) {
        localAudioTrack.stop()
      }

      if (roomRef.current) {
        await roomRef.current.disconnect()
        roomRef.current = null
      }

      setRoom(null)
      setIsConnected(false)
      setLocalParticipant(null)
      setRemoteParticipants([])
      setLocalVideoTrack(null)
      setLocalAudioTrack(null)
      setRemoteVideoTrack(null)
      setRemoteAudioTrack(null)

      console.log('✅ Disconnected from room')
    } catch (err) {
      console.error('❌ Error disconnecting:', err)
    }
  }, [localVideoTrack, localAudioTrack])

  return {
    room,
    isConnected,
    localParticipant,
    remoteParticipants,
    localVideoTrack,
    localAudioTrack,
    remoteVideoTrack,
    remoteAudioTrack,
    isMuted,
    isVideoEnabled,
    toggleMute,
    toggleVideo,
    switchCamera,
    disconnect: disconnectRoom,
  }
}
