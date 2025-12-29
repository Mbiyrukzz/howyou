// hooks/useLiveKit.native.js - Fixed video rendering issues
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
  const callbacksRef = useRef({
    onParticipantConnected,
    onParticipantDisconnected,
    onCallEnded,
    onError,
  })

  useEffect(() => {
    callbacksRef.current = {
      onParticipantConnected,
      onParticipantDisconnected,
      onCallEnded,
      onError,
    }
  }, [onParticipantConnected, onParticipantDisconnected, onCallEnded, onError])

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

  // ✅ FIXED: Publish tracks - let the event listener handle track capture
  const publishTracks = useCallback(async (room, type) => {
    if (tracksPublished.current) {
      console.log('⏭️ Tracks already published')
      return
    }

    try {
      console.log('🎤 Publishing local tracks...')

      // Enable microphone - trackPublished event will handle setting the track
      await room.localParticipant.setMicrophoneEnabled(true)
      console.log('✅ Microphone enabled')

      // Enable camera if video call
      if (type === 'video') {
        // Wait a bit before enabling camera
        await new Promise((resolve) => setTimeout(resolve, 500))

        await room.localParticipant.setCameraEnabled(true)
        console.log('✅ Camera enabled')
      }

      tracksPublished.current = true
      console.log(
        '✅ All tracks publishing initiated - waiting for trackPublished events'
      )
    } catch (err) {
      console.error('❌ Error enabling tracks:', err)
      if (callbacksRef.current.onError) {
        callbacksRef.current.onError(err)
      }
    }
  }, [])

  // Initialize room
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
        facingMode: 'user',
      },
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
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

        // ✅ Listen for local track publications
        const handleLocalTrackPublished = (publication) => {
          console.log('📢 Local track published:', {
            kind: publication.kind,
            source: publication.source,
          })

          if (publication.track) {
            if (publication.kind === 'audio') {
              setLocalAudioTrack(publication.track)
              console.log('✅ Local audio track set from published event')
            } else if (publication.kind === 'video') {
              setLocalVideoTrack(publication.track)
              console.log('✅ Local video track set from published event')
            }
          }
        }

        newRoom.localParticipant.on('trackPublished', handleLocalTrackPublished)

        // Give room a moment to stabilize
        await new Promise((resolve) => setTimeout(resolve, 300))

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

      // Remove local track listener
      if (roomRef.current?.localParticipant) {
        roomRef.current.localParticipant.off('trackPublished')
      }

      if (!cleanupInProgress.current) {
        disconnectRoom()
      }
    }
  }, [livekitUrl, token, callType, publishTracks, disconnectRoom])

  // Room event listeners
  useEffect(() => {
    if (!room) return

    console.log('👂 Setting up room event listeners')

    const handleParticipantConnected = (participant) => {
      console.log('👤 Participant connected:', participant.identity)
      setRemoteParticipants((prev) => [...prev, participant])

      if (callbacksRef.current.onParticipantConnected) {
        callbacksRef.current.onParticipantConnected(participant)
      }

      const handleTrackSubscribed = (track, publication) => {
        console.log('🎬 Track subscribed:', {
          kind: track.kind,
          sid: track.sid,
          enabled: track.enabled,
          muted: track.muted,
        })

        if (track.kind === Track.Kind.Video) {
          setRemoteVideoTrack(track)
          console.log('📹 Remote video track set')
        } else if (track.kind === Track.Kind.Audio) {
          setRemoteAudioTrack(track)
          console.log('🔊 Remote audio track set')
          // ✅ Audio will be played automatically by React Native WebRTC
          // No need to manually attach on native - that's web-only
        }
      }

      const handleTrackUnsubscribed = (track) => {
        console.log('🔇 Track unsubscribed:', track.kind)
        if (track.kind === Track.Kind.Video) {
          setRemoteVideoTrack(null)
        } else if (track.kind === Track.Kind.Audio) {
          setRemoteAudioTrack(null)
          console.log('🔇 Audio track removed')
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
      console.log(
        '👤 Remote participant already in room:',
        participant.identity
      )
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
  }, [room])

  // ✅ FIXED: Toggle microphone using mute/unmute instead of setEnabled
  const toggleMute = useCallback(async () => {
    if (!room?.localParticipant) {
      console.warn('⚠️ No local participant to mute')
      return isMuted
    }

    try {
      const newMuted = !isMuted
      await room.localParticipant.setMicrophoneEnabled(!newMuted)
      setIsMuted(newMuted)
      console.log('🎤 Microphone:', newMuted ? 'muted' : 'unmuted')
      return newMuted
    } catch (err) {
      console.error('❌ Error toggling mute:', err)
      return isMuted
    }
  }, [room, isMuted])

  // ✅ FIXED: Toggle video using mute/unmute instead of setEnabled
  const toggleVideo = useCallback(async () => {
    if (!room?.localParticipant) {
      console.warn('⚠️ No local participant to toggle video')
      return !isVideoEnabled
    }

    try {
      const newEnabled = !isVideoEnabled
      await room.localParticipant.setCameraEnabled(newEnabled)
      setIsVideoEnabled(newEnabled)
      console.log('📹 Video:', newEnabled ? 'enabled' : 'disabled')
      return !newEnabled
    } catch (err) {
      console.error('❌ Error toggling video:', err)
      return !isVideoEnabled
    }
  }, [room, isVideoEnabled])

  // Switch camera
  const switchCamera = useCallback(async () => {
    if (!localVideoTrack || !room) {
      console.warn('⚠️ Cannot switch camera - missing requirements')
      return
    }

    try {
      console.log('🔄 Switching camera...')
      const facingMode =
        localVideoTrack.mediaStreamTrack?.getSettings?.()?.facingMode || 'user'
      const newFacingMode = facingMode === 'user' ? 'environment' : 'user'

      await room.switchActiveDevice('videoinput', newFacingMode)
      console.log('✅ Camera switched to:', newFacingMode)
    } catch (err) {
      console.error('❌ Error switching camera:', err)
    }
  }, [localVideoTrack, room])

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
