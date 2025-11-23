// screens/VideoPlayerScreen.js
import React, { useState, useRef } from 'react'
import { View, TouchableOpacity, Platform, StatusBar } from 'react-native'
import styled from 'styled-components/native'
import { Video } from 'expo-av'
import { Ionicons } from '@expo/vector-icons'

const Container = styled.View`
  flex: 1;
  background-color: #000;
`

const Header = styled.View`
  position: absolute;
  top: ${Platform.OS === 'ios' ? '50px' : '30px'};
  left: 0;
  right: 0;
  flex-direction: row;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 10;
`

const BackButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
`

const VideoContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`

const ControlsOverlay = styled.TouchableOpacity`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  justify-content: center;
  align-items: center;
  background-color: ${(props) =>
    props.showControls ? 'rgba(0, 0, 0, 0.3)' : 'transparent'};
`

const PlayPauseButton = styled.TouchableOpacity`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  background-color: rgba(255, 255, 255, 0.9);
  justify-content: center;
  align-items: center;
`

const ControlsBar = styled.View`
  position: absolute;
  bottom: 30px;
  left: 20px;
  right: 20px;
  flex-direction: row;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 10px 15px;
  border-radius: 25px;
`

const TimeText = styled.Text`
  color: white;
  font-size: 12px;
  margin: 0 10px;
  min-width: 40px;
`

const ProgressBar = styled.View`
  flex: 1;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
`

const ProgressFill = styled.View`
  height: 100%;
  background-color: white;
  width: ${(props) => props.progress}%;
`

export default function VideoPlayerScreen({ navigation, route }) {
  const { videoUrl } = route.params
  const [isPlaying, setIsPlaying] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [status, setStatus] = useState({})
  const videoRef = useRef(null)

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync()
      } else {
        await videoRef.current.playAsync()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleControls = () => {
    setShowControls(!showControls)
  }

  const formatTime = (millis) => {
    if (!millis) return '0:00'
    const totalSeconds = Math.floor(millis / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = status.durationMillis
    ? (status.positionMillis / status.durationMillis) * 100
    : 0

  return (
    <Container>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <Header>
        <BackButton onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </BackButton>
      </Header>

      <VideoContainer>
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
          shouldPlay={false}
          useNativeControls={false}
          onPlaybackStatusUpdate={setStatus}
        />

        <ControlsOverlay
          activeOpacity={1}
          onPress={toggleControls}
          showControls={showControls}
        >
          {showControls && (
            <>
              <PlayPauseButton onPress={handlePlayPause}>
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={40}
                  color="#2c3e50"
                />
              </PlayPauseButton>

              <ControlsBar>
                <TimeText>{formatTime(status.positionMillis)}</TimeText>
                <ProgressBar>
                  <ProgressFill progress={progress} />
                </ProgressBar>
                <TimeText>{formatTime(status.durationMillis)}</TimeText>
              </ControlsBar>
            </>
          )}
        </ControlsOverlay>
      </VideoContainer>
    </Container>
  )
}
