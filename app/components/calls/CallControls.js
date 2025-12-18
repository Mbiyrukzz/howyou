import React from 'react'
import { Platform, Vibration, Alert } from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'

const ControlsContainer = styled.View`
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  padding: 24px 16px;
  padding-bottom: ${Platform.OS === 'ios' ? '40px' : '24px'};
  background-color: rgba(15, 23, 42, 0.98);
  border-top-width: 1px;
  border-top-color: rgba(148, 163, 184, 0.2);
  shadow-color: #000;
  shadow-offset: 0px -4px;
  shadow-opacity: 0.15;
  shadow-radius: 12px;
  elevation: 8;
`

const ControlButton = styled.TouchableOpacity`
  background-color: ${(props) =>
    props.active ? 'rgba(239, 68, 68, 0.15)' : 'rgba(148, 163, 184, 0.1)'};
  width: 56px;
  height: 56px;
  border-radius: 28px;
  justify-content: center;
  align-items: center;
  border-width: 1.5px;
  border-color: ${(props) =>
    props.active ? 'rgba(239, 68, 68, 0.3)' : 'rgba(148, 163, 184, 0.2)'};
  shadow-color: ${(props) => (props.active ? '#ef4444' : '#000')};
  shadow-offset: 0px 2px;
  shadow-opacity: ${(props) => (props.active ? 0.3 : 0.1)};
  shadow-radius: 6px;
  elevation: 3;
`

const EndCallButton = styled.TouchableOpacity`
  background-color: #ef4444;
  width: 64px;
  height: 64px;
  border-radius: 32px;
  justify-content: center;
  align-items: center;
  shadow-color: #ef4444;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.5;
  shadow-radius: 10px;
  elevation: 8;
  border-width: 2px;
  border-color: rgba(255, 255, 255, 0.1);
`

const ScreenShareButton = styled.TouchableOpacity`
  background-color: ${(props) =>
    props.active ? '#3b82f6' : 'rgba(148, 163, 184, 0.1)'};
  width: 56px;
  height: 56px;
  border-radius: 28px;
  justify-content: center;
  align-items: center;
  border-width: 1.5px;
  border-color: ${(props) =>
    props.active ? 'rgba(59, 130, 246, 0.5)' : 'rgba(148, 163, 184, 0.2)'};
  shadow-color: ${(props) => (props.active ? '#3b82f6' : '#000')};
  shadow-offset: 0px 2px;
  shadow-opacity: ${(props) => (props.active ? 0.4 : 0.1)};
  shadow-radius: 6px;
  elevation: 3;
  opacity: ${(props) => (props.disabled ? 0.4 : 1)};
`

const ButtonLabel = styled.Text`
  font-size: 11px;
  color: ${(props) => (props.active ? '#ef4444' : '#94a3b8')};
  margin-top: 6px;
  font-weight: 600;
  text-align: center;
`

const ControlButtonWrapper = styled.View`
  align-items: center;
  min-width: 70px;
`

const BadgeContainer = styled.View`
  position: absolute;
  top: -2px;
  right: -2px;
  background-color: #ef4444;
  border-radius: 8px;
  min-width: 16px;
  height: 16px;
  justify-content: center;
  align-items: center;
  border-width: 2px;
  border-color: #0f172a;
`

const BadgeText = styled.Text`
  color: #fff;
  font-size: 10px;
  font-weight: bold;
`

export function CallControls({
  isMuted,
  isVideoEnabled,
  isScreenSharing,
  callType,
  onToggleMute,
  onToggleVideo,
  onEndCall,
  onToggleSpeaker,
  onToggleScreenShare,
  onSwitchCamera,
}) {
  const handleButtonPress = (callback) => {
    if (Platform.OS !== 'web') {
      Vibration.vibrate(50)
    }
    callback()
  }

  const handleScreenSharePress = () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'Screen Sharing on iOS',
        'Screen sharing on iOS requires a Broadcast Upload Extension. This feature captures screenshots every second and sends them to the other participant.\n\nFor higher quality screen sharing, consider using the web version.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable Anyway',
            onPress: () => handleButtonPress(onToggleScreenShare),
          },
        ]
      )
    } else if (Platform.OS === 'android') {
      Alert.alert(
        'Screen Sharing on Android',
        'This feature captures screenshots every second and sends them to the other participant.\n\nNote: Android 10+ required.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start Sharing',
            onPress: () => handleButtonPress(onToggleScreenShare),
          },
        ]
      )
    } else {
      // Web - direct screen share
      handleButtonPress(onToggleScreenShare)
    }
  }

  // Determine which controls to show based on call type
  const showVideoControls = callType === 'video'

  return (
    <ControlsContainer>
      {/* Mute Button */}
      <ControlButtonWrapper>
        <ControlButton
          onPress={() => handleButtonPress(onToggleMute)}
          active={isMuted}
        >
          <Ionicons
            name={isMuted ? 'mic-off' : 'mic'}
            size={24}
            color={isMuted ? '#ef4444' : '#fff'}
          />
        </ControlButton>
        <ButtonLabel active={isMuted}>
          {isMuted ? 'Unmute' : 'Mute'}
        </ButtonLabel>
      </ControlButtonWrapper>

      {/* Video Controls - Only show for video calls */}
      {showVideoControls && (
        <>
          {/* Toggle Video Button */}
          <ControlButtonWrapper>
            <ControlButton
              onPress={() => handleButtonPress(onToggleVideo)}
              active={!isVideoEnabled}
            >
              <Ionicons
                name={isVideoEnabled ? 'videocam' : 'videocam-off'}
                size={24}
                color={!isVideoEnabled ? '#ef4444' : '#fff'}
              />
            </ControlButton>
            <ButtonLabel active={!isVideoEnabled}>
              {isVideoEnabled ? 'Video' : 'Video'}
            </ButtonLabel>
          </ControlButtonWrapper>

          {/* Camera Flip Button - Mobile only */}
          {Platform.OS !== 'web' && (
            <ControlButtonWrapper>
              <ControlButton onPress={() => handleButtonPress(onSwitchCamera)}>
                <Ionicons name="camera-reverse" size={24} color="#fff" />
              </ControlButton>
              <ButtonLabel>Flip</ButtonLabel>
            </ControlButtonWrapper>
          )}

          {/* Screen Share Button */}
          <ControlButtonWrapper>
            <ScreenShareButton
              onPress={handleScreenSharePress}
              active={isScreenSharing}
              disabled={false}
            >
              <Ionicons
                name={isScreenSharing ? 'stop-circle' : 'desktop-outline'}
                size={24}
                color={isScreenSharing ? '#fff' : '#cbd5e1'}
              />
              {isScreenSharing && Platform.OS !== 'web' && (
                <BadgeContainer>
                  <Ionicons name="camera" size={10} color="#fff" />
                </BadgeContainer>
              )}
            </ScreenShareButton>
            <ButtonLabel active={isScreenSharing}>
              {isScreenSharing ? 'Stop' : 'Share'}
            </ButtonLabel>
          </ControlButtonWrapper>
        </>
      )}

      {/* End Call Button */}
      <ControlButtonWrapper>
        <EndCallButton onPress={() => handleButtonPress(onEndCall)}>
          <Ionicons name="call" size={28} color="#fff" />
        </EndCallButton>
        <ButtonLabel style={{ color: '#ef4444', fontWeight: '700' }}>
          End
        </ButtonLabel>
      </ControlButtonWrapper>

      {/* Speaker Button */}
      <ControlButtonWrapper>
        <ControlButton onPress={() => handleButtonPress(onToggleSpeaker)}>
          <Ionicons name="volume-high" size={24} color="#fff" />
        </ControlButton>
        <ButtonLabel>Speaker</ButtonLabel>
      </ControlButtonWrapper>
    </ControlsContainer>
  )
}
