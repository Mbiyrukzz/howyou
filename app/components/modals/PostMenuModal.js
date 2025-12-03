import React from 'react'
import styled from 'styled-components/native'
import {
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
`

const ModalContent = styled.View`
  background-color: #fff;
  border-radius: 20px;
  width: 85%;
  max-width: 350px;
  padding: 24px;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 10;
`

const ModalTitle = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  text-align: center;
  margin-bottom: 8px;
`

const ModalSubtitle = styled.Text`
  font-size: 14px;
  color: #64748b;
  text-align: center;
  margin-bottom: 24px;
`

const ModalButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  background-color: ${(props) => props.bgColor || '#f1f5f9'};
  margin-bottom: 12px;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 2;
`

const ModalButtonText = styled.Text`
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => props.color || '#1e293b'};
  margin-left: 12px;
`

const ModalCancelButton = styled.TouchableOpacity`
  padding: 16px;
  align-items: center;
  border-radius: 12px;
  background-color: #f1f5f9;
  margin-top: 8px;
`

const ModalCancelText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #64748b;
`

export const PostMenuModal = ({
  visible,
  post,
  onClose,
  onEdit,
  onDelete,
  isDeleting,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={!isDeleting ? onClose : null}>
        <ModalOverlay>
          <TouchableWithoutFeedback>
            <ModalContent>
              <ModalTitle>Post Options</ModalTitle>
              <ModalSubtitle>{post?.username}'s post</ModalSubtitle>

              <ModalButton
                bgColor="#dbeafe"
                onPress={onEdit}
                disabled={isDeleting}
              >
                <Ionicons name="create-outline" size={24} color="#2563eb" />
                <ModalButtonText color="#2563eb">Edit Post</ModalButtonText>
              </ModalButton>

              <ModalButton
                bgColor="#fee2e2"
                onPress={onDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#dc2626" />
                ) : (
                  <Ionicons name="trash-outline" size={24} color="#dc2626" />
                )}
                <ModalButtonText color="#dc2626">
                  {isDeleting ? 'Deleting...' : 'Delete Post'}
                </ModalButtonText>
              </ModalButton>

              <ModalCancelButton onPress={onClose} disabled={isDeleting}>
                <ModalCancelText>Cancel</ModalCancelText>
              </ModalCancelButton>
            </ModalContent>
          </TouchableWithoutFeedback>
        </ModalOverlay>
      </TouchableWithoutFeedback>
    </Modal>
  )
}
