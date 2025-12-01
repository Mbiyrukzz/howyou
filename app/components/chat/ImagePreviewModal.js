import React, { useState } from 'react'
import { Platform, Vibration } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import styled from 'styled-components/native'
import {
  ImagePreviewModal as Modal,
  ImagePreviewContainer,
  ImagePreviewHeader,
  CloseButton,
  FullScreenImage,
} from '../../styles/chatStyles'

// Enhanced styled components
const EnhancedHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: ${Platform.OS === 'ios' ? '60px 20px 20px' : '20px'};
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
`

const HeaderLeft = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
`

const HeaderTitle = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin-left: 12px;
`

const HeaderActions = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 12px;
`

const ActionButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  align-items: center;
  justify-content: center;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.3;
  shadow-radius: 4px;
  elevation: 4;
`

const EnhancedCloseButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: rgba(239, 68, 68, 0.9);
  backdrop-filter: blur(10px);
  align-items: center;
  justify-content: center;
  shadow-color: #ef4444;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.4;
  shadow-radius: 4px;
  elevation: 4;
`

const ImageInfo = styled.View`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background: linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.7) 0%,
    rgba(0, 0, 0, 0) 100%
  );
`

const InfoRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 8px;
`

const InfoLabel = styled.Text`
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-right: 8px;
`

const InfoValue = styled.Text`
  color: white;
  font-size: 14px;
  font-weight: 500;
`

const LoadingIndicator = styled.View`
  position: absolute;
  top: 50%;
  left: 50%;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 16px;
  border-radius: 12px;
`

const LoadingText = styled.Text`
  color: white;
  font-size: 13px;
  font-weight: 600;
  margin-top: 8px;
`

export const ImagePreviewModal = ({
  visible,
  imageUrl,
  onClose,
  onDownload,
  onShare,
  imageName = 'Image',
  imageSize,
  showInfo = false,
}) => {
  const [isLoading, setIsLoading] = useState(true)

  const handleClose = () => {
    Vibration.vibrate(10)
    onClose()
  }

  const handleDownload = () => {
    Vibration.vibrate(10)
    if (onDownload) onDownload()
  }

  const handleShare = () => {
    Vibration.vibrate(10)
    if (onShare) onShare()
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size'
    const kb = bytes / 1024
    const mb = kb / 1024
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <ImagePreviewContainer>
        <EnhancedHeader>
          <HeaderLeft>
            <Ionicons name="image" size={20} color="white" />
            <HeaderTitle>{imageName}</HeaderTitle>
          </HeaderLeft>

          <HeaderActions>
            {onShare && (
              <ActionButton onPress={handleShare} activeOpacity={0.7}>
                <Ionicons name="share-outline" size={22} color="white" />
              </ActionButton>
            )}

            {onDownload && (
              <ActionButton onPress={handleDownload} activeOpacity={0.7}>
                <Ionicons name="download-outline" size={22} color="white" />
              </ActionButton>
            )}

            <EnhancedCloseButton onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color="white" />
            </EnhancedCloseButton>
          </HeaderActions>
        </EnhancedHeader>

        <FullScreenImage
          source={{ uri: imageUrl }}
          resizeMode="contain"
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
        />

        {isLoading && (
          <LoadingIndicator>
            <Ionicons name="hourglass-outline" size={24} color="white" />
            <LoadingText>Loading...</LoadingText>
          </LoadingIndicator>
        )}

        {showInfo && !isLoading && (
          <ImageInfo>
            <InfoRow>
              <Ionicons name="document-outline" size={14} color="#94a3b8" />
              <InfoLabel>Name:</InfoLabel>
              <InfoValue>{imageName}</InfoValue>
            </InfoRow>
            {imageSize && (
              <InfoRow>
                <Ionicons name="scale-outline" size={14} color="#94a3b8" />
                <InfoLabel>Size:</InfoLabel>
                <InfoValue>{formatFileSize(imageSize)}</InfoValue>
              </InfoRow>
            )}
          </ImageInfo>
        )}
      </ImagePreviewContainer>
    </Modal>
  )
}
