import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from 'react'
import {
  FlatList,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  View,
  Alert,
  ActionSheetIOS,
  Animated,
  Text,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import * as MediaLibrary from 'expo-media-library'
import { Camera } from 'expo-camera'
import { Audio } from 'expo-audio'
import ChatsContext from '../contexts/ChatsContext'
import { useUser } from '../hooks/useUser'
import LoadingIndicator from '../components/LoadingIndicator'
import CallLogItem from '../components/CallLogItem'
import {
  EditMessageModal,
  MessageActionMenu,
  MessageEditedLabel,
  ThreeDotsButton,
  WebMessageDropdown,
} from '../components/MessageActions'
import useChatHelpers from '../hooks/useChatHelpers'

const { width: screenWidth } = Dimensions.get('window')

/* =================== styled components =================== */

const SoundWaveContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 40px;
  margin-bottom: 16px;
`

const SoundWaveBar = styled(Animated.View)`
  width: 4px;
  background-color: #e74c3c;
  border-radius: 2px;
  margin: 0 2px;
`

const Container = styled.View`
  flex: 1;
  background-color: #f8f9fa;
`

const Header = styled.View`
  background-color: #fff;
  padding: 50px 16px 16px 16px;
  flex-direction: row;
  align-items: center;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 5;
`

const BackButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`

const HeaderAvatar = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${(props) => props.color || '#3498db'};
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`

const HeaderAvatarText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: bold;
`

const HeaderInfo = styled.View`
  flex: 1;
`

const HeaderName = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
`

const HeaderStatus = styled.Text`
  font-size: 14px;
  color: #27ae60;
  margin-top: 2px;
`

const HeaderActions = styled.View`
  flex-direction: row;
`

const HeaderActionButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  justify-content: center;
  align-items: center;
  margin-left: 8px;
  background-color: ${(props) => props.bgColor || 'transparent'};
`

const MessagesContainer = styled.View`
  flex: 1;
  padding: 16px;
`

const MessageItemWrapper = styled.View`
  flex-direction: ${(props) => (props.isOwn ? 'row-reverse' : 'row')};
  align-items: center;
  margin-vertical: 4px;
  position: relative;
  pointer-events: auto;
`

const MessageItemContent = styled.View`
  flex: 1;
`

const MessageBubble = styled.View`
  max-width: ${screenWidth * 0.75}px;
  margin-vertical: 4px;
  padding: 12px 16px;
  border-radius: 20px;
  align-self: ${(props) => (props.isOwn ? 'flex-end' : 'flex-start')};
  background-color: ${(props) => (props.isOwn ? '#3498db' : '#fff')};
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 2;
`

const MessageText = styled.Text`
  font-size: 16px;
  line-height: 20px;
  color: ${(props) => (props.isOwn ? '#fff' : '#2c3e50')};
`

const MessageImage = styled.Image`
  width: ${screenWidth * 0.6}px;
  height: 200px;
  border-radius: 10px;
  margin-top: ${(props) => (props.hasText ? '8px' : '0px')};
  background-color: #f0f0f0;
`

const MessageImageContainer = styled.TouchableOpacity`
  position: relative;
`

const ImageLoadingOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  justify-content: center;
  align-items: center;
  border-radius: 10px;
`

const LoadingText = styled.Text`
  color: white;
  font-size: 12px;
  margin-top: 4px;
`

const MessageVideo = styled.View`
  width: ${screenWidth * 0.6}px;
  height: 200px;
  border-radius: 10px;
  margin-top: 8px;
  background-color: #000;
  justify-content: center;
  align-items: center;
`

const MessageFile = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  margin-top: 8px;
  background-color: ${(props) =>
    props.isOwn ? 'rgba(255, 255, 255, 0.2)' : '#f0f0f0'};
  padding: 10px;
  border-radius: 8px;
`

const FileIcon = styled(Ionicons)`
  margin-right: 8px;
`

const FileText = styled.Text`
  font-size: 14px;
  color: ${(props) => (props.isOwn ? '#fff' : '#2c3e50')};
  flex: 1;
`

const MessageTime = styled.Text`
  font-size: 12px;
  color: ${(props) => (props.isOwn ? 'rgba(255, 255, 255, 0.8)' : '#95a5a6')};
  margin-top: 4px;
  align-self: ${(props) => (props.isOwn ? 'flex-end' : 'flex-start')};
`

const MessageStatus = styled.Text`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 2px;
`

const DateSeparator = styled.View`
  align-items: center;
  margin: 20px 0;
`

const DateText = styled.Text`
  background-color: #e9ecef;
  color: #7f8c8d;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 16px;
  overflow: hidden;
`

const InputContainer = styled.View`
  background-color: #fff;
  padding: 16px;
  flex-direction: row;
  align-items: flex-end;
  border-top-width: 1px;
  border-top-color: #e9ecef;
`

const InputWrapper = styled.View`
  flex: 1;
  max-height: 100px;
  margin-right: 12px;
  background-color: #f8f9fa;
  border-radius: 25px;
  padding: 12px 16px;
  border-width: 1px;
  border-color: #e9ecef;
`

const TextInput = styled.TextInput`
  font-size: 16px;
  color: #2c3e50;
  min-height: 20px;
`

const SendButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: ${(props) => (props.disabled ? '#bdc3c7' : '#3498db')};
  justify-content: center;
  align-items: center;
`

const AttachmentButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  justify-content: center;
  align-items: center;
  margin-right: 8px;
  background-color: #f8f9fa;
`

const CameraButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  justify-content: center;
  align-items: center;
  margin-right: 8px;
  background-color: #f8f9fa;
`

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`

const LoadingTextContainer = styled.Text`
  color: #7f8c8d;
  font-size: 16px;
`

const ErrorContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px;
`

const ErrorText = styled.Text`
  color: #e74c3c;
  font-size: 16px;
  text-align: center;
  margin-bottom: 16px;
`

const RetryButton = styled.TouchableOpacity`
  background-color: #3498db;
  padding: 12px 24px;
  border-radius: 8px;
`

const RetryButtonText = styled.Text`
  color: white;
  font-weight: 600;
`

const ImagePreviewModal = styled.Modal``

const ImagePreviewContainer = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.9);
  justify-content: center;
  align-items: center;
`

const ImagePreviewHeader = styled.View`
  position: absolute;
  top: ${Platform.OS === 'ios' ? '50px' : '30px'};
  left: 0;
  right: 0;
  flex-direction: row;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 1;
`

const CloseButton = styled.TouchableOpacity`
  background-color: rgba(255, 255, 255, 0.2);
  padding: 10px;
  border-radius: 20px;
`

const FullScreenImage = styled.Image`
  width: 100%;
  height: 70%;
`

const AudioRecordingContainer = styled.View`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 20px;
  border-top-width: 1px;
  border-top-color: #e9ecef;
  elevation: 10;
  shadow-color: #000;
  shadow-offset: 0px -2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
`

const RecordingIndicator = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
`

const RecordingDot = styled.View`
  width: 12px;
  height: 12px;
  border-radius: 6px;
  background-color: #e74c3c;
  margin-right: 8px;
`

const RecordingText = styled.Text`
  font-size: 16px;
  color: #2c3e50;
  font-weight: 600;
`

const RecordingTime = styled.Text`
  font-size: 14px;
  color: #7f8c8d;
  margin-left: 8px;
`

const RecordingActions = styled.View`
  flex-direction: row;
  justify-content: space-around;
`

const RecordButton = styled.TouchableOpacity`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: ${(props) => (props.recording ? '#e74c3c' : '#27ae60')};
  justify-content: center;
  align-items: center;
  elevation: 3;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.2;
  shadow-radius: 3px;
`

const CancelRecordButton = styled.TouchableOpacity`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: #95a5a6;
  justify-content: center;
  align-items: center;
`

const SendRecordButton = styled.TouchableOpacity`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: #3498db;
  justify-content: center;
  align-items: center;
`

const SelectedFilesContainer = styled.View`
  flex-direction: row;
  padding: 8px;
  background-color: #f8f9fa;
  border-top-width: 1px;
  border-top-color: #e9ecef;
  flex-wrap: wrap;
`

const SelectedFileChip = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #3498db;
  border-radius: 16px;
  padding: 6px 12px;
  margin: 4px;
`

const SelectedFileText = styled.Text`
  color: white;
  font-size: 12px;
  margin-right: 8px;
  max-width: 100px;
`

const RemoveFileButton = styled.TouchableOpacity`
  width: 16px;
  height: 16px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.3);
  justify-content: center;
  align-items: center;
`

const MessageAudioPlayer = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 8px;
  background-color: ${(props) =>
    props.isOwn ? 'rgba(255, 255, 255, 0.2)' : '#f0f0f0'};
  padding: 10px;
  border-radius: 8px;
`

const PlayButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: ${(props) =>
    props.isOwn ? 'rgba(255, 255, 255, 0.3)' : '#3498db'};
  justify-content: center;
  align-items: center;
  margin-right: 8px;
`

const AudioInfo = styled.View`
  flex: 1;
`

const AudioDuration = styled.Text`
  font-size: 12px;
  color: ${(props) => (props.isOwn ? '#fff' : '#7f8c8d')};
`

const getUserColor = (userId) => {
  const colors = [
    '#3498db',
    '#e74c3c',
    '#f39c12',
    '#27ae60',
    '#9b59b6',
    '#1abc9c',
    '#34495e',
    '#e67e22',
    '#2ecc71',
    '#8e44ad',
    '#16a085',
    '#f1c40f',
  ]
  const index = userId ? userId.toString().charCodeAt(0) % colors.length : 0
  return colors[index]
}

const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatMessageDate = (timestamp) => {
  const date = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString()
}

const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const findUserByAnyId = (users, targetId) => {
  return users.find(
    (u) =>
      u.firebaseUid === targetId ||
      (u._id && u._id.toString()) === targetId ||
      (u.id && u.id.toString()) === targetId
  )
}
// Replace the existing MessageItem component in ChatDetailScreen.js with this updated version

const MessageItem = React.memo(
  ({
    item,
    previousItem,
    currentUserId,
    users,
    onImagePress,
    onLongPress,
    onThreeDotsPress,
    hoveredMessageId,
    setHoveredMessageId,
  }) => {
    const [imageLoading, setImageLoading] = useState(true)
    const [imageError, setImageError] = useState(false)
    const [sound, setSound] = useState(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [audioDuration, setAudioDuration] = useState(0)
    const [showOptions, setShowOptions] = useState(false)

    const isOwn = item.senderId === currentUserId
    const messageId = item._id || item.id
    const isHovered = Platform.OS === 'web' && hoveredMessageId === messageId

    const showDate =
      !previousItem ||
      formatMessageDate(previousItem.createdAt) !==
        formatMessageDate(item.createdAt)

    const sender = findUserByAnyId(users, item.senderId)
    const displayName = isOwn ? 'You' : sender?.name || 'Unknown'
    const isEdited =
      item.updatedAt &&
      new Date(item.updatedAt).getTime() > new Date(item.createdAt).getTime()
    const timeString = `${formatMessageTime(item.createdAt)} • ${displayName}`

    useEffect(() => {
      return () => {
        if (sound) {
          sound.unloadAsync()
        }
      }
    }, [sound])

    const handleImageLoad = () => setImageLoading(false)
    const handleImageError = () => {
      setImageLoading(false)
      setImageError(true)
    }

    const playAudio = async (audioUrl) => {
      try {
        if (sound && isPlaying) {
          await sound.stopAsync()
          await sound.unloadAsync()
          setSound(null)
          setIsPlaying(false)
          return
        }

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true }
        )

        setSound(newSound)
        setIsPlaying(true)

        const status = await newSound.getStatusAsync()
        if (status.isLoaded && status.durationMillis) {
          setAudioDuration(Math.floor(status.durationMillis / 1000))
        }

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setIsPlaying(false)
            newSound.unloadAsync()
            setSound(null)
          }
        })
      } catch (error) {
        console.error('Error playing audio:', error)
        Alert.alert('Error', 'Failed to play audio')
        setIsPlaying(false)
      }
    }

    const formatAudioDuration = (seconds) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const renderFiles = () => {
      if (!item.files || item.files.length === 0) return null

      return item.files
        .map((file, index) => {
          if (item.type === 'audio' || file.type === 'audio') {
            return (
              <MessageAudioPlayer key={`audio-${index}`} isOwn={isOwn}>
                <PlayButton isOwn={isOwn} onPress={() => playAudio(file.url)}>
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={20}
                    color="#fff"
                  />
                </PlayButton>
                <AudioInfo>
                  <FileText isOwn={isOwn}>
                    {file.originalname || `Audio ${index + 1}`}
                  </FileText>
                  {audioDuration > 0 && (
                    <AudioDuration isOwn={isOwn}>
                      {formatAudioDuration(audioDuration)}
                    </AudioDuration>
                  )}
                </AudioInfo>
              </MessageAudioPlayer>
            )
          } else if (item.type === 'image' && file.url) {
            return (
              <MessageImageContainer
                key={`image-${index}`}
                onPress={() => onImagePress(file.url)}
              >
                <MessageImage
                  source={{ uri: file.url }}
                  hasText={!!(item.content && item.content.trim())}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
                {imageLoading && (
                  <ImageLoadingOverlay>
                    <Ionicons name="image-outline" size={24} color="white" />
                    <LoadingText>Loading</LoadingText>
                  </ImageLoadingOverlay>
                )}
                {imageError && (
                  <ImageLoadingOverlay>
                    <Ionicons
                      name="alert-circle-outline"
                      size={24}
                      color="white"
                    />
                    <LoadingText>Failed to load</LoadingText>
                  </ImageLoadingOverlay>
                )}
              </MessageImageContainer>
            )
          } else if (item.type === 'file' && file.url) {
            return (
              <MessageFile key={`file-${index}`} isOwn={isOwn}>
                <FileIcon
                  name="document"
                  size={20}
                  color={isOwn ? '#fff' : '#2c3e50'}
                />
                <FileText isOwn={isOwn}>
                  {file.originalname || `File ${index + 1}`}
                </FileText>
              </MessageFile>
            )
          }
          return null
        })
        .filter(Boolean)
    }

    // Handle long press for mobile
    const handleMessageLongPress = () => {
      if (isOwn && Platform.OS !== 'web') {
        setShowOptions(true)
        setTimeout(() => setShowOptions(false), 200)
        onLongPress(item)
      }
    }

    // Handle three dots press for web
    const handleThreeDotsPress = (e) => {
      console.log('🔘 ThreeDotsButton clicked!', {
        platform: Platform.OS,
        messageId: item._id || item.id,
        isOwn,
      })

      if (Platform.OS === 'web') {
        if (e && e.stopPropagation) {
          e.stopPropagation()
        }

        const clickX =
          e?.nativeEvent?.pageX || e?.pageX || window.innerWidth - 200
        const clickY = e?.nativeEvent?.pageY || e?.pageY || 150

        console.log('📍 Click position:', { clickX, clickY })
        onThreeDotsPress(item, { x: clickX, y: clickY })
      }
    }

    return (
      <View style={{ marginVertical: 4 }}>
        {showDate && (
          <DateSeparator>
            <DateText>{formatMessageDate(item.createdAt)}</DateText>
          </DateSeparator>
        )}
        <View
          style={{
            flexDirection: isOwn ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            padding: 4,
            position: 'relative',
          }}
          onMouseEnter={() => {
            if (Platform.OS === 'web') {
              setHoveredMessageId(messageId)
            }
          }}
          onMouseLeave={() => {
            if (Platform.OS === 'web') {
              setHoveredMessageId(null)
            }
          }}
        >
          {/* Three Dots Button for Web - shown on hover */}
          {Platform.OS === 'web' && isOwn && (
            <View
              style={{
                marginLeft: isOwn ? 0 : 8,
                marginRight: isOwn ? 8 : 0,
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.2s',
              }}
            >
              <TouchableOpacity
                onPress={handleThreeDotsPress}
                style={{
                  backgroundColor: isHovered ? '#e9ecef' : '#f8f9fa',
                  padding: 8,
                  borderRadius: 16,
                  width: 32,
                  height: 32,
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 3,
                  elevation: 3,
                }}
              >
                <Ionicons
                  name="ellipsis-vertical"
                  size={16}
                  color={isHovered ? '#2c3e50' : '#7f8c8d'}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Message Content */}
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              onLongPress={handleMessageLongPress}
              delayLongPress={500}
              activeOpacity={0.9}
            >
              {/* Long press visual feedback */}
              {showOptions && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderRadius: 18,
                    zIndex: 1,
                  }}
                />
              )}

              <MessageBubble isOwn={isOwn}>
                {item.content && item.content.trim().length > 0 && (
                  <MessageText isOwn={isOwn}>{item.content.trim()}</MessageText>
                )}
                {renderFiles()}
                {item.type === 'video' && item.files?.[0]?.url && (
                  <MessageVideo>
                    <Ionicons name="play-circle" size={40} color="white" />
                  </MessageVideo>
                )}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 4,
                  }}
                >
                  <MessageTime isOwn={isOwn}>{timeString}</MessageTime>
                  {isEdited && (
                    <MessageEditedLabel isOwn={isOwn}>
                      (edited)
                    </MessageEditedLabel>
                  )}
                </View>
                {isOwn && <MessageStatus>✓✓ sent</MessageStatus>}
              </MessageBubble>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  },
  (prevProps, nextProps) => {
    const prevItem = prevProps.item
    const nextItem = nextProps.item

    if (prevItem.content !== nextItem.content) return false
    if (prevItem.updatedAt !== nextItem.updatedAt) return false
    if ((prevItem._id || prevItem.id) !== (nextItem._id || nextItem.id))
      return false

    const prevHovered =
      prevProps.hoveredMessageId === (prevItem._id || prevItem.id)
    const nextHovered =
      nextProps.hoveredMessageId === (nextItem._id || nextItem.id)
    if (prevHovered !== nextHovered) return false

    if ((prevItem.files?.length || 0) !== (nextItem.files?.length || 0))
      return false

    return true
  }
)

const SoundWaveAnimation = () => {
  const [animations] = useState(() =>
    Array.from({ length: 20 }, () => new Animated.Value(0.3))
  )
  useEffect(() => {
    const animateBars = () => {
      const animationArray = animations.map((anim, index) => {
        return Animated.sequence([
          Animated.delay(index * 50),
          Animated.loop(
            Animated.sequence([
              Animated.timing(anim, {
                toValue: Math.random() * 0.7 + 0.3,
                duration: 300 + Math.random() * 200,
                useNativeDriver: false,
              }),
              Animated.timing(anim, {
                toValue: 0.3,
                duration: 300 + Math.random() * 200,
                useNativeDriver: false,
              }),
            ])
          ),
        ])
      })

      Animated.parallel(animationArray).start()
    }

    animateBars()
  }, [animations])

  return (
    <SoundWaveContainer>
      {animations.map((anim, index) => (
        <SoundWaveBar
          key={index}
          style={{
            height: anim.interpolate({
              inputRange: [0.3, 1],
              outputRange: [10, 40],
            }),
          }}
        />
      ))}
    </SoundWaveContainer>
  )
}

/* =================== main screen =================== */
export default function ChatDetailScreen({
  navigation,
  route,
  isInSidebar = false,
}) {
  const [message, setMessage] = useState('')
  const [callLogs, setCallLogs] = useState([])
  const [combinedItems, setCombinedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState('')
  const [recording, setRecording] = useState(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [showRecordingUI, setShowRecordingUI] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [actionMenuVisible, setActionMenuVisible] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [webDropdownVisible, setWebDropdownVisible] = useState(false)
  const [hoveredMessageId, setHoveredMessageId] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 })

  console.log('🚀 ChatDetailScreen mounted, initial states:', {
    webDropdownVisible,
    selectedMessage,
    dropdownPosition,
  })

  const recordingIntervalRef = useRef(null)
  const flatListRef = useRef(null)

  const prevMessageCount = useRef(0)

  const { chatId } = route?.params || {}
  const chatsContext = useContext(ChatsContext)
  const { user } = useUser()

  // Update the destructuring from useChatHelpers to include getLastSeenText
  const {
    handleTypingInput,
    stopTyping,
    typingUsers,
    getTypingText,
    isTyping,
    checkUserOnline,
    getStatusText,
    getOtherUser,
    wsConnected,
    updateLastSeen,
    getLastSeen,
    getLastSeenText, // ✅ Add this
  } = useChatHelpers(chatId)

  const {
    chats = [],
    users = [],
    loadMessages,
    sendMessage: contextSendMessage,
    updateMessage,
    deleteMessage,
    initiateCall,
    getCallHistory,
    getMessagesForChat, // ✅ This gets messages from context
    loadLastSeenData, // ✅ Add this
  } = chatsContext || {}

  const messages = getMessagesForChat(chatId) || []

  const currentChat = chats.find((chat) => (chat._id || chat.id) === chatId)

  // Get the other user in the chat (not the current user)
  const otherUserId = currentChat?.participants?.find((id) => id !== user?.uid)

  const otherUser = getOtherUser(user?.uid)

  const getChatInfo = () => {
    if (!otherUser) {
      return {
        name: 'Unknown User',
        status: 'Last seen recently',
        color: '#95a5a6',
        isOnline: false,
      }
    }

    const userId = otherUser.firebaseUid || otherUser._id
    const isOnline = checkUserOnline(userId)

    let statusText
    if (isOnline) {
      statusText = getStatusText(userId)
    } else {
      // ✅ Only show last seen, never show "Offline"
      const lastSeenText = getLastSeenText(userId)
      statusText =
        lastSeenText !== 'Unknown'
          ? `Last seen ${lastSeenText}`
          : 'Last seen recently' // ✅ Fallback instead of "Offline"
    }

    return {
      name: otherUser.name || 'Unknown User',
      status: statusText,
      color: getUserColor(otherUser._id || otherUser.id),
      isOnline,
    }
  }
  const chatInfo = getChatInfo()

  // Add this effect after getChatInfo
  useEffect(() => {
    if (otherUser) {
      const userId = otherUser.firebaseUid || otherUser._id
      const lastSeenTimestamp = getLastSeen(userId)
      console.log('👁️ Debug last seen:', {
        userId,
        lastSeenTimestamp,
        isOnline: checkUserOnline(userId),
        lastSeenText: getLastSeenText(userId),
      })
    }
  }, [otherUser, getLastSeen, getLastSeenText, checkUserOnline])

  // Update the text input to use typing indicators
  const handleMessageChange = (text) => {
    handleTypingInput(text, setMessage)
  }

  // Update handleSendMessage to stop typing indicator
  const handleSendMessageWithTyping = async (files = []) => {
    stopTyping() // Stop typing indicator when sending
    await handleSendMessage(files)
  }

  // Combine messages and call logs into a single timeline
  useEffect(() => {
    const combined = []

    // Add all messages
    messages.forEach((msg) => {
      combined.push({
        type: 'message',
        data: msg,
        timestamp: new Date(msg.createdAt),
      })
    })

    // Add all call logs
    callLogs.forEach((call) => {
      // Determine direction based on current user
      const direction = call.callerId === user?.uid ? 'outgoing' : 'incoming'

      combined.push({
        type: 'call',
        data: {
          ...call,
          direction,
        },
        timestamp: new Date(call.createdAt),
      })
    })

    // Sort by timestamp
    combined.sort((a, b) => a.timestamp - b.timestamp)

    setCombinedItems(combined)
  }, [messages, callLogs, user?.uid])

  const handleEditMessage = () => {
    setActionMenuVisible(false)
    setWebDropdownVisible(false)
    setEditModalVisible(true)
  }

  const handleDeleteMessage = async () => {
    const id = selectedMessage._id ?? selectedMessage.id
    const result = await deleteMessage(id, chatId)

    if (result.success) {
      setSelectedMessage(null)
      setActionMenuVisible(false)
      setWebDropdownVisible(false)
    } else {
      Alert.alert('Error', result.error ?? 'Delete failed')
    }
  }

  const handleSaveEdit = async (newContent) => {
    setSavingEdit(true)

    const messageId = selectedMessage._id || selectedMessage.id
    const result = await updateMessage(messageId, chatId, newContent)

    setSavingEdit(false)

    if (result.success) {
      // ✅ Context already updated via updateMessage
      Alert.alert('Success', 'Message updated successfully')
      setEditModalVisible(false)
      setSelectedMessage(null)
    } else {
      Alert.alert('Error', result.error || 'Failed to update message')
    }
  }
  const closeActionMenu = () => {
    setActionMenuVisible(false)
    setSelectedMessage(null)
  }

  const closeWebDropdown = () => {
    console.log('🔙 Closing web dropdown')
    setWebDropdownVisible(false)
    setSelectedMessage(null)
  }

  const closeEditModal = () => {
    setEditModalVisible(false)
    if (!actionMenuVisible && !webDropdownVisible) {
      setSelectedMessage(null)
    }
  }

  const handleMessageLongPress = (message) => {
    if (Platform.OS !== 'web' && message.senderId === user?.uid) {
      setSelectedMessage(message)
      setActionMenuVisible(true)
    }
  }

  const handleMessageThreeDotsPress = (message, position) => {
    console.log('🖱️ Three dots pressed START:', {
      platform: Platform.OS,
      messageId: message._id || message.id,
      position,
      currentWebDropdownVisible: webDropdownVisible,
    })

    if (Platform.OS === 'web') {
      console.log('🌐 Web platform - executing dropdown logic')

      // Set selected message first
      console.log('1️⃣ Setting selected message...')
      setSelectedMessage(message)

      // Calculate position
      const dropdownX = position?.x || window.innerWidth - 200
      const dropdownY = position?.y || 150

      console.log('2️⃣ Setting dropdown position:', {
        x: dropdownX,
        y: dropdownY,
      })
      setDropdownPosition({ x: dropdownX, y: dropdownY })

      // Set visibility
      console.log('3️⃣ Setting webDropdownVisible to TRUE')
      setWebDropdownVisible(true)

      console.log('✅ All states updated')
    }
  }

  /* ---------- load messages and call logs ---------- */
  const loadChatMessages = async () => {
    if (!chatId) return
    try {
      setLoading(true)
      setError(null)

      // ✅ This updates context state, no need to setMessages locally
      await loadMessages(chatId)

      // Load call history
      const callHistoryData = await getCallHistory(chatId)
      setCallLogs(callHistoryData || [])
    } catch (err) {
      console.error('Failed to load messages:', err)
      setError('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }
  // Add this effect after the loadChatMessages function
  useEffect(() => {
    if (chatId && !loading) {
      // Update last seen when opening chat
      updateLastSeen(chatId)

      // Update last seen periodically while viewing (every 30 seconds)
      const interval = setInterval(() => {
        updateLastSeen(chatId)
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [chatId, loading, updateLastSeen])
  /* ---------- call callback handler ---------- */
  const handleCallCallback = async (callLog) => {
    if (!otherUser || !chatId) {
      Alert.alert('Error', 'Cannot start call')
      return
    }

    try {
      const result = await initiateCall({
        chatId,
        callType: callLog.callType,
        recipientId: otherUserId,
      })

      if (result.success) {
        navigation.navigate('CallScreen', {
          chatId,
          remoteUserId: otherUserId,
          remoteUserName: otherUser.name,
          callType: callLog.callType,
        })
      } else {
        Alert.alert('Error', 'Failed to start call')
      }
    } catch (error) {
      console.error('Start call error:', error)
      Alert.alert('Error', 'Failed to start call')
    }
  }

  /* ---------- image picker ---------- */
  const requestPermissions = async () => {
    const { status: cameraStatus } =
      await Camera.requestCameraPermissionsAsync()
    const { status: libraryStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync()
    const { status: mediaLibraryStatus } =
      await MediaLibrary.requestPermissionsAsync()

    return {
      camera: cameraStatus === 'granted',
      library: libraryStatus === 'granted',
      mediaLibrary: mediaLibraryStatus === 'granted',
    }
  }

  const showImagePickerOptions = () => {
    const options = [
      'Take Photo',
      'Choose from Library',
      'Choose File',
      'Cancel',
    ]

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 3,
        },
        (buttonIndex) => {
          switch (buttonIndex) {
            case 0:
              takePhoto()
              break
            case 1:
              pickImageFromLibrary()
              break
            case 2:
              pickFile()
              break
          }
        }
      )
    } else {
      Alert.alert('Select Image', 'Choose an option', [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImageFromLibrary },
        { text: 'Choose File', onPress: pickFile },
        { text: 'Cancel', style: 'cancel' },
      ])
    }
  }

  const startRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert(
          'Audio Recording Unavailable',
          'Audio recording is not supported in the web browser. Please use the mobile app to record audio.'
        )
        return
      }
      const { status } = await Audio.Recording.requestPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Audio recording permission is required'
        )
        return
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })
      const newRecording = new Audio.Recording()
      await newRecording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      )
      await newRecording.startAsync()
      setRecording(newRecording)
      setShowRecordingUI(true)
      setRecordingDuration(0)
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Failed to start recording:', err)
      Alert.alert('Error', 'Failed to start recording: ' + err.message)
    }
  }

  const stopRecording = async () => {
    if (!recording) return

    try {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }

      await recording.stopAndUnloadAsync()
      const uri = recording.getURI()

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      })

      setRecording(null)
      setShowRecordingUI(false)
      setRecordingDuration(0)

      return uri
    } catch (err) {
      console.error('Failed to stop recording:', err)
      Alert.alert('Error', 'Failed to stop recording')
    }
  }

  const cancelRecording = async () => {
    if (!recording) return

    try {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }

      await recording.stopAndUnloadAsync()
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      })

      setRecording(null)
      setShowRecordingUI(false)
      setRecordingDuration(0)
    } catch (err) {
      console.error('Failed to cancel recording:', err)
    }
  }

  const sendRecording = async () => {
    const uri = await stopRecording()
    if (!uri) return

    await handleSendMessage([
      {
        uri,
        name: `recording_${Date.now()}.m4a`,
        type: 'audio/m4a',
      },
    ])
  }

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const pickMultipleFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'video/*', 'audio/*', 'application/pdf'],
        multiple: true,
      })

      if (result.canceled || !result.assets?.length) {
        return
      }

      const files = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name || `file_${Date.now()}`,
        type: asset.mimeType || 'application/octet-stream',
      }))

      setSelectedFiles((prev) => [...prev, ...files])
    } catch (err) {
      console.error('File picker error:', err)
      Alert.alert('Error', 'Failed to pick files')
    }
  }

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const sendSelectedFiles = async () => {
    if (selectedFiles.length === 0 && !message.trim()) return

    await handleSendMessage(selectedFiles)
    setSelectedFiles([])
  }

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'video/*', 'audio/*', 'application/pdf'],
        multiple: false,
      })

      if (result.canceled || !result.assets?.length) {
        return
      }

      const asset = result.assets[0]
      if (!asset?.uri) {
        Alert.alert('Error', 'Invalid file selected')
        return
      }

      setSelectedFiles((prev) => [
        ...prev,
        {
          uri: asset.uri,
          name: asset.name || `file_${Date.now()}`,
          type: asset.mimeType || 'application/octet-stream',
        },
      ])
    } catch (err) {
      console.error('File picker error:', err)
      Alert.alert('Error', 'Failed to pick file')
    }
  }

  const handleSendMessage = async (files = []) => {
    const filesToSend = files.length > 0 ? files : selectedFiles

    if ((!message.trim() && filesToSend.length === 0) || sending || !chatId)
      return

    try {
      setSending(true)

      let messageType = 'text'
      if (filesToSend.length > 0) {
        const fileType = filesToSend[0].type || filesToSend[0].mimeType
        if (fileType?.startsWith('image/')) messageType = 'image'
        else if (fileType?.startsWith('video/')) messageType = 'video'
        else if (fileType?.startsWith('audio/')) messageType = 'audio'
        else messageType = 'file'
      }

      const result = await contextSendMessage({
        chatId,
        content: message.trim() || undefined,
        files: filesToSend,
        messageType,
      })

      if (result.success) {
        // ✅ Context already updated via sendMessage, just clear inputs
        setMessage('')
        setSelectedFiles([])
        setTimeout(
          () => flatListRef.current?.scrollToEnd({ animated: true }),
          100
        )
      } else {
        Alert.alert('Error', result.error || 'Failed to send message')
      }
    } catch (err) {
      console.error('Send message error:', err)
      Alert.alert('Error', 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const pickImageFromLibrary = async () => {
    try {
      const permissions = await requestPermissions()
      if (!permissions.library) {
        Alert.alert('Permission denied', 'Media library permission is required')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0]
        await handleSendMessage([
          {
            uri: asset.uri,
            name: asset.fileName || `image_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
          },
        ])
      }
    } catch (error) {
      console.error('Pick image error:', error)
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  const takePhoto = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert(
          'Camera Unavailable',
          'Taking photos is not supported in the web browser. Please use the mobile app to take photos.'
        )
        return
      }
      const permissions = await Camera.requestCameraPermissionsAsync()
      if (permissions.status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Camera permission is required to take photos'
        )
        return
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })
      if (result.canceled || !result.assets?.[0]) {
        return
      }
      const asset = result.assets[0]
      await handleSendMessage([
        {
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        },
      ])
    } catch (error) {
      console.error('Take photo error:', error)
      Alert.alert('Error', 'Failed to take photo: ' + error.message)
    }
  }

  const startVideoCall = async () => {
    if (!otherUser || !chatId) {
      Alert.alert('Error', 'Cannot start call')
      return
    }

    try {
      const result = await initiateCall({
        chatId,
        callType: 'video',
        recipientId: otherUserId,
      })

      if (result.success) {
        navigation.navigate('CallScreen', {
          chatId,
          remoteUserId: otherUserId,
          remoteUserName: otherUser.name,
          callType: 'video',
          isIncoming: false,
          callId: result.call._id.toString(), // ✅ Add callId
        })
      } else {
        Alert.alert('Error', 'Failed to start video call')
      }
    } catch (error) {
      console.error('Start video call error:', error)
      Alert.alert('Error', 'Failed to start video call')
    }
  }

  const startAudioCall = async () => {
    if (!otherUser || !chatId) {
      Alert.alert('Error', 'Cannot start call')
      return
    }

    try {
      const result = await initiateCall({
        chatId,
        callType: 'voice',
        recipientId: otherUserId,
      })

      if (result.success) {
        navigation.navigate('CallScreen', {
          chatId,
          remoteUserId: otherUserId,
          remoteUserName: otherUser.name,
          callType: 'voice',
          isIncoming: false,
          callId: result.call._id.toString(), // ✅ Add callId
        })
      } else {
        Alert.alert('Error', 'Failed to start audio call')
      }
    } catch (error) {
      console.error('Start audio call error:', error)
      Alert.alert('Error', 'Failed to start audio call')
    }
  }

  /* ---------- image preview ---------- */
  const handleImagePress = (imageUrl) => {
    setPreviewImageUrl(imageUrl)
    setImagePreviewVisible(true)
  }

  const closeImagePreview = () => {
    setImagePreviewVisible(false)
    setPreviewImageUrl('')
  }

  useEffect(() => {
    loadChatMessages()
  }, [chatId])

  useEffect(() => {
    const currentCount = messages.length
    if (currentCount > prevMessageCount.current && currentCount > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false })
      }, 100)
    }
    prevMessageCount.current = currentCount
  }, [messages.length])

  const navigateToProfile = () => {
    if (otherUser && otherUserId) {
      navigation.navigate('ViewProfile', {
        userId: otherUserId,
        chatId: chatId,
      })
    }
  }

  const handleBack = useCallback(() => {
    console.log('⬅️ Back pressed')

    if (isInSidebar && Platform.OS === 'web') {
      console.log('🌐 Web sidebar mode - updating URL only')
      if (window?.history) {
        window.history.pushState({}, '', '/chats')
      }
      return
    }

    console.log('📱 Normal mode - navigating back')
    if (navigation?.goBack) {
      navigation.goBack()
    }
  }, [isInSidebar, navigation])

  const showBackButton = useMemo(() => {
    const shouldShow = !(Platform.OS === 'web' && isInSidebar)
    console.log('🔍 showBackButton calculated:', {
      platform: Platform.OS,
      isInSidebar,
      shouldShow,
    })
    return shouldShow
  }, [isInSidebar])

  /* ---------- render item (message or call log) ---------- */
  const renderItem = useCallback(({ item, index }) => {
    if (item.type === 'call') {
      return (
        <CallLogItem
          callLog={item.data}
          onCallback={() => handleCallCallback(item.data)}
        />
      )
    }

    // Render message
    const previousItem =
      index > 0 && combinedItems[index - 1].type === 'message'
        ? combinedItems[index - 1].data
        : null

    return (
      <MessageItem
        item={item.data}
        previousItem={previousItem}
        currentUserId={user?.uid}
        users={users}
        onImagePress={handleImagePress}
        onLongPress={handleMessageLongPress}
        onThreeDotsPress={handleMessageThreeDotsPress}
        hoveredMessageId={hoveredMessageId}
        setHoveredMessageId={setHoveredMessageId}
      />
    )
  })

  /* ---------- render ---------- */
  if (!chatId) {
    return (
      <Container>
        <ErrorContainer>
          <ErrorText>Invalid chat selected</ErrorText>
          <RetryButton onPress={handleBack}>
            <RetryButtonText>Go Back</RetryButtonText>
          </RetryButton>
        </ErrorContainer>
      </Container>
    )
  }

  if (loading) {
    return (
      <Container>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Header>
          <BackButton onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </BackButton>
          <HeaderAvatar color={chatInfo.color}>
            <HeaderAvatarText>{getInitials(chatInfo.name)}</HeaderAvatarText>
          </HeaderAvatar>
          <HeaderInfo>
            <HeaderName>{chatInfo.name}</HeaderName>
            <HeaderStatus>Loading...</HeaderStatus>
          </HeaderInfo>
        </Header>
        <LoadingContainer>
          <LoadingIndicator
            type="pulse"
            size="large"
            showText={true}
            text="Loading messages..."
            showCard={true}
            subtext="Please wait while we sync your messages"
          />
        </LoadingContainer>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Header>
          <BackButton onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </BackButton>
          <HeaderAvatar color={chatInfo.color}>
            <HeaderAvatarText>{getInitials(chatInfo.name)}</HeaderAvatarText>
          </HeaderAvatar>
          <HeaderInfo>
            <HeaderName>{chatInfo.name}</HeaderName>
            <HeaderStatus>Error</HeaderStatus>
          </HeaderInfo>
        </Header>
        <ErrorContainer>
          <ErrorText>{error}</ErrorText>
          <RetryButton onPress={loadChatMessages}>
            <RetryButtonText>Retry</RetryButtonText>
          </RetryButton>
        </ErrorContainer>
      </Container>
    )
  }

  return (
    <Container>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Header>
        {/* Alternative Method 2: Always render but control visibility */}
        <BackButton
          onPress={handleBack}
          style={{
            display: showBackButton ? 'flex' : 'none',
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </BackButton>
        {/* Make the header info clickable */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            marginLeft: showBackButton ? 0 : 16,
          }}
          onPress={navigateToProfile}
          activeOpacity={0.7}
        >
          <HeaderAvatar color={chatInfo.color}>
            {chatInfo.isOnline && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#27ae60',
                  borderWidth: 2,
                  borderColor: '#fff',
                }}
              />
            )}
            <HeaderAvatarText>{getInitials(chatInfo.name)}</HeaderAvatarText>
          </HeaderAvatar>

          <HeaderInfo>
            <HeaderName>{chatInfo.name}</HeaderName>
            <HeaderStatus
              style={{ color: chatInfo.isOnline ? '#27ae60' : '#95a5a6' }}
            >
              {chatInfo.status}
            </HeaderStatus>
          </HeaderInfo>
        </TouchableOpacity>

        <HeaderActions>
          <View style={{ marginRight: 8 }}>
            <Ionicons
              name={wsConnected ? 'wifi' : 'wifi-off'}
              size={16}
              color={wsConnected ? '#27ae60' : '#e74c3c'}
            />
          </View>
          <HeaderActionButton onPress={startVideoCall} bgColor="#e8f5e8">
            <Ionicons name="videocam" size={24} color="#27ae60" />
          </HeaderActionButton>
          <HeaderActionButton onPress={startAudioCall} bgColor="#e8f4fd">
            <Ionicons name="call" size={24} color="#3498db" />
          </HeaderActionButton>
        </HeaderActions>
      </Header>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <MessagesContainer>
          <FlatList
            ref={flatListRef}
            data={combinedItems}
            keyExtractor={(item, index) =>
              item.type === 'call'
                ? `call-${item.data._id || item.data.id || index}`
                : `message-${item.data._id || item.data.id || index}`
            }
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={() => (
              <ErrorContainer>
                <ErrorText>No messages yet. Start the conversation!</ErrorText>
              </ErrorContainer>
            )}
          />

          {/* Typing indicator at bottom of messages */}
          {isTyping && (
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{ color: '#7f8c8d', fontSize: 14, fontStyle: 'italic' }}
              >
                {getTypingText()}
              </Text>
            </View>
          )}
        </MessagesContainer>

        <>
          {selectedFiles.length > 0 && (
            <SelectedFilesContainer>
              {selectedFiles.map((file, index) => (
                <SelectedFileChip key={index}>
                  <SelectedFileText numberOfLines={1}>
                    {file.name}
                  </SelectedFileText>
                  <RemoveFileButton onPress={() => removeSelectedFile(index)}>
                    <Ionicons name="close" size={12} color="white" />
                  </RemoveFileButton>
                </SelectedFileChip>
              ))}
            </SelectedFilesContainer>
          )}

          {!showRecordingUI && (
            <InputContainer>
              <CameraButton onPress={showImagePickerOptions}>
                <Ionicons name="camera" size={24} color="#7f8c8d" />
              </CameraButton>
              <AttachmentButton onPress={pickMultipleFiles}>
                <Ionicons name="attach" size={24} color="#7f8c8d" />
              </AttachmentButton>
              <AttachmentButton onPress={startRecording}>
                <Ionicons name="mic" size={24} color="#e74c3c" />
              </AttachmentButton>
              <InputWrapper>
                <TextInput
                  value={message}
                  onChangeText={handleMessageChange} // Use the new handler
                  onBlur={stopTyping} // Stop typing on blur
                  placeholder="Type a message..."
                  placeholderTextColor="#bdc3c7"
                  multiline
                  textAlignVertical="center"
                  editable={!sending}
                />
              </InputWrapper>
              <SendButton
                disabled={
                  (!message.trim() && selectedFiles.length === 0) || sending
                }
                onPress={
                  () =>
                    selectedFiles.length > 0
                      ? sendSelectedFiles()
                      : handleSendMessageWithTyping() // Use the new handler
                }
              >
                <Ionicons
                  name={sending ? 'hourglass' : 'send'}
                  size={20}
                  color="#fff"
                />
              </SendButton>
            </InputContainer>
          )}

          {showRecordingUI && (
            <AudioRecordingContainer>
              <RecordingIndicator>
                <RecordingDot />
                <RecordingText>Recording</RecordingText>
                <RecordingTime>
                  {formatRecordingTime(recordingDuration)}
                </RecordingTime>
              </RecordingIndicator>

              <SoundWaveAnimation />

              <RecordingActions>
                <CancelRecordButton onPress={cancelRecording}>
                  <Ionicons name="close" size={28} color="white" />
                </CancelRecordButton>
                <RecordButton recording={!!recording}>
                  <Ionicons name="stop" size={28} color="white" />
                </RecordButton>
                <SendRecordButton onPress={sendRecording}>
                  <Ionicons name="send" size={24} color="white" />
                </SendRecordButton>
              </RecordingActions>
            </AudioRecordingContainer>
          )}
        </>
      </KeyboardAvoidingView>

      <ImagePreviewModal
        visible={imagePreviewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImagePreview}
      >
        <ImagePreviewContainer>
          <ImagePreviewHeader>
            <View />
            <CloseButton onPress={closeImagePreview}>
              <Ionicons name="close" size={24} color="white" />
            </CloseButton>
          </ImagePreviewHeader>
          <FullScreenImage
            source={{ uri: previewImageUrl }}
            resizeMode="contain"
          />
        </ImagePreviewContainer>
      </ImagePreviewModal>

      {/* Mobile Action Menu */}
      <MessageActionMenu
        visible={actionMenuVisible}
        onClose={closeActionMenu}
        onEdit={handleEditMessage}
        onDelete={handleDeleteMessage}
      />

      {/* Web Dropdown - MUST be outside any overflow:hidden containers */}
      {Platform.OS === 'web' && webDropdownVisible && (
        <WebMessageDropdown
          visible={true} // Force true since we're conditionally rendering
          onClose={closeWebDropdown}
          position={dropdownPosition}
          onEdit={handleEditMessage}
          onDelete={handleDeleteMessage}
        />
      )}

      {/* Edit Modal */}
      <EditMessageModal
        visible={editModalVisible}
        onClose={closeEditModal}
        initialContent={selectedMessage?.content || ''}
        onSave={handleSaveEdit}
        saving={savingEdit}
      />
    </Container>
  )
}
