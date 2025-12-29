import React, { useEffect, useRef } from 'react'
import { View, Text, Platform } from 'react-native'
import styled from 'styled-components/native'

// ✅ Import VideoView from @livekit/react-native
let VideoView = null
let AudioSession = null

try {
  const LiveKitRN = require('@livekit/react-native')
  VideoView = LiveKitRN.VideoView
  AudioSession = LiveKitRN.AudioSession
  console.log('✅ Successfully loaded @livekit/react-native')
  console.log('📦 Available exports:', Object.keys(LiveKitRN))
} catch (error) {
  console.error('❌ Failed to load @livekit/react-native:', error)
  console.error(
    '📦 Make sure you have installed: npm install @livekit/react-native'
  )
}

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

const ErrorText = styled.Text`
  color: #ef4444;
  font-size: 13px;
  text-align: center;
  padding-horizontal: 40px;
  margin-top: 8px;
`

// ✅ Native video element using @livekit/react-native VideoView
const NativeVideoElement = ({ track, mirrored = false }) => {
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  // ✅ Configure audio session for calls
  useEffect(() => {
    if (AudioSession && track?.kind === 'audio') {
      const configureAudio = async () => {
        try {
          await AudioSession.configureAudio({
            android: {
              preferredOutputList: ['speaker', 'earpiece'],
              audioContentType: 'speech',
              audioMode: 'communication',
            },
            ios: {
              categoryOptions: ['allowBluetooth', 'allowBluetoothA2DP'],
            },
          })
          console.log('✅ Audio session configured')
        } catch (error) {
          console.error('❌ Failed to configure audio session:', error)
        }
      }
      configureAudio()
    }
  }, [track])

  if (!VideoView) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
        <PlaceholderView>
          <PlaceholderContent>
            <Avatar size={72}>
              <AvatarText size={32}>⚠️</AvatarText>
            </Avatar>
            <Text style={{ color: '#e2e8f0', fontSize: 16, fontWeight: '600' }}>
              VideoView Not Available
            </Text>
            <ErrorText>
              @livekit/react-native is not installed or failed to load.{'\n'}
              Run: npm install @livekit/react-native
            </ErrorText>
            <ErrorText style={{ marginTop: 12, fontSize: 11 }}>
              After installation, rebuild with: expo prebuild --clean
            </ErrorText>
          </PlaceholderContent>
        </PlaceholderView>
      </View>
    )
  }

  if (!track) {
    console.log('⚠️ Native video: no track provided')
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
        <PlaceholderView>
          <Text style={{ color: '#94a3b8', fontSize: 14 }}>No video track</Text>
        </PlaceholderView>
      </View>
    )
  }

  console.log('📹 Native VideoView rendering:', {
    kind: track.kind,
    sid: track.sid,
    enabled: track.enabled,
    muted: track.muted,
    mirrored,
    trackState: track.mediaStreamTrack?.readyState,
  })

  // ✅ Use the actual VideoView component from @livekit/react-native
  return (
    <VideoView
      style={{
        flex: 1,
        backgroundColor: '#0f172a',
        width: '100%',
        height: '100%',
      }}
      track={track}
      mirror={mirrored}
      objectFit="cover"
      zOrder={0}
    />
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
  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }

  // ✅ Log track states for debugging
  useEffect(() => {
    console.log('📊 LiveKitVideoView Native track states:', {
      platform: Platform.OS,
      callType,
      isVideoEnabled,
      isConnected,
      VideoViewAvailable: !!VideoView,
      localTrack: localVideoTrack
        ? {
            kind: localVideoTrack.kind,
            sid: localVideoTrack.sid,
            enabled: localVideoTrack.enabled,
            muted: localVideoTrack.muted,
            readyState: localVideoTrack.mediaStreamTrack?.readyState,
          }
        : null,
      remoteTrack: remoteVideoTrack
        ? {
            kind: remoteVideoTrack.kind,
            sid: remoteVideoTrack.sid,
            enabled: remoteVideoTrack.enabled,
            muted: remoteVideoTrack.muted,
            readyState: remoteVideoTrack.mediaStreamTrack?.readyState,
          }
        : null,
    })
  }, [localVideoTrack, remoteVideoTrack, callType, isVideoEnabled, isConnected])

  const renderRemoteView = () => {
    // Voice call - show avatar
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

    // Video call - show video or waiting state
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

    // ✅ Render actual video
    return <NativeVideoElement track={remoteVideoTrack} mirrored={false} />
  }

  const renderLocalView = () => {
    // Don't show local video for voice calls
    if (callType === 'voice') {
      return null
    }

    // Show placeholder if video disabled or no track
    if (!isVideoEnabled || !localVideoTrack) {
      return (
        <LocalPlaceholder>
          <SmallAvatar>
            <SmallAvatarText>You</SmallAvatarText>
          </SmallAvatar>
        </LocalPlaceholder>
      )
    }

    // ✅ Render local video (mirrored)
    return <NativeVideoElement track={localVideoTrack} mirrored={true} />
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
