// screens/VideoPlayerScreen.js
import React, { useState, useRef } from 'react'
import {
  View,
  TouchableOpacity,
  Platform,
  StatusBar,
  PanResponder,
} from 'react-native'
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

const ControlsOverlay = styled.View`
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

const CenterControls = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  width: 100%;
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

const ProgressBarContainer = styled.View`
  flex: 1;
  height: 40px;
  justify-content: center;
`

const ProgressBar = styled.View`
  height: 4px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: visible;
`

const ProgressFill = styled.View`
  height: 100%;
  background-color: white;
  width: ${(props) => props.progress}%;
`

const Scrubber = styled.View`
  position: absolute;
  left: ${(props) => props.progress}%;
  top: 50%;
  margin-left: -8px;
  margin-top: -8px;
  width: 16px;
  height: 16px;
  border-radius: 8px;
  background-color: white;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.3;
  shadow-radius: 3px;
  elevation: 5;
`

export default function VideoPlayerScreen({ navigation, route }) {
  const { videoUrl } = route.params
  const [isPlaying, setIsPlaying] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [status, setStatus] = useState({})
  const [isSeeking, setIsSeeking] = useState(false)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const videoRef = useRef(null)
  const progressBarRef = useRef(null)
  const progressBarLayout = useRef({ width: 0 })
  const seekStartX = useRef(0)

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
    if (!isSeeking) {
      setShowControls(!showControls)
    }
  }

  const formatTime = (millis) => {
    if (!millis) return '0:00'
    const totalSeconds = Math.floor(millis / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const seekToPosition = async (percentage) => {
    console.log('seekToPosition called with percentage:', percentage)
    console.log('videoRef.current:', videoRef.current ? 'exists' : 'null')
    console.log('status.durationMillis:', status.durationMillis)

    if (videoRef.current && status.durationMillis) {
      const position = percentage * status.durationMillis
      const seekPosition = Math.max(
        0,
        Math.min(position, status.durationMillis)
      )
      console.log('Seeking to position:', seekPosition, 'ms')
      try {
        await videoRef.current.setPositionAsync(seekPosition)
        console.log('Seek completed')
      } catch (error) {
        console.error('Seek error:', error)
      }
    } else {
      console.log('Cannot seek - missing videoRef or duration')
    }
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt, gestureState) => {
        console.log('Touch started!')

        // Don't allow seeking until video is ready
        if (!isVideoReady || !status.durationMillis) {
          console.log('Video not ready for seeking yet')
          return
        }

        setIsSeeking(true)
        setShowControls(true)

        // Store the initial X position relative to the progress bar
        seekStartX.current = evt.nativeEvent.locationX

        const percentage = Math.max(
          0,
          Math.min(seekStartX.current / progressBarLayout.current.width, 1)
        )
        console.log(
          'Initial Touch X:',
          seekStartX.current,
          'Percentage:',
          percentage
        )
        seekToPosition(percentage)
      },
      onPanResponderMove: (evt, gestureState) => {
        console.log(
          'Touch moving! dx:',
          gestureState.dx,
          'moveX:',
          gestureState.moveX
        )
        if (progressBarLayout.current.width && status.durationMillis) {
          // Calculate position: initial touch + how far we've moved
          const currentX = seekStartX.current + gestureState.dx
          const percentage = Math.max(
            0,
            Math.min(currentX / progressBarLayout.current.width, 1)
          )
          console.log('Current X:', currentX, 'Percentage:', percentage)
          seekToPosition(percentage)
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        console.log('Touch released!')
        if (progressBarLayout.current.width && status.durationMillis) {
          const currentX = seekStartX.current + gestureState.dx
          const percentage = Math.max(
            0,
            Math.min(currentX / progressBarLayout.current.width, 1)
          )
          seekToPosition(percentage)
        }
        setTimeout(() => setIsSeeking(false), 100)
      },
    })
  ).current

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
          useNativeControls={false}
          shouldPlay={false}
          onPlaybackStatusUpdate={(newStatus) => {
            console.log(
              'Status update - isLoaded:',
              newStatus.isLoaded,
              'duration:',
              newStatus.durationMillis
            )
            if (newStatus.isLoaded) {
              // Always update status when we first get duration
              if (newStatus.durationMillis && !status.durationMillis) {
                console.log(
                  'Setting initial status with duration:',
                  newStatus.durationMillis
                )
                setStatus(newStatus)
                setIsVideoReady(true)
              }
              // Only update position/playing state when not seeking
              else if (!isSeeking) {
                setStatus(newStatus)
                if (newStatus.isPlaying !== isPlaying) {
                  setIsPlaying(newStatus.isPlaying)
                }
              }
            }
          }}
          onLoad={(data) => {
            console.log('Video loaded:', data)
            // Force initial status update
            if (videoRef.current) {
              videoRef.current.getStatusAsync().then((status) => {
                console.log('Initial status:', status)
                if (status.isLoaded && status.durationMillis) {
                  setStatus(status)
                  setIsVideoReady(true)
                }
              })
            }
          }}
          onError={(error) => console.error('Video ERROR:', error)}
        />

        <ControlsOverlay showControls={showControls} pointerEvents="box-none">
          {showControls && (
            <>
              <CenterControls>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    width: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={toggleControls}
                  activeOpacity={1}
                >
                  <PlayPauseButton onPress={handlePlayPause}>
                    <Ionicons
                      name={isPlaying ? 'pause' : 'play'}
                      size={40}
                      color="#2c3e50"
                    />
                  </PlayPauseButton>
                </TouchableOpacity>
              </CenterControls>

              <ControlsBar>
                <TimeText>{formatTime(status.positionMillis)}</TimeText>
                <ProgressBarContainer
                  ref={progressBarRef}
                  onLayout={(e) => {
                    progressBarLayout.current = {
                      width: e.nativeEvent.layout.width,
                    }
                    console.log(
                      'Progress bar width:',
                      e.nativeEvent.layout.width
                    )
                  }}
                  {...panResponder.panHandlers}
                >
                  <ProgressBar>
                    <ProgressFill progress={progress} />
                    <Scrubber progress={progress} />
                  </ProgressBar>
                </ProgressBarContainer>
                <TimeText>{formatTime(status.durationMillis)}</TimeText>
              </ControlsBar>
            </>
          )}
        </ControlsOverlay>
      </VideoContainer>
    </Container>
  )
}
