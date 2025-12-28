import React from 'react'
import { View } from 'react-native'
import styled from 'styled-components/native'
import { VideoView } from '@livekit/react-native'

const Container = styled.View`
  flex: 1;
  background-color: #0a0e1a;
`

const CenterView = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  background: #0f172a;
`

const RemoteVideoWrapper = styled.View`
  flex: 1;
  position: relative;
`

const LocalVideoWrapper = styled.View`
  position: absolute;
  right: 16px;
  bottom: 24px;
  width: 120px;
  height: 180px;
  border-radius: 16px;
  overflow: hidden;
  border-width: 3px;
  border-color: rgba(255, 255, 255, 0.2);
  shadow-color: #000;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.4;
  shadow-radius: 12px;
  elevation: 12;
`

const AvatarContainer = styled.View`
  position: relative;
  margin-bottom: 24px;
`

const Avatar = styled.View`
  width: 96px;
  height: 96px;
  border-radius: 48px;
  background: #2563eb;
  align-items: center;
  justify-content: center;
  shadow-color: #3b82f6;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 16px;
  elevation: 8;
  border-width: 3px;
  border-color: rgba(255, 255, 255, 0.1);
`

const AvatarText = styled.Text`
  color: #ffffff;
  font-size: 40px;
  font-weight: 700;
  letter-spacing: 1px;
`

const StatusContainer = styled.View`
  align-items: center;
  gap: 8px;
`

const StatusText = styled.Text`
  color: #e2e8f0;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.5px;
`

const StatusDot = styled.View`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${(props) => (props.isConnected ? '#10b981' : '#f59e0b')};
  margin-bottom: 4px;
`

const PulseRing = styled.View`
  position: absolute;
  width: 112px;
  height: 112px;
  border-radius: 56px;
  border-width: 2px;
  border-color: rgba(59, 130, 246, 0.3);
  top: -8px;
  left: -8px;
`

const WaitingOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.95);
  align-items: center;
  justify-content: center;
`

const VideoViewStyled = styled(VideoView)`
  flex: 1;
`

const LocalVideoViewStyled = styled(VideoView)`
  flex: 1;
`

export const LiveKitVideoView = ({
  localVideoTrack,
  remoteVideoTrack,
  callType,
  isVideoEnabled,
  remoteUserName,
  callStatus,
  isConnected,
}) => {
  const initials = remoteUserName?.[0]?.toUpperCase() ?? '?'

  if (callType === 'voice') {
    return (
      <CenterView>
        <AvatarContainer>
          <PulseRing />
          <Avatar>
            <AvatarText>{initials}</AvatarText>
          </Avatar>
        </AvatarContainer>
        <StatusContainer>
          <StatusDot isConnected={isConnected} />
          <StatusText>{isConnected ? 'Connected' : callStatus}</StatusText>
        </StatusContainer>
      </CenterView>
    )
  }

  return (
    <Container>
      <RemoteVideoWrapper>
        {remoteVideoTrack ? (
          <VideoViewStyled track={remoteVideoTrack} />
        ) : (
          <WaitingOverlay>
            <AvatarContainer>
              <PulseRing />
              <Avatar>
                <AvatarText>{initials}</AvatarText>
              </Avatar>
            </AvatarContainer>
            <StatusContainer>
              <StatusDot isConnected={false} />
              <StatusText>Waiting for video…</StatusText>
            </StatusContainer>
          </WaitingOverlay>
        )}
      </RemoteVideoWrapper>

      {localVideoTrack && isVideoEnabled && (
        <LocalVideoWrapper>
          <LocalVideoViewStyled track={localVideoTrack} mirror />
        </LocalVideoWrapper>
      )}
    </Container>
  )
}
