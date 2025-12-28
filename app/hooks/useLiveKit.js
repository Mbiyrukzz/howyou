// hooks/useLiveKit.native.js - Fixed to prevent infinite re-renders
import { useEffect, useState, useRef, useCallback } from 'react'
import { Room, RoomEvent, ParticipantEvent, Track } from 'livekit-client'

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
  // ✅ Store callbacks in refs to prevent re-render loops
  const callbacksRef = useRef({
    onParticipantConnected,
    onParticipantDisconnected,
    onCallEnded,
    onError,
  })

  // ✅ Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onParticipantConnected,
      onParticipantDisconnected,
      onCallEnded,
      onError,
    }
  }, [onParticipantConnected, onParticipantDisconnected, onCallEnded, onError])

  // Disconnect function
  const disconnectRoom = useCallback(async () => {
    if (cleanupInProgress.current) {
      console.log('⏭️ Cleanup already in progress')
      return
    }
    cleanupInProgress.current = true

    console.log('🧹 Disconnecting from LiveKit room...')

    try {
      if (localVideoTrack) {
        console.log('🛑 Stopping video track')
        localVideoTrack.stop()
      }
      if (localAudioTrack) {
        console.log('🛑 Stopping audio track')
        localAudioTrack.stop()
      }

      if (roomRef.current) {
        console.log('🔌 Disconnecting room')
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
      tracksPublished.current = false

      console.log('✅ Disconnected from room')
    } catch (err) {
      console.error('❌ Error disconnecting:', err)
    } finally {
      cleanupInProgress.current = false
    }
  }, [localVideoTrack, localAudioTrack])

  // Publish local audio/video tracks
  const publishTracks = useCallback(async (room, type) => {
    if (tracksPublished.current) return

    try {
      // Enable microphone
      await room.localParticipant.setMicrophoneEnabled(true)
      console.log('✅ Microphone enabled')

      // Wait a bit for track to be available
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Get audio track safely
      if (
        room.localParticipant.audioTracks &&
        room.localParticipant.audioTracks.size > 0
      ) {
        const audioTrackPub = Array.from(
          room.localParticipant.audioTracks.values()
        )[0]
        if (audioTrackPub?.track) {
          setLocalAudioTrack(audioTrackPub.track)
          console.log('✅ Audio track set')
        }
      }

      // Enable camera if video call
      if (type === 'video') {
        await room.localParticipant.setCameraEnabled(true)
        console.log('✅ Camera enabled')

        // Wait a bit for track to be available
        await new Promise((resolve) => setTimeout(resolve, 300))

        // Get video track safely
        if (
          room.localParticipant.videoTracks &&
          room.localParticipant.videoTracks.size > 0
        ) {
          const videoTrackPub = Array.from(
            room.localParticipant.videoTracks.values()
          )[0]
          if (videoTrackPub?.track) {
            setLocalVideoTrack(videoTrackPub.track)
            setIsVideoEnabled(true)
            console.log('✅ Video track set')
          }
        }
      }

      tracksPublished.current = true
    } catch (err) {
      console.error('❌ Error enabling tracks:', err)
      if (callbacksRef.current.onError) {
        callbacksRef.current.onError(err)
      }
    }
  }, [])

  // ✅ Initialize room - only depends on livekitUrl and token
  useEffect(() => {
    if (!livekitUrl || !token || cleanupInProgress.current) {
      console.log('⏭️ Skipping connection:', {
        hasUrl: !!livekitUrl,
        hasToken: !!token,
        cleanupInProgress: cleanupInProgress.current,
      })
      if (roomRef.current && !cleanupInProgress.current) {
        disconnectRoom()
      }
      return
    }

    let mounted = true
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

        await new Promise((resolve) => setTimeout(resolve, 500))

        if (mounted && !cleanupInProgress.current) {
          await publishTracks(newRoom, callType)
        }
      } catch (err) {
        console.error('❌ Failed to connect to LiveKit:', err)
        if (callbacksRef.current.onError && mounted) {
          callbacksRef.current.onError(err)
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
  }, [livekitUrl, token]) // ✅ Only these two deps

  // ✅ Room event listeners - separate effect with stable handlers
  useEffect(() => {
    if (!room) return

    console.log('👂 Setting up room event listeners')

    // ✅ Define handlers inside effect but don't recreate room state setters
    const handleParticipantConnected = (participant) => {
      console.log('👤 Participant connected:', participant.identity)
      setRemoteParticipants((prev) => [...prev, participant])

      if (callbacksRef.current.onParticipantConnected) {
        callbacksRef.current.onParticipantConnected(participant)
      }

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

      if (callbacksRef.current.onParticipantDisconnected) {
        callbacksRef.current.onParticipantDisconnected(participant)
      }
    }

    const handleDisconnected = (reason) => {
      console.log('🔴 Disconnected from room:', reason)
      setIsConnected(false)

      if (callbacksRef.current.onCallEnded) {
        callbacksRef.current.onCallEnded(reason)
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
      console.log('👤 Remote participant joined:', participant.identity)
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
  }, [room]) // ✅ Only depends on room

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

  // Switch camera
  const switchCamera = useCallback(async () => {
    if (!localVideoTrack || !room || !localParticipant) {
      console.warn('⚠️ Cannot switch camera - missing requirements')
      return
    }

    try {
      console.log('🔄 Switching camera...')
      const facingMode =
        localVideoTrack.mediaStreamTrack.getSettings().facingMode
      await room.switchActiveDevice(
        'videoinput',
        facingMode === 'user' ? 'environment' : 'user'
      )
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
