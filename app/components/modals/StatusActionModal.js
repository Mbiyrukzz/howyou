import React from 'react'
import styled from 'styled-components/native'
import { Modal, TouchableWithoutFeedback } from 'react-native'
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

export const StatusActionModal = ({
  visible,
  onClose,
  onAdd,
  onView,
  statusCount,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <ModalOverlay>
          <TouchableWithoutFeedback>
            <ModalContent>
              <ModalTitle>Your Status</ModalTitle>
              <ModalSubtitle>
                You have {statusCount} active{' '}
                {statusCount === 1 ? 'status' : 'statuses'}
              </ModalSubtitle>

              <ModalButton bgColor="#dbeafe" onPress={onView}>
                <Ionicons name="eye-outline" size={24} color="#2563eb" />
                <ModalButtonText color="#2563eb">View Status</ModalButtonText>
              </ModalButton>

              <ModalButton bgColor="#e0e7ff" onPress={onAdd}>
                <Ionicons name="add-circle-outline" size={24} color="#4f46e5" />
                <ModalButtonText color="#4f46e5">
                  Add New Status
                </ModalButtonText>
              </ModalButton>

              <ModalCancelButton onPress={onClose}>
                <ModalCancelText>Cancel</ModalCancelText>
              </ModalCancelButton>
            </ModalContent>
          </TouchableWithoutFeedback>
        </ModalOverlay>
      </TouchableWithoutFeedback>
    </Modal>
  )
}
