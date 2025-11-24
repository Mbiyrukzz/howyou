import React from 'react'
import { Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  ImagePreviewModal as Modal,
  ImagePreviewContainer,
  ImagePreviewHeader,
  CloseButton,
  FullScreenImage,
} from '../../styles/chatStyles'

export const ImagePreviewModal = ({ visible, imageUrl, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <ImagePreviewContainer>
        <ImagePreviewHeader>
          <div />
          <CloseButton onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </CloseButton>
        </ImagePreviewHeader>
        <FullScreenImage source={{ uri: imageUrl }} resizeMode="contain" />
      </ImagePreviewContainer>
    </Modal>
  )
}
