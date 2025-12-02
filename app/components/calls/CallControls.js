import React from 'react'
import { Platform } from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'

const ControlsContainer = styled.View`
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  padding: 24px 20px;
  padding-bottom: ${Platform.OS === 'ios' ? '40px' : '24px'};
  background-color: rgba(255, 255, 255, 0.98);
  border-top-width: 1px;
  border-top-color: #e2e8f0;
  shadow-color: #000;
  shadow-offset: 0px -2px;
  shadow-opacity: 0.08;
  shadow-radius: 8px;
  elevation: 3;
`

const ControlButton = styled.TouchableOpacity`
  background-color: ${(props) => (props.active ? '#e2e8f0' : '#f8fafc')};
  width: 56px;
  height: 56px;
  border-radius: 28px;
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-color: #e2e8f0;
  shadow-color: ${(props) => (props.active ? '#64748b' : '#000')};
  shadow-offset: 0px 2px;
  shadow-opacity: ${(props) => (props.active ? 0.15 : 0.08)};
  shadow-radius: 4px;
  elevation: 2;
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
  shadow-opacity: 0.4;
  shadow-radius: 8px;
  elevation: 6;
`

const ButtonLabel = styled.Text`
  font-size: 11px;
  color: #64748b;
  margin-top: 6px;
  font-weight: 600;
  text-align: center;
`

const ControlButtonWrapper = styled.View`
  align-items: center;
`

export function CallControls({
  isMuted,
  isVideoEnabled,
  callType,
  onToggleMute,
  onToggleVideo,
  onEndCall,
  onToggleSpeaker,
}) {
  return (
    <ControlsContainer>
      <ControlButtonWrapper>
        <ControlButton onPress={onToggleMute} active={isMuted}>
          <Ionicons
            name={isMuted ? 'mic-off' : 'mic'}
            size={26}
            color={isMuted ? '#ef4444' : '#1e293b'}
          />
        </ControlButton>
        <ButtonLabel>{isMuted ? 'Unmute' : 'Mute'}</ButtonLabel>
      </ControlButtonWrapper>

      {callType === 'video' && (
        <ControlButtonWrapper>
          <ControlButton onPress={onToggleVideo} active={!isVideoEnabled}>
            <Ionicons
              name={isVideoEnabled ? 'videocam' : 'videocam-off'}
              size={26}
              color={!isVideoEnabled ? '#ef4444' : '#1e293b'}
            />
          </ControlButton>
          <ButtonLabel>
            {isVideoEnabled ? 'Stop Video' : 'Start Video'}
          </ButtonLabel>
        </ControlButtonWrapper>
      )}

      <ControlButtonWrapper>
        <EndCallButton onPress={onEndCall}>
          <Ionicons name="call" size={28} color="#fff" />
        </EndCallButton>
        <ButtonLabel style={{ color: '#ef4444' }}>End</ButtonLabel>
      </ControlButtonWrapper>

      <ControlButtonWrapper>
        <ControlButton onPress={onToggleSpeaker}>
          <Ionicons name="volume-high" size={26} color="#1e293b" />
        </ControlButton>
        <ButtonLabel>Speaker</ButtonLabel>
      </ControlButtonWrapper>
    </ControlsContainer>
  )
}
