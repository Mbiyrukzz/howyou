// hooks/useLiveKit.native.js - Fixed React Native LiveKit Implementation
import { useEffect, useState, useRef, useCallback } from 'react'
import { Platform } from 'react-native'

import {
  Room,
  RoomEvent,
  ParticipantEvent,
  Track,
  createLocalAudioTrack,
  createLocalVideoTrack,
  VideoPresets,
} from 'livekit-client'

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
  const tracksPublished = useRef(false)

  // Disconnect function - defined first so it's available
  const disconnectRoom = useCallback(async () => {
    if (cleanupInProgress.current) {
      console.log('⏭️ Cleanup already in progress')
      return
    }
    cleanupInProgress.current = true

    console.log('🧹 Disconnecting from LiveKit room...')

    try {
      // Stop local tracks
      if (localVideoTrack) {
        console.log('🛑 Stopping video track')
        localVideoTrack.stop()
      }
      if (localAudioTrack) {
        console.log('🛑 Stopping audio track')
        localAudioTrack.stop()
      }

      // Disconnect room
      if (roomRef.current) {
        console.log('🔌 Disconnecting room')
        await roomRef.current.disconnect()
        roomRef.current = null
      }

      // Clear state
      setRoom(null)
      setIsConnected(false)
      setLocalParticipant(null)
      setRemoteParticipants([])
      setLocalVideoTrack(null)
      setLocalAudioTrack(null)
      setRemoteVideoTrack(null)
      setRemoteAudioTrack(null)
      tracksPublished.current = false

      console.log('✅ Disconnected from room')
    } catch (err) {
      console.error('❌ Error disconnecting:', err)
    } finally {
      cleanupInProgress.current = false
    }
  }, [localVideoTrack, localAudioTrack])

  // Publish local audio/video tracks
  const publishTracks = useCallback(
    async (room, type) => {
      if (tracksPublished.current) return

      try {
        await room.localParticipant.setMicrophoneEnabled(true)
        setLocalAudioTrack(
          room.localParticipant.audioTracks.values().next().value?.track
        )
        console.log('✅ Audio enabled')

        if (type === 'video') {
          await room.localParticipant.setCameraEnabled(true)
          setLocalVideoTrack(
            room.localParticipant.videoTracks.values().next().value?.track
          )
          setIsVideoEnabled(true)
          console.log('✅ Video enabled')
        }

        tracksPublished.current = true
      } catch (err) {
        console.error('❌ Error enabling tracks:', err)
        if (onError) onError(err)
      }
    },
    [onError]
  )

  // Initialize room
  useEffect(() => {
    if (!livekitUrl || !token || cleanupInProgress.current) {
      console.log('⏭️ Skipping connection:', {
        hasUrl: !!livekitUrl,
        hasToken: !!token,
        cleanupInProgress: cleanupInProgress.current,
      })
      // If we have a room but no credentials, disconnect it
      if (roomRef.current && !cleanupInProgress.current) {
        disconnectRoom()
      }
      return
    }

    let mounted = true

    console.log('🔌 Initializing LiveKit connection...', {
      url: livekitUrl,
      tokenPreview: token.substring(0, 20) + '...',
      callType,
    })

    const newRoom = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: { width: 1280, height: 720 },
      },
    })

    roomRef.current = newRoom

    const connectToRoom = async () => {
      try {
        console.log('🔌 Connecting to LiveKit room...')

        // Connect to room
        await newRoom.connect(livekitUrl, token)

        if (!mounted) {
          console.log('⚠️ Component unmounted, disconnecting')
          await newRoom.disconnect()
          return
        }

        console.log('✅ Connected to LiveKit room')
        setRoom(newRoom)
        setIsConnected(true)
        setLocalParticipant(newRoom.localParticipant)

        // Wait a moment for connection to stabilize
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Publish tracks after connection is stable
        if (mounted && !cleanupInProgress.current) {
          await publishTracks(newRoom, callType)
        }
      } catch (err) {
        console.error('❌ Failed to connect to LiveKit:', err)
        console.error('Error details:', {
          message: err.message,
          code: err.code,
          stack: err.stack,
        })
        if (onError && mounted) {
          onError(err)
        }
      }
    }

    connectToRoom()

    return () => {
      console.log('🧹 Component unmounting, cleaning up...')
      mounted = false
      if (!cleanupInProgress.current) {
        disconnectRoom()
      }
    }
  }, [livekitUrl, token, callType])

  // Room event listeners
  useEffect(() => {
    if (!room) return

    console.log('👂 Setting up room event listeners')

    const handleParticipantConnected = (participant) => {
      console.log('👤 Participant connected:', participant.identity)
      setRemoteParticipants((prev) => [...prev, participant])

      if (onParticipantConnected) {
        onParticipantConnected(participant)
      }

      // Subscribe to participant's tracks
      const handleTrackSubscribed = (track, publication) => {
        console.log('🎬 Track subscribed:', track.kind)

        if (track.kind === Track.Kind.Video) {
          setRemoteVideoTrack(track)
        } else if (track.kind === Track.Kind.Audio) {
          setRemoteAudioTrack(track)
        }
      }

      const handleTrackUnsubscribed = (track) => {
        console.log('🔇 Track unsubscribed:', track.kind)

        if (track.kind === Track.Kind.Video) {
          setRemoteVideoTrack(null)
        } else if (track.kind === Track.Kind.Audio) {
          setRemoteAudioTrack(null)
        }
      }

      participant.on(ParticipantEvent.TrackSubscribed, handleTrackSubscribed)
      participant.on(
        ParticipantEvent.TrackUnsubscribed,
        handleTrackUnsubscribed
      )

      // Handle existing tracks
      participant.trackPublications.forEach((publication) => {
        if (publication.track) {
          handleTrackSubscribed(publication.track, publication)
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
      setIsConnected(false)
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
      console.log('🧹 Cleaning up room event listeners')
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected)
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
      room.off(RoomEvent.Disconnected, handleDisconnected)
      room.off(RoomEvent.Reconnecting, handleReconnecting)
      room.off(RoomEvent.Reconnected, handleReconnected)
    }
  }, [room, onParticipantConnected, onParticipantDisconnected, onCallEnded])

  // Toggle microphone
  const toggleMute = useCallback(async () => {
    if (!localAudioTrack) {
      console.warn('⚠️ No audio track to mute')
      return isMuted
    }

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
    if (!localVideoTrack) {
      console.warn('⚠️ No video track to toggle')
      return !isVideoEnabled
    }

    try {
      const newEnabled = !isVideoEnabled
      await localVideoTrack.setEnabled(newEnabled)
      setIsVideoEnabled(newEnabled)
      console.log('📹 Video:', newEnabled ? 'enabled' : 'disabled')
      return !newEnabled
    } catch (err) {
      console.error('❌ Error toggling video:', err)
      return !isVideoEnabled
    }
  }, [localVideoTrack, isVideoEnabled])

  // Switch camera (mobile only)
  const switchCamera = useCallback(async () => {
    if (!localVideoTrack || !room || !localParticipant) {
      console.warn('⚠️ Cannot switch camera - missing requirements')
      return
    }

    try {
      console.log('🔄 Switching camera...')

      // Stop current track
      localVideoTrack.stop()

      // Get current facing mode
      const currentFacingMode =
        localVideoTrack.mediaStreamTrack?.getSettings?.()?.facingMode || 'user'
      const newFacingMode =
        currentFacingMode === 'user' ? 'environment' : 'user'

      console.log('📸 New facing mode:', newFacingMode)

      // Create new track with opposite facing mode
      const newVideoTrack = await createLocalVideoTrack({
        facingMode: newFacingMode,
        resolution: { width: 1280, height: 720 },
      })

      // Replace track in room
      await localParticipant.publishTrack(newVideoTrack, {
        name: 'camera',
      })

      setLocalVideoTrack(newVideoTrack)
      console.log('✅ Camera switched')
    } catch (err) {
      console.error('❌ Error switching camera:', err)
    }
  }, [localVideoTrack, room, localParticipant])

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
