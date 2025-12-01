import React from 'react'
import { Video } from 'expo-av'
import { Ionicons } from '@expo/vector-icons'
import {
  MessageVideoContainer,
  VideoPlayerOverlay,
  VideoPlayButton,
} from '../../styles/chatStyles'
import styled from 'styled-components/native'

// Additional styled components for enhanced design
const VideoDurationBadge = styled.View`
  position: absolute;
  bottom: 12px;
  right: 12px;
  background-color: rgba(0, 0, 0, 0.75);
  padding: 6px 10px;
  border-radius: 8px;
  flex-direction: row;
  align-items: center;
`

const DurationText = styled.Text`
  color: white;
  font-size: 12px;
  font-weight: 700;
  margin-left: 4px;
`

const VideoTypeBadge = styled.View`
  position: absolute;
  top: 12px;
  left: 12px;
  background-color: rgba(59, 130, 246, 0.9);
  padding: 6px 10px;
  border-radius: 8px;
  flex-direction: row;
  align-items: center;
`

const TypeText = styled.Text`
  color: white;
  font-size: 11px;
  font-weight: 700;
  margin-left: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

export const VideoAttachment = ({
  videoUrl,
  hasText,
  onPress,
  duration = '0:00',
  showBadges = true,
}) => {
  return (
    <MessageVideoContainer
      hasText={hasText}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Video
        source={{ uri: videoUrl }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
        shouldPlay={false}
        useNativeControls={false}
        isLooping={false}
      />

      <VideoPlayerOverlay>
        <VideoPlayButton activeOpacity={0.8}>
          <Ionicons name="play" size={28} color="#3b82f6" />
        </VideoPlayButton>
      </VideoPlayerOverlay>

      {showBadges && (
        <>
          <VideoTypeBadge>
            <Ionicons name="videocam" size={14} color="white" />
            <TypeText>Video</TypeText>
          </VideoTypeBadge>

          {duration && duration !== '0:00' && (
            <VideoDurationBadge>
              <Ionicons name="time-outline" size={14} color="white" />
              <DurationText>{duration}</DurationText>
            </VideoDurationBadge>
          )}
        </>
      )}
    </MessageVideoContainer>
  )
}
