// screens/StatusViewerScreen.js - FIXED Video Playback
import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native'
import styled from 'styled-components/native'
import { Video } from 'expo-av'
import { Ionicons } from '@expo/vector-icons'
import { usePosts } from '../providers/PostsProvider'
import { useStatusViews } from '../hooks/useStatusViews'
import { StatusViewersModal } from '../components/StatusViewersModal'

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
  background-color: #000;
  justify-content: center;
  align-items: center;
`

const LoadingContainer = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 5;
`

const LoadingText = styled.Text`
  color: #fff;
  font-size: 16px;
  margin-top: 16px;
  font-weight: 500;
`

const ProgressBarContainer = styled.View`
  position: absolute;
  top: 50px;
  left: 0;
  right: 0;
  flex-direction: row;
  height: 3px;
  padding: 0 8px;
  z-index: 20;
`

const ProgressSegment = styled.View`
  flex: 1;
  margin: 0 2px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
`

const ProgressFill = styled.View`
  height: 100%;
  background-color: #fff;
  width: ${(props) => props.progress * 100}%;
`

const Header = styled.View`
  position: absolute;
  top: 60px;
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
  background-color: ${(props) => props.color || '#3b82f6'};
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
  text-shadow-color: rgba(0, 0, 0, 0.5);
  text-shadow-offset: 0px 1px;
  text-shadow-radius: 3px;
`

const Timestamp = styled.Text`
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  text-shadow-color: rgba(0, 0, 0, 0.5);
  text-shadow-offset: 0px 1px;
  text-shadow-radius: 3px;
`

const CloseButton = styled.TouchableOpacity`
  padding: 8px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 20px;
  width: 40px;
  height: 40px;
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.3);
`

const DeleteButton = styled.TouchableOpacity`
  padding: 8px;
  margin-left: 8px;
  background-color: rgba(220, 53, 69, 0.8);
  border-radius: 20px;
  width: 40px;
  height: 40px;
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.3);
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

const PauseIndicator = styled.View`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translateX(-30px) translateY(-30px);
  z-index: 6;
`

const StatusCounter = styled.Text`
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 600;
  text-shadow-color: rgba(0, 0, 0, 0.5);
  text-shadow-offset: 0px 1px;
  text-shadow-radius: 3px;
  margin-left: 8px;
`

const getInitials = (name) =>
  name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)

const formatTimestamp = (date) => {
  const now = new Date()
  const diff = now - new Date(date)
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)

  if (hours < 1) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return 'Yesterday'
}

export default function StatusViewerScreen({ route, navigation }) {
  const { status, statuses: passedStatuses, userName } = route.params
  const { statuses, myStatus, deleteStatus } = usePosts()

  const { markStatusViewed } = useStatusViews()
  const [viewersModalVisible, setViewersModalVisible] = useState(false)

  const [localStatusList, setLocalStatusList] = useState([])
  const [isViewingOwnStatus, setIsViewingOwnStatus] = useState(false)
  const [videoLoading, setVideoLoading] = useState(true)
  const [videoError, setVideoError] = useState(false)

  // Initialize local state
  useEffect(() => {
    let statusList = []
    let isOwn = false

    if (passedStatuses && passedStatuses.length > 0) {
      statusList = passedStatuses
      isOwn =
        myStatus &&
        myStatus.length > 0 &&
        passedStatuses[0]?.userId === myStatus[0]?.userId
    } else if (status) {
      const statusUserId = status.userId
      isOwn =
        myStatus &&
        myStatus.length > 0 &&
        myStatus.some((s) => s._id === status._id || s.userId === statusUserId)

      if (isOwn) {
        statusList = myStatus || []
      } else {
        const userStatuses = statuses.find((s) => s.userId === statusUserId)
        statusList = userStatuses?.statuses || [status]
      }
    }

    setLocalStatusList(statusList)
    setIsViewingOwnStatus(isOwn)
  }, [status, passedStatuses, myStatus, statuses])

  const initialIndex = status
    ? localStatusList.findIndex((s) => s._id === status._id)
    : 0

  const [currentIndex, setCurrentIndex] = useState(
    initialIndex >= 0 ? initialIndex : 0
  )
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [videoDuration, setVideoDuration] = useState(0)
  const videoRef = useRef(null)
  const timerRef = useRef(null)
  const progressIntervalRef = useRef(null)

  const currentStatus = localStatusList[currentIndex]

  const DURATION = 5000 // Only for images
  const VIDEO_NATURAL_DURATION = true // Let video play its full length

  // Reset video state when changing status
  useEffect(() => {
    setVideoLoading(true)
    setVideoError(false)
    setProgress(0)
    setIsPaused(false)
    setVideoDuration(0)
    console.log('🔄 Status changed, resetting video state')
  }, [currentIndex])

  // ✅ FIX: Ensure audio permissions and proper setup
  useEffect(() => {
    const setupAudio = async () => {
      try {
        // Import Audio from expo-av
        const { Audio } = await import('expo-av')

        // Set audio mode for video playback
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        })
        console.log('🔊 Audio mode configured for video playback')
      } catch (error) {
        console.error('❌ Failed to setup audio:', error)
      }
    }

    setupAudio()
  }, [])

  useEffect(() => {
    if (!currentStatus) return

    setProgress(0)

    // Check if current status is a video
    const isVideoContent =
      currentStatus.fileType?.startsWith('video/') ||
      currentStatus.fileType === 'video' ||
      currentStatus.fileUrl?.includes('/videos/') ||
      currentStatus.fileUrl?.endsWith('.mp4')

    console.log('⏱️ Setting up timer for:', isVideoContent ? 'VIDEO' : 'IMAGE')

    if (isVideoContent) {
      // Video handles its own progression through onPlaybackStatusUpdate
      console.log('🎥 Video status - playback will control progression')

      // ✅ FIX: Ensure video ref is ready and playing
      if (videoRef.current) {
        videoRef.current
          .playAsync()
          .then(() => {
            console.log('▶️ Video playback started')
          })
          .catch((error) => {
            console.error('❌ Failed to start video:', error)
          })
      }

      return
    }

    // Timer only for images
    const startTime = Date.now()
    timerRef.current = setInterval(() => {
      if (isPaused) return

      const elapsed = Date.now() - startTime
      const newProgress = Math.min(elapsed / DURATION, 1)

      setProgress(newProgress)

      if (newProgress >= 1) {
        console.log('📸 Image timer finished')
        goToNext()
      }
    }, 50)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [currentIndex, isPaused, currentStatus])

  const goToNext = () => {
    if (currentIndex < localStatusList.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      navigation.goBack()
    }
  }

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    } else {
      navigation.goBack()
    }
  }

  const handleTap = (e) => {
    const { locationX } = e.nativeEvent
    const third = SCREEN_WIDTH / 3

    console.log('👆 Tap detected at:', locationX, 'isPaused:', isPaused)

    if (locationX < third) {
      console.log('⬅️ Previous tap')
      goToPrev()
    } else if (locationX > 2 * third) {
      console.log('➡️ Next tap')
      goToNext()
    } else {
      console.log('⏯️ Pause/Resume tap, new state:', !isPaused)
      setIsPaused(!isPaused)

      // If it's a video, manually pause/play it
      if (videoRef.current) {
        if (!isPaused) {
          console.log('⏸️ Pausing video')
          videoRef.current.pauseAsync()
        } else {
          console.log('▶️ Resuming video')
          videoRef.current.playAsync()
        }
      }
    }
  }

  useEffect(() => {
    if (currentStatus && !isViewingOwnStatus) {
      const timer = setTimeout(() => {
        markStatusViewed(currentStatus._id)
        // This will now update the viewedStatuses Set in the hook
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [currentStatus, isViewingOwnStatus, markStatusViewed])

  const handleDelete = () => {
    if (!currentStatus) return

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Are you sure you want to delete this status? This action cannot be undone.'
      )
      if (confirmed) performDelete()
    } else {
      Alert.alert(
        'Delete Status',
        'Are you sure you want to delete this status? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete },
        ]
      )
    }
  }

  const performDelete = async () => {
    if (!currentStatus) return

    try {
      await deleteStatus(currentStatus._id)

      const newList = localStatusList.filter((s) => s._id !== currentStatus._id)

      if (newList.length === 0) {
        if (Platform.OS === 'web') {
          alert('Status deleted successfully!')
        } else {
          Alert.alert('Success', 'Status deleted successfully!', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ])
          return
        }
        navigation.goBack()
        return
      }

      setLocalStatusList(newList)
      if (currentIndex >= newList.length) {
        setCurrentIndex(newList.length - 1)
      }
    } catch (error) {
      const message =
        'Failed to delete status: ' + (error.message || 'Unknown error')
      if (Platform.OS === 'web') {
        alert(message)
      } else {
        Alert.alert('Error', message)
      }
    }
  }

  if (!currentStatus || localStatusList.length === 0) {
    return (
      <Container style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#fff" />
      </Container>
    )
  }

  // ✅ FIX: Check for both 'video/' and 'video' formats
  const isVideo =
    currentStatus.fileType?.startsWith('video/') ||
    currentStatus.fileType === 'video' ||
    currentStatus.fileUrl?.includes('/videos/') ||
    currentStatus.fileUrl?.endsWith('.mp4') ||
    currentStatus.fileUrl?.endsWith('.mov') ||
    currentStatus.fileUrl?.endsWith('.avi')

  console.log('📹 Rendering status:', {
    isVideo,
    fileUrl: currentStatus.fileUrl,
    fileType: currentStatus.fileType,
    urlCheck: currentStatus.fileUrl?.includes('/videos/'),
  })

  return (
    <Container>
      {/* ✅ FIX: Separate header from tap area so buttons work */}

      {/* Progress Bars */}
      <ProgressBarContainer>
        {localStatusList.map((_, i) => (
          <ProgressSegment key={i}>
            <ProgressFill
              progress={
                i < currentIndex ? 1 : i === currentIndex ? progress : 0
              }
            />
          </ProgressSegment>
        ))}
      </ProgressBarContainer>

      {/* Header - Outside tap area */}
      <Header>
        <Avatar color={currentStatus.userAvatarColor || '#3b82f6'}>
          <AvatarText>
            {getInitials(currentStatus.userName || userName || 'You')}
          </AvatarText>
        </Avatar>
        <UserInfo>
          <Username>
            {isViewingOwnStatus
              ? 'Your Story'
              : currentStatus.userName || userName || 'Unknown'}
          </Username>
          <Timestamp>{formatTimestamp(currentStatus.createdAt)}</Timestamp>
        </UserInfo>

        {localStatusList.length > 1 && (
          <StatusCounter>
            {currentIndex + 1}/{localStatusList.length}
          </StatusCounter>
        )}

        {isViewingOwnStatus && (
          <DeleteButton onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color="#fff" />
          </DeleteButton>
        )}

        {isViewingOwnStatus && (
          <TouchableOpacity
            style={{
              padding: 8,
              marginLeft: 8,
              backgroundColor: 'rgba(52, 152, 219, 0.8)',
              borderRadius: 20,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.3)',
            }}
            onPress={() => setViewersModalVisible(true)}
          >
            <Ionicons name="eye-outline" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        <CloseButton
          onPress={() => {
            console.log('❌ Close button pressed')
            navigation.goBack()
          }}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </CloseButton>
      </Header>

      {/* Tappable area for navigation and pause */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleTap}
        style={{ flex: 1 }}
      >
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
              shouldPlay={!isPaused && !videoLoading}
              isLooping={false}
              useNativeControls={false}
              style={{
                width: '100%',
                height: '100%',
              }}
              videoStyle={{
                width: '100%',
                height: '100%',
              }}
              onLoadStart={() => {
                console.log('🎬 Video loading started')
                setVideoLoading(true)
                setVideoError(false)
              }}
              onLoad={(status) => {
                console.log('✅ Video loaded successfully:', status)
                setVideoLoading(false)
                setVideoError(false)
              }}
              onReadyForDisplay={(event) => {
                console.log('🎥 Video ready for display:', event)
                setVideoLoading(false)
              }}
              onError={(error) => {
                console.error('❌ Video error:', error)
                setVideoLoading(false)
                setVideoError(true)
              }}
              onPlaybackStatusUpdate={(status) => {
                if (status.isLoaded) {
                  if (status.didJustFinish) {
                    console.log('🏁 Video finished')
                    goToNext()
                  }
                  if (status.isPlaying && videoLoading) {
                    console.log('▶️ Video is playing, hiding loader')
                    setVideoLoading(false)
                  }
                }
              }}
            />

            {videoLoading && !videoError && (
              <LoadingContainer>
                <ActivityIndicator size="large" color="#fff" />
                <LoadingText>Loading video...</LoadingText>
              </LoadingContainer>
            )}

            {videoError && (
              <LoadingContainer>
                <Ionicons name="alert-circle-outline" size={48} color="#fff" />
                <LoadingText>Failed to load video</LoadingText>
                <TouchableOpacity
                  onPress={() => {
                    setVideoError(false)
                    setVideoLoading(true)
                  }}
                  style={{
                    marginTop: 16,
                    padding: 12,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: 8,
                  }}
                >
                  <LoadingText>Tap to retry</LoadingText>
                </TouchableOpacity>
              </LoadingContainer>
            )}
          </VideoContainer>
        ) : (
          <StatusImage
            source={{ uri: currentStatus.fileUrl }}
            resizeMode="contain"
          />
        )}

        {/* Caption */}
        {currentStatus.caption && <Caption>{currentStatus.caption}</Caption>}

        {/* Pause Indicator */}
        {isPaused && !videoLoading && !videoError && (
          <PauseIndicator>
            <Ionicons name="pause" size={60} color="rgba(255,255,255,0.8)" />
          </PauseIndicator>
        )}
      </TouchableOpacity>
      <StatusViewersModal
        visible={viewersModalVisible}
        statusId={currentStatus?._id}
        onClose={() => setViewersModalVisible(false)}
      />
    </Container>
  )
}
