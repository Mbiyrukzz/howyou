// screens/StatusViewerScreen.js - FIXED DELETE
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
`

const DeleteButton = styled.TouchableOpacity`
  padding: 8px;
  margin-left: 8px;
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

  console.log('StatusViewer params:', { status, passedStatuses, userName })
  console.log('myStatus from provider:', myStatus)

  // ✅ LOCAL STATE: Manage the status list locally so we can update it after deletion
  const [localStatusList, setLocalStatusList] = useState([])
  const [isViewingOwnStatus, setIsViewingOwnStatus] = useState(false)

  // ✅ Initialize local state from props/provider
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

    console.log('Setting local status list:', statusList.length)
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
  const videoRef = useRef(null)
  const timerRef = useRef(null)

  const currentStatus = localStatusList[currentIndex]

  const DURATION = 5000

  useEffect(() => {
    if (!currentStatus) return

    setProgress(0)
    setIsPaused(false)

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

    if (locationX < third) {
      goToPrev()
    } else if (locationX > 2 * third) {
      goToNext()
    } else {
      setIsPaused(!isPaused)
    }
  }

  const handleDelete = () => {
    if (!currentStatus) return

    console.log('🗑️ Delete button clicked for status:', currentStatus._id)

    if (Platform.OS === 'web') {
      // Use window.confirm for web
      const confirmed = window.confirm(
        'Are you sure you want to delete this status? This action cannot be undone.'
      )

      if (confirmed) {
        console.log('✅ User confirmed delete')
        performDelete()
      } else {
        console.log('❌ User cancelled delete')
      }
    } else {
      // Use Alert.alert for mobile (this actually works on mobile)
      Alert.alert(
        'Delete Status',
        'Are you sure you want to delete this status? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => console.log('❌ User cancelled delete'),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              console.log('✅ User confirmed delete')
              performDelete()
            },
          },
        ]
      )
    }
  }

  const performDelete = async () => {
    if (!currentStatus) return

    try {
      console.log('═══════════════════════════════════')
      console.log('🗑️ STARTING DELETE PROCESS')
      console.log('═══════════════════════════════════')
      console.log('Status ID:', currentStatus._id)
      console.log('deleteStatus function:', typeof deleteStatus)

      // Call the API
      const result = await deleteStatus(currentStatus._id)

      console.log('✅ API Response:', result)
      console.log('✅ Status deleted successfully')

      // Update local state
      const newList = localStatusList.filter((s) => s._id !== currentStatus._id)
      console.log('Updated list length:', newList.length)

      // If no more statuses, go back
      if (newList.length === 0) {
        console.log('No more statuses, navigating back')

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

      // Update the local list
      setLocalStatusList(newList)

      // Adjust current index if needed
      if (currentIndex >= newList.length) {
        setCurrentIndex(newList.length - 1)
      }

      console.log('✅ Local state updated successfully')
      console.log(
        'New current index:',
        currentIndex >= newList.length ? newList.length - 1 : currentIndex
      )
      console.log('═══════════════════════════════════')
    } catch (error) {
      console.log('═══════════════════════════════════')
      console.log('❌ DELETE FAILED')
      console.log('═══════════════════════════════════')
      console.error('Error type:', error.constructor.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      console.log('═══════════════════════════════════')

      if (Platform.OS === 'web') {
        alert('Failed to delete status: ' + (error.message || 'Unknown error'))
      } else {
        Alert.alert(
          'Error',
          'Failed to delete status: ' + (error.message || 'Unknown error')
        )
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

  const isVideo = currentStatus.fileType?.startsWith('video/')

  return (
    <Container>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleTap}
        style={{ flex: 1 }}
      >
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

        {/* Header */}
        <Header>
          <Avatar color={currentStatus.userAvatarColor || '#3498db'}>
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

          {/* Status counter */}
          {localStatusList.length > 1 && (
            <StatusCounter>
              {currentIndex + 1}/{localStatusList.length}
            </StatusCounter>
          )}

          {/* Delete button only for own status */}
          {isViewingOwnStatus && (
            <DeleteButton onPress={handleDelete}>
              <Ionicons name="trash-outline" size={24} color="#fff" />
            </DeleteButton>
          )}

          <CloseButton onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#fff" />
          </CloseButton>
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
        {currentStatus.caption && <Caption>{currentStatus.caption}</Caption>}

        {/* Pause Indicator */}
        {isPaused && (
          <PauseIndicator>
            <Ionicons name="pause" size={60} color="rgba(255,255,255,0.8)" />
          </PauseIndicator>
        )}
      </TouchableOpacity>
    </Container>
  )
}
