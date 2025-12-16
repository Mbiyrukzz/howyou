import React from 'react'
import { Platform } from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'

let RTCView, Video

if (Platform.OS === 'android' || Platform.OS === 'ios') {
  const WebRTC = require('react-native-webrtc')
  RTCView = WebRTC.RTCView
}

if (Platform.OS === 'ios') {
  Video = require('expo-av').Video
}

const RemoteVideoWrapper = styled.View`
  flex: 1;
  background-color: #0f172a;
`

const PlaceholderView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: #0f172a;
`

const PlaceholderAvatar = styled.View`
  width: 140px;
  height: 140px;
  border-radius: 70px;
  background-color: #3b82f6;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
  border-width: 4px;
  border-color: rgba(255, 255, 255, 0.1);
  shadow-color: #000;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.3;
  shadow-radius: 12px;
  elevation: 10;
`

const AvatarText = styled.Text`
  font-size: 64px;
  color: #fff;
  font-weight: 700;
`

const StatusTextLarge = styled.Text`
  color: #fff;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
`

const StatusTextSmall = styled.Text`
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  font-weight: 500;
`

const AudioCallView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: #0f172a;
`

const AudioAvatar = styled.View`
  width: 180px;
  height: 180px;
  border-radius: 90px;
  background-color: #10b981;
  justify-content: center;
  align-items: center;
  margin-bottom: 32px;
  border-width: 4px;
  border-color: rgba(255, 255, 255, 0.1);
  shadow-color: #000;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.3;
  shadow-radius: 12px;
  elevation: 10;
`

const CallDurationText = styled.Text`
  color: rgba(255, 255, 255, 0.8);
  font-size: 20px;
  font-weight: 600;
  margin-top: 12px;
`

export function RemoteVideoView({
  remoteStream,
  remoteUserName,
  isConnected,
  callStatus,
  callType,
  callDuration,
  isIncoming,
}) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`
  }

  const getStatusMessage = () => {
    if (callStatus === 'ringing') {
      return isIncoming
        ? `${remoteUserName} is calling...`
        : `Calling ${remoteUserName}...`
    }
    if (callStatus === 'connecting') {
      return `Connecting to ${remoteUserName}...`
    }
    return 'Waiting for video...'
  }

  // Audio call view
  if (callType === 'voice' && isConnected && remoteStream) {
    return (
      <AudioCallView>
        <AudioAvatar>
          <AvatarText>{remoteUserName?.[0]?.toUpperCase() || '?'}</AvatarText>
        </AudioAvatar>
        <StatusTextLarge>{remoteUserName}</StatusTextLarge>
        <CallDurationText>{formatDuration(callDuration)}</CallDurationText>
      </AudioCallView>
    )
  }

  // Placeholder when no remote stream
  if (!remoteStream) {
    return (
      <PlaceholderView>
        <PlaceholderAvatar>
          <AvatarText>{remoteUserName?.[0]?.toUpperCase() || '?'}</AvatarText>
        </PlaceholderAvatar>
        <StatusTextLarge>{remoteUserName}</StatusTextLarge>
        <StatusTextSmall>{getStatusMessage()}</StatusTextSmall>
      </PlaceholderView>
    )
  }

  // Android video rendering
  if (Platform.OS === 'android' && RTCView) {
    return (
      <RemoteVideoWrapper>
        <RTCView
          streamURL={remoteStream.toURL()}
          style={{ width: '100%', height: '100%', backgroundColor: '#0f172a' }}
          objectFit="cover"
          mirror={false}
          zOrder={0}
        />
      </RemoteVideoWrapper>
    )
  }

  // iOS video rendering
  if (Platform.OS === 'ios' && Video) {
    return (
      <RemoteVideoWrapper>
        <Video
          source={{ uri: remoteStream.toURL() }}
          style={{ width: '100%', height: '100%' }}
          shouldPlay
          isMuted={false}
          resizeMode="cover"
          useNativeControls={false}
        />
      </RemoteVideoWrapper>
    )
  }

  // Web video rendering
  if (Platform.OS === 'web') {
    return (
      <RemoteVideoWrapper>
        <video
          ref={(video) => {
            if (video && remoteStream) {
              video.srcObject = remoteStream
              video.muted = true // 🔑 REQUIRED
              video.play().catch(() => {})
            }
          }}
          autoPlay
          playsInline
          muted // 🔑 REQUIRED
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#0f172a',
          }}
        />
      </RemoteVideoWrapper>
    )
  }

  // Fallback placeholder for unsupported platforms
  return (
    <PlaceholderView>
      <PlaceholderAvatar>
        <AvatarText>{remoteUserName?.[0]?.toUpperCase() || '?'}</AvatarText>
      </PlaceholderAvatar>
      <StatusTextLarge>{remoteUserName}</StatusTextLarge>
      <StatusTextSmall>Video stream not available</StatusTextSmall>
    </PlaceholderView>
  )
}
