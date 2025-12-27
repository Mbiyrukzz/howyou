// components/calls/LiveKitVideoView.js
import React, { useEffect, useRef } from 'react'
import { View, Text, Platform } from 'react-native'
import styled from 'styled-components/native'
import { VideoView } from 'livekit-client' // For web
// For React Native, you'd use: import { VideoView } from '@livekit/react-native'

const Container = styled.View`
  flex: 1;
  background-color: #1e293b;
  position: relative;
`

const RemoteVideoContainer = styled.View`
  flex: 1;
  width: 100%;
  height: 100%;
`

const LocalVideoPreview = styled.View`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 120px;
  height: 160px;
  border-radius: 12px;
  overflow: hidden;
  background-color: #0f172a;
  border: 2px solid #334155;
  elevation: 5;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.3;
  shadow-radius: 4px;
`

const PlaceholderView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: #1e293b;
`

const PlaceholderText = styled.Text`
  color: #94a3b8;
  font-size: 16px;
  margin-top: 12px;
`

const Avatar = styled.View`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  background-color: #3b82f6;
  justify-content: center;
  align-items: center;
`

const AvatarText = styled.Text`
  color: white;
  font-size: 32px;
  font-weight: bold;
`

const StatusText = styled.Text`
  color: #94a3b8;
  font-size: 14px;
  margin-top: 8px;
`

// Web video element component
const WebVideoElement = ({ track, mirrored = false }) => {
  const videoRef = useRef(null)

  useEffect(() => {
    if (!videoRef.current || !track) return

    track.attach(videoRef.current)

    return () => {
      track.detach(videoRef.current)
    }
  }, [track])

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: mirrored ? 'scaleX(-1)' : 'none',
      }}
    />
  )
}

// Native video component (placeholder - actual implementation depends on @livekit/react-native)
const NativeVideoElement = ({ track, mirrored = false }) => {
  // For React Native, you would use the VideoView from @livekit/react-native
  // This is a placeholder showing the structure
  return (
    <View style={{ flex: 1 }}>
      {/* <VideoView track={track} style={{ flex: 1 }} mirror={mirrored} /> */}
      <PlaceholderView>
        <Text style={{ color: 'white' }}>Native Video View</Text>
        <Text style={{ color: '#94a3b8', fontSize: 12 }}>
          Install @livekit/react-native for video support
        </Text>
      </PlaceholderView>
    </View>
  )
}

export const LiveKitVideoView = ({
  localVideoTrack,
  remoteVideoTrack,
  callType,
  isVideoEnabled,
  remoteUserName,
  callStatus,
  isConnected,
}) => {
  const VideoComponent =
    Platform.OS === 'web' ? WebVideoElement : NativeVideoElement

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }

  const renderRemoteView = () => {
    if (callType === 'voice') {
      return (
        <PlaceholderView>
          <Avatar>
            <AvatarText>{getInitials(remoteUserName)}</AvatarText>
          </Avatar>
          <PlaceholderText>{remoteUserName}</PlaceholderText>
          <StatusText>{isConnected ? 'Connected' : callStatus}</StatusText>
        </PlaceholderView>
      )
    }

    if (!remoteVideoTrack || !isConnected) {
      return (
        <PlaceholderView>
          <Avatar>
            <AvatarText>{getInitials(remoteUserName)}</AvatarText>
          </Avatar>
          <PlaceholderText>{remoteUserName}</PlaceholderText>
          <StatusText>
            {callStatus === 'connecting'
              ? 'Connecting...'
              : 'Waiting for video...'}
          </StatusText>
        </PlaceholderView>
      )
    }

    return <VideoComponent track={remoteVideoTrack} mirrored={false} />
  }

  const renderLocalView = () => {
    if (callType === 'voice' || !isVideoEnabled || !localVideoTrack) {
      return (
        <PlaceholderView>
          <Avatar style={{ width: 60, height: 60, borderRadius: 30 }}>
            <AvatarText style={{ fontSize: 24 }}>You</AvatarText>
          </Avatar>
        </PlaceholderView>
      )
    }

    return <VideoComponent track={localVideoTrack} mirrored={true} />
  }

  return (
    <Container>
      <RemoteVideoContainer>{renderRemoteView()}</RemoteVideoContainer>

      {callType === 'video' && (
        <LocalVideoPreview>{renderLocalView()}</LocalVideoPreview>
      )}
    </Container>
  )
}
