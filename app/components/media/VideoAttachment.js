import React from 'react'
import { Video } from 'expo-av'
import { Ionicons } from '@expo/vector-icons'
import {
  MessageVideoContainer,
  VideoPlayerOverlay,
  VideoPlayButton,
} from '../../styles/chatStyles'

export const VideoAttachment = ({ videoUrl, hasText, onPress }) => {
  return (
    <MessageVideoContainer hasText={hasText} onPress={onPress}>
      <Video
        source={{ uri: videoUrl }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
        shouldPlay={false}
        useNativeControls={false}
        isLooping={false}
      />
      <VideoPlayerOverlay>
        <VideoPlayButton>
          <Ionicons name="play" size={30} color="#2c3e50" />
        </VideoPlayButton>
      </VideoPlayerOverlay>
    </MessageVideoContainer>
  )
}
