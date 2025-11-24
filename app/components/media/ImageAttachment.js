import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import {
  MessageImageContainer,
  MessageImage,
  ImageLoadingOverlay,
  LoadingText,
} from '../../styles/chatStyles'

export const ImageAttachment = ({ imageUrl, hasText, onPress }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  return (
    <MessageImageContainer onPress={() => onPress(imageUrl)}>
      <MessageImage
        source={{ uri: imageUrl }}
        hasText={hasText}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false)
          setError(true)
        }}
      />
      {loading && (
        <ImageLoadingOverlay>
          <Ionicons name="image-outline" size={24} color="white" />
          <LoadingText>Loading</LoadingText>
        </ImageLoadingOverlay>
      )}
      {error && (
        <ImageLoadingOverlay>
          <Ionicons name="alert-circle-outline" size={24} color="white" />
          <LoadingText>Failed to load</LoadingText>
        </ImageLoadingOverlay>
      )}
    </MessageImageContainer>
  )
}
