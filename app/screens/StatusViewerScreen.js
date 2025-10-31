import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native'
import styled from 'styled-components/native'
import { Video } from 'expo-av'
import { Ionicons } from '@expo/vector-icons'
import { usePosts } from '../providers/PostsProvider'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const Container = styled.View`
  flex: 1;
  background-color: #000;
`

const StatusImage = styled.Image`
  width: 100%;
  height: 100%;
`

const VideoContainer = styled.View`
  width: 100%;
  height: 100%;
`

const ProgressBarContainer = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  flex-direction: row;
  height: 3px;
  background-color: rgba(255, 255, 255, 0.3);
`

const ProgressBar = styled.View`
  flex: ${(props) => props.progress || 0};
  background-color: #fff;
`

const Header = styled.View`
  position: absolute;
  top: 40px;
  left: 0;
  right: 0;
  flex-direction: row;
  align-items: center;
  padding: 0 16px;
  z-index: 10;
`

const Avatar = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${(props) => props.color || '#3498db'};
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`

const AvatarText = styled.Text`
  color: #fff;
  font-weight: bold;
  font-size: 16px;
`

const UserInfo = styled.View`
  flex: 1;
`

const Username = styled.Text`
  color: #fff;
  font-weight: 600;
  font-size: 16px;
`

const Timestamp = styled.Text`
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
`

const CloseButton = styled.TouchableOpacity`
  padding: 8px;
`

const DeleteButton = styled.TouchableOpacity`
  padding: 8px;
`

const Caption = styled.Text`
  position: absolute;
  bottom: 80px;
  left: 16px;
  right: 16px;
  color: #fff;
  font-size: 16px;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 12px;
  border-radius: 8px;
`

const getInitials = (name) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)

export default function StatusViewerScreen({ route, navigation }) {
  const { status: initialStatus } = route.params
  const { statuses, deleteStatus } = usePosts()

  const [currentIndex, setCurrentIndex] = useState(
    statuses.findIndex((s) => s._id === initialStatus._id)
  )
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const videoRef = useRef(null)
  const timerRef = useRef(null)

  const currentStatus = statuses[currentIndex]

  const DURATION = 5000 // 5 seconds per status

  useEffect(() => {
    if (!currentStatus) return

    // Reset progress
    setProgress(0)
    setIsPaused(false)

    // Start timer
    const startTime = Date.now()
    timerRef.current = setInterval(() => {
      if (isPaused) return

      const elapsed = Date.now() - startTime
      const newProgress = Math.min(elapsed / DURATION, 1)

      setProgress(newProgress)

      if (newProgress >= 1) {
        goToNext()
      }
    }, 50)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentIndex, isPaused])

  const goToNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      navigation.goBack()
    }
  }

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleTap = (e) => {
    const { locationX } = e.nativeEvent
    const third = SCREEN_WIDTH / 3

    if (locationX < third) {
      goToPrev()
    } else if (locationX > 2 * third) {
      goToNext()
    } else {
      setIsPaused(!isPaused)
    }
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Status',
      'Are you sure you want to delete your status?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteStatus(currentStatus._id)
            navigation.goBack()
          },
        },
      ]
    )
  }

  if (!currentStatus) {
    return (
      <Container>
        <ActivityIndicator size="large" color="#fff" />
      </Container>
    )
  }

  const isVideo = currentStatus.fileType?.startsWith('video/')

  return (
    <Container>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleTap}
        style={{ flex: 1 }}
      >
        {/* Progress Bar */}
        <ProgressBarContainer>
          {statuses.map((_, i) => (
            <ProgressBar
              key={i}
              progress={
                i < currentIndex ? 1 : i === currentIndex ? progress : 0
              }
            />
          ))}
        </ProgressBarContainer>

        {/* Header */}
        <Header>
          <Avatar color={currentStatus.userAvatarColor}>
            <AvatarText>{getInitials(currentStatus.userName)}</AvatarText>
          </Avatar>
          <UserInfo>
            <Username>{currentStatus.userName}</Username>
            <Timestamp>
              {new Date(currentStatus.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Timestamp>
          </UserInfo>
          <CloseButton onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#fff" />
          </CloseButton>
          {currentStatus.userId === initialStatus.userId && (
            <DeleteButton onPress={handleDelete}>
              <Ionicons name="trash-outline" size={24} color="#fff" />
            </DeleteButton>
          )}
        </Header>

        {/* Media */}
        {isVideo ? (
          <VideoContainer>
            <Video
              ref={videoRef}
              source={{ uri: currentStatus.fileUrl }}
              rate={1.0}
              volume={1.0}
              isMuted={false}
              resizeMode="contain"
              shouldPlay={!isPaused}
              isLooping={false}
              useNativeControls={false}
              style={{ width: '100%', height: '100%' }}
              onPlaybackStatusUpdate={(status) => {
                if (status.didJustFinish) {
                  goToNext()
                }
              }}
            />
          </VideoContainer>
        ) : (
          <StatusImage
            source={{ uri: currentStatus.fileUrl }}
            resizeMode="contain"
          />
        )}

        {/* Caption */}
        {currentStatus.caption ? (
          <Caption>{currentStatus.caption}</Caption>
        ) : null}

        {/* Pause Indicator */}
        {isPaused && (
          <View
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: [{ translateX: -30 }, { translateY: -30 }],
            }}
          >
            <Ionicons name="pause" size={60} color="rgba(255,255,255,0.8)" />
          </View>
        )}
      </TouchableOpacity>
    </Container>
  )
}
