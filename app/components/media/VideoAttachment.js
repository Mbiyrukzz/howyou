import React, { useState } from 'react'
import {
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { File, Paths } from 'expo-file-system'
import styled from 'styled-components/native'

const { width: screenWidth } = Dimensions.get('window')

// Calculate video dimensions
const getVideoDimensions = () => {
  const maxWidth = screenWidth > 768 ? 300 : screenWidth * 0.7 // 70% of screen width on mobile
  const height = maxWidth * 0.5625 // 16:9 aspect ratio
  return { width: maxWidth, height }
}

const { width: videoWidth, height: videoHeight } = getVideoDimensions()

const VideoContainer = styled(TouchableOpacity)`
  width: ${videoWidth}px;
  height: ${videoHeight}px;
  border-radius: 16px;
  overflow: hidden;
  background-color: #0f172a;
  margin-vertical: 4px;
  position: relative;
  border-width: 1px;
  border-color: #1e293b;
`

const ThumbnailImage = styled(Image)`
  width: 100%;
  height: 100%;
`

const Overlay = styled(View)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.3);
`

const PlayButton = styled(View)`
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background-color: rgba(59, 130, 246, 0.95);
  justify-content: center;
  align-items: center;
  shadow-color: #3b82f6;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.4;
  shadow-radius: 8px;
  elevation: 6;
`

const DurationBadge = styled(View)`
  position: absolute;
  bottom: 12px;
  left: 12px;
  background-color: rgba(0, 0, 0, 0.85);
  padding: 6px 10px;
  border-radius: 8px;
  flex-direction: row;
  align-items: center;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.1);
`

const BadgeText = styled(Text)`
  color: white;
  font-size: 12px;
  font-weight: 700;
  margin-left: 4px;
`

const FileSizeBadge = styled(View)`
  position: absolute;
  top: 12px;
  left: 12px;
  background-color: rgba(0, 0, 0, 0.85);
  padding: 4px 8px;
  border-radius: 6px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.1);
`

const FileSizeText = styled(Text)`
  color: rgba(255, 255, 255, 0.9);
  font-size: 10px;
  font-weight: 600;
`

const LoadingContainer = styled(View)`
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  background-color: #1e293b;
`

const ErrorContainer = styled(View)`
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  background-color: #1e293b;
`

const ErrorText = styled(Text)`
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  margin-top: 8px;
`

const formatFileSize = (bytes) => {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  if (mb < 1) {
    const kb = bytes / 1024
    return `${kb.toFixed(0)} KB`
  }
  return `${mb.toFixed(1)} MB`
}

export const VideoAttachment = ({
  videoUrl,
  thumbnailUrl,
  duration = '0:00',
  fileSize,
  hasText,
  onPress,
}) => {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const handleImageLoad = () => {
    console.log('✅ Video thumbnail loaded')
    setImageLoading(false)
  }

  const handleImageError = () => {
    console.log('❌ Video thumbnail error')
    setImageLoading(false)
    setImageError(true)
  }

  const downloadVideo = async (e) => {
    // Stop event propagation to prevent triggering onPress
    if (e && e.stopPropagation) {
      e.stopPropagation()
    }

    console.log('🎬 Download button pressed')

    if (!videoUrl) {
      Alert.alert('Error', 'Video URL is missing')
      return
    }

    setDownloading(true)

    try {
      // Extract extension from URL or default to mp4
      const urlParts = videoUrl.split('.')
      const extension = urlParts[urlParts.length - 1].split('?')[0] || 'mp4'
      const fileName = `video_${Date.now()}.${extension}`

      console.log('📥 Starting video download:', {
        from: videoUrl,
        fileName: fileName,
      })

      if (Platform.OS === 'web') {
        // Web: Create download link
        const link = document.createElement('a')
        link.href = videoUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        Alert.alert('Success', 'Video download started')
      } else {
        // iOS/Android: Use new File API
        const downloadPath = `${Paths.document}/${fileName}`
        const file = new File(downloadPath)

        console.log('Downloading to:', downloadPath)

        await file.create()
        const response = await fetch(videoUrl)

        if (!response.ok) {
          throw new Error(`Download failed with status: ${response.status}`)
        }

        const blob = await response.blob()
        await file.write(blob)

        console.log('✅ Download completed:', downloadPath)

        Alert.alert('Download Complete', `Video saved: ${fileName}`)
      }
    } catch (error) {
      console.error('❌ Download error:', error)
      Alert.alert(
        'Download Failed',
        error.message || 'Failed to download video'
      )
    } finally {
      setDownloading(false)
    }
  }

  const renderThumbnail = () => {
    if (imageError) {
      return (
        <ErrorContainer>
          <Ionicons
            name="film-outline"
            size={48}
            color="rgba(255,255,255,0.5)"
          />
          <ErrorText>Preview unavailable</ErrorText>
        </ErrorContainer>
      )
    }

    return (
      <>
        {imageLoading && (
          <LoadingContainer>
            <ActivityIndicator size="large" color="#3b82f6" />
          </LoadingContainer>
        )}
        <ThumbnailImage
          source={{ uri: thumbnailUrl || videoUrl }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ opacity: imageLoading ? 0 : 1 }}
          resizeMode="cover"
        />
      </>
    )
  }

  console.log('🎥 Video render state:', {
    imageLoading,
    imageError,
    downloading,
  })

  return (
    <VideoContainer
      activeOpacity={0.9}
      onPress={() => {
        console.log('Video tapped → navigating...', videoUrl)
        onPress?.()
      }}
    >
      {renderThumbnail()}

      <Overlay pointerEvents="box-none">
        <PlayButton>
          <Ionicons name="play" size={28} color="white" />
        </PlayButton>
      </Overlay>

      {fileSize && !imageLoading && (
        <FileSizeBadge>
          <FileSizeText>{formatFileSize(fileSize)}</FileSizeText>
        </FileSizeBadge>
      )}

      {duration && duration !== '0:00' && !imageLoading && (
        <DurationBadge>
          <Ionicons name="time-outline" size={14} color="white" />
          <BadgeText>{duration}</BadgeText>
        </DurationBadge>
      )}

      {!imageLoading && (
        <View
          style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            zIndex: 999,
          }}
        >
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation()
              downloadVideo(e)
            }}
            disabled={downloading}
            activeOpacity={0.8}
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.95)',
              padding: 10,
              borderRadius: 50,
              shadowColor: '#3b82f6',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.4,
              shadowRadius: 4,
              elevation: 8,
            }}
          >
            {downloading ? (
              <Ionicons name="refresh" size={20} color="white" />
            ) : (
              <Ionicons name="download-outline" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      )}
    </VideoContainer>
  )
}
