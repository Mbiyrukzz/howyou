import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
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
        <ImageBadge>
          <Ionicons name="expand-outline" size={14} color="white" />
          <BadgeText>Tap to View</BadgeText>
        </ImageBadge>
      )}
    </MessageImageContainer>
  )
}
