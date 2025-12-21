import React, { useState } from 'react'
import { Alert, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { File, Paths } from 'expo-file-system'
import {
  MessageImageContainer,
  MessageImage,
  ImageLoadingOverlay,
  LoadingText,
} from '../../styles/chatStyles'
import styled from 'styled-components/native'

// Enhanced Image Badge Components
const ImageBadge = styled.View`
  position: absolute;
  top: 12px;
  right: 12px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 6px 12px;
  border-radius: 12px;
  flex-direction: row;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.3;
  shadow-radius: 4px;
  elevation: 3;
`

const BadgeText = styled.Text`
  color: white;
  font-size: 11px;
  font-weight: 700;
  margin-left: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const DownloadButton = styled.TouchableOpacity`
  position: absolute;
  bottom: 12px;
  right: 12px;
  background-color: rgba(59, 130, 246, 0.95);
  padding: 10px;
  border-radius: 50px;
  shadow-color: #3b82f6;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.4;
  shadow-radius: 4px;
  elevation: 4;
`

const LoadingContainer = styled.View`
  justify-content: center;
  align-items: center;
`

const ErrorContainer = styled.View`
  justify-content: center;
  align-items: center;
  padding: 20px;
`

const ErrorText = styled.Text`
  color: #ef4444;
  font-size: 13px;
  font-weight: 700;
  margin-top: 8px;
  text-align: center;
`

export const ImageAttachment = ({ imageUrl, hasText, onPress }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const downloadImage = async (e) => {
    // Stop event propagation to prevent triggering onPress
    e?.stopPropagation()

    if (!imageUrl) {
      Alert.alert('Error', 'Image URL is missing')
      return
    }

    setDownloading(true)

    try {
      // Extract extension from URL or default to jpg
      const urlParts = imageUrl.split('.')
      const extension = urlParts[urlParts.length - 1].split('?')[0] || 'jpg'
      const fileName = `image_${Date.now()}.${extension}`

      console.log('📥 Starting image download:', {
        from: imageUrl,
        fileName: fileName,
      })

      if (Platform.OS === 'web') {
        // Web: Create download link
        const response = await fetch(imageUrl)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        Alert.alert('Success', 'Image download started')
      } else {
        // iOS/Android: Use new File API
        const downloadPath = `${Paths.document}/${fileName}`
        const file = new File(downloadPath)

        console.log('Downloading to:', downloadPath)

        await file.create()
        const response = await fetch(imageUrl)

        if (!response.ok) {
          throw new Error(`Download failed with status: ${response.status}`)
        }

        const blob = await response.blob()
        await file.write(blob)

        console.log('✅ Download completed:', downloadPath)

        Alert.alert('Download Complete', `Image saved: ${fileName}`)
      }
    } catch (error) {
      console.error('❌ Download error:', error)
      Alert.alert(
        'Download Failed',
        error.message || 'Failed to download image'
      )
    } finally {
      setDownloading(false)
    }
  }

  return (
    <MessageImageContainer
      onPress={() => !error && onPress(imageUrl)}
      activeOpacity={0.9}
      disabled={error}
    >
      <MessageImage
        source={{ uri: imageUrl }}
        hasText={hasText}
        resizeMode="cover"
        onLoad={() => {
          setLoading(false)
          setError(false)
        }}
        onError={() => {
          setLoading(false)
          setError(true)
        }}
      />

      {loading && (
        <ImageLoadingOverlay>
          <LoadingContainer>
            <Ionicons name="image-outline" size={36} color="white" />
            <LoadingText>Loading...</LoadingText>
          </LoadingContainer>
        </ImageLoadingOverlay>
      )}

      {error && (
        <ImageLoadingOverlay>
          <ErrorContainer>
            <Ionicons name="alert-circle" size={36} color="#ef4444" />
            <ErrorText>Failed to load image</ErrorText>
          </ErrorContainer>
        </ImageLoadingOverlay>
      )}

      {!loading && !error && (
        <>
          <ImageBadge>
            <Ionicons name="expand-outline" size={14} color="white" />
            <BadgeText>Tap to View</BadgeText>
          </ImageBadge>

          <DownloadButton
            onPress={downloadImage}
            disabled={downloading}
            activeOpacity={0.8}
          >
            {downloading ? (
              <Ionicons name="refresh" size={20} color="white" />
            ) : (
              <Ionicons name="download-outline" size={20} color="white" />
            )}
          </DownloadButton>
        </>
      )}
    </MessageImageContainer>
  )
}
