import React, { useEffect, useRef } from 'react'
import { View, Text, Platform, Animated } from 'react-native'
import styled from 'styled-components/native'
import { VideoView } from 'livekit-client' // For web

const Container = styled.View`
  flex: 1;
  background: #0a0e1a;
  position: relative;
`

const RemoteVideoContainer = styled.View`
  flex: 1;
  width: 100%;
  height: 100%;
  background-color: #0f172a;
`

const LocalVideoPreview = styled.View`
  position: absolute;
  top: 24px;
  right: 24px;
  width: 140px;
  height: 200px;
  border-radius: 20px;
  overflow: hidden;
  background-color: #0a0e1a;
  border-width: 3px;
  border-color: rgba(255, 255, 255, 0.15);
  elevation: 12;
  shadow-color: #000;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.4;
  shadow-radius: 16px;
`

const PlaceholderView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background: #1e293b;
`

const PlaceholderContent = styled.View`
  align-items: center;
  gap: 12px;
`

const AvatarContainer = styled.View`
  position: relative;
  margin-bottom: 8px;
`

const Avatar = styled.View`
  width: ${(props) => props.size || 96}px;
  height: ${(props) => props.size || 96}px;
  border-radius: ${(props) => (props.size || 96) / 2}px;
  background: #2563eb;
  justify-content: center;
  align-items: center;
  shadow-color: #3b82f6;
  shadow-offset: 0px 6px;
  shadow-opacity: 0.4;
  shadow-radius: 20px;
  elevation: 10;
  border-width: 4px;
  border-color: rgba(255, 255, 255, 0.1);
`

const AvatarText = styled.Text`
  color: #ffffff;
  font-size: ${(props) => props.size || 40}px;
  font-weight: 700;
  letter-spacing: 1px;
`

const PulseRing = styled.View`
  position: absolute;
  width: ${(props) => (props.size || 96) + 20}px;
  height: ${(props) => (props.size || 96) + 20}px;
  border-radius: ${(props) => ((props.size || 96) + 20) / 2}px;
  border-width: 2px;
  border-color: rgba(59, 130, 246, 0.3);
  top: -10px;
  left: -10px;
`

const NameText = styled.Text`
  color: #e2e8f0;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-top: 4px;
`

const StatusContainer = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
`

const StatusDot = styled.View`
  width: 10px;
  height: 10px;
  border-radius: 5px;
  background-color: ${(props) => {
    if (props.isConnected) return '#10b981'
    if (props.isConnecting) return '#f59e0b'
    return '#64748b'
  }};
  shadow-color: ${(props) => {
    if (props.isConnected) return '#10b981'
    if (props.isConnecting) return '#f59e0b'
    return '#64748b'
  }};
  shadow-offset: 0px 0px;
  shadow-opacity: 0.8;
  shadow-radius: 6px;
  elevation: 4;
`

const StatusText = styled.Text`
  color: #cbd5e1;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.3px;
`

const VideoOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(10, 14, 26, 0.85);
  justify-content: center;
  align-items: center;
`

const LocalPlaceholder = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background: #1e293b;
`

const SmallAvatar = styled.View`
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background: #4f46e5;
  justify-content: center;
  align-items: center;
  shadow-color: #6366f1;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 12px;
  elevation: 6;
  border-width: 2px;
  border-color: rgba(255, 255, 255, 0.15);
`

const SmallAvatarText = styled.Text`
  color: #ffffff;
  font-size: 24px;
  font-weight: 700;
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
        backgroundColor: '#0f172a',
      }}
    />
  )
}

const NativeVideoElement = ({ track, mirrored = false }) => {
  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <PlaceholderView>
        <PlaceholderContent>
          <Avatar size={72}>
            <AvatarText size={32}>📹</AvatarText>
          </Avatar>
          <Text style={{ color: '#e2e8f0', fontSize: 16, fontWeight: '600' }}>
            Native Video View
          </Text>
          <Text
            style={{
              color: '#94a3b8',
              fontSize: 13,
              textAlign: 'center',
              paddingHorizontal: 40,
            }}
          >
            Install @livekit/react-native for video support
          </Text>
        </PlaceholderContent>
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
          <PlaceholderContent>
            <AvatarContainer>
              <PulseRing />
              <Avatar>
                <AvatarText>{getInitials(remoteUserName)}</AvatarText>
              </Avatar>
            </AvatarContainer>
            {remoteUserName && <NameText>{remoteUserName}</NameText>}
            <StatusContainer>
              <StatusDot
                isConnected={isConnected}
                isConnecting={!isConnected}
              />
              <StatusText>{isConnected ? 'Connected' : callStatus}</StatusText>
            </StatusContainer>
          </PlaceholderContent>
        </PlaceholderView>
      )
    }

    if (!remoteVideoTrack || !isConnected) {
      return (
        <PlaceholderView>
          <PlaceholderContent>
            <AvatarContainer>
              <PulseRing />
              <Avatar>
                <AvatarText>{getInitials(remoteUserName)}</AvatarText>
              </Avatar>
            </AvatarContainer>
            {remoteUserName && <NameText>{remoteUserName}</NameText>}
            <StatusContainer>
              <StatusDot
                isConnected={false}
                isConnecting={callStatus === 'connecting'}
              />
              <StatusText>
                {callStatus === 'connecting'
                  ? 'Connecting...'
                  : 'Waiting for video...'}
              </StatusText>
            </StatusContainer>
          </PlaceholderContent>
        </PlaceholderView>
      )
    }

    return <VideoComponent track={remoteVideoTrack} mirrored={false} />
  }

  const renderLocalView = () => {
    if (callType === 'voice' || !isVideoEnabled || !localVideoTrack) {
      return (
        <LocalPlaceholder>
          <SmallAvatar>
            <SmallAvatarText>You</SmallAvatarText>
          </SmallAvatar>
        </LocalPlaceholder>
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
