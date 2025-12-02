import React, { useState } from 'react'
import {
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import styled from 'styled-components/native'

const VideoContainer = styled(TouchableOpacity)`
  width: 300px;
  height: 160px;
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
  right: 12px;
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
  right: 12px;
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

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
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

  return (
    <VideoContainer
      activeOpacity={0.9}
      onPress={() => {
        console.log('Video tapped → navigating...', videoUrl)
        onPress?.()
      }}
    >
      {renderThumbnail()}

      <Overlay pointerEvents="none">
        <PlayButton>
          <Ionicons name="play" size={28} color="white" />
        </PlayButton>
      </Overlay>

      {fileSize && (
        <FileSizeBadge>
          <FileSizeText>{formatFileSize(fileSize)}</FileSizeText>
        </FileSizeBadge>
      )}

      {duration && duration !== '0:00' && (
        <DurationBadge>
          <Ionicons name="time-outline" size={14} color="white" />
          <BadgeText>{duration}</BadgeText>
        </DurationBadge>
      )}
    </VideoContainer>
  )
}
