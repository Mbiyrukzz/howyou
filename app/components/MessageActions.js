// components/MessageActions.js - FIXED VERSION
import React, { useState, useEffect } from 'react'
import { Modal, TouchableOpacity, Platform, View } from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'

/* =================== Mobile Action Menu Styles =================== */
const ActionMenuOverlay = styled.TouchableOpacity`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
`

const ActionMenuContainer = styled.View`
  background-color: #fff;
  border-radius: 12px;
  min-width: 200px;
  max-width: 300px;
  overflow: hidden;
  elevation: 5;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
`

const ActionMenuItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 16px 20px;
  border-bottom-width: 1px;
  border-bottom-color: #14af90ff;
  background-color: ${(props) => (props.destructive ? '#fff5f5' : '#fff')};
`

const ActionMenuText = styled.Text`
  font-size: 16px;
  color: ${(props) => (props.destructive ? '#e74c3c' : '#2c3e50')};
  margin-left: 12px;
  font-weight: 500;
`

const ActionMenuCancel = styled.TouchableOpacity`
  padding: 16px 20px;
  align-items: center;
  background-color: #f8f9fa;
`

const ActionMenuCancelText = styled.Text`
  font-size: 16px;
  color: #7f8c8d;
  font-weight: 600;
`

/* =================== Web Dropdown Styles =================== */
const DropdownOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999999;
`

const DropdownBackdrop = styled.TouchableOpacity`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`

const DropdownMenu = styled.View`
  position: absolute;
  background-color: white;
  border-radius: 12px;
  min-width: 160px;
  overflow: hidden;
  border: 1px solid #e5e7eb;

  ${Platform.OS === 'web'
    ? `
      filter: drop-shadow(0px 8px 20px rgba(0,0,0,0.15));
    `
    : `
      shadow-color: #000;
      shadow-offset: 0px 4px;
      shadow-opacity: 0.25;
      shadow-radius: 8px;
      elevation: 5;
    `}
`

const DropdownItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 14px 16px;
  border-bottom-width: ${(props) => (props.destructive ? 0 : 1)}px;
  border-bottom-color: #f3f4f6;
  background-color: ${(props) => (props.destructive ? '#fef2f2' : 'white')};
`

const DropdownText = styled.Text`
  font-size: 15px;
  font-weight: 500;
  color: ${(props) => (props.destructive ? '#dc2626' : '#374151')};
`

/* =================== Edit Modal Styles =================== */
const EditModalContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 20px;
`

const EditModalContent = styled.View`
  background-color: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  padding: 20px;
  elevation: 10;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
`

const EditModalHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`

const EditModalTitle = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
`

const EditModalInput = styled.TextInput`
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
  color: #2c3e50;
  min-height: 100px;
  max-height: 200px;
  border: 1px solid #e9ecef;
  margin-bottom: 16px;
`

const EditModalActions = styled.View`
  flex-direction: row;
  justify-content: flex-end;
`

const EditModalButton = styled.TouchableOpacity`
  padding: 12px 20px;
  border-radius: 8px;
  background-color: ${(props) => (props.primary ? '#3498db' : '#e9ecef')};
  min-width: 80px;
  align-items: center;
  margin-left: 12px;
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
`

const EditModalButtonText = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => (props.primary ? '#fff' : '#7f8c8d')};
`

/* =================== Exported Styled Components =================== */
export const ThreeDotsButton = styled.TouchableOpacity`
  padding: 8px;
  border-radius: 4px;
  background-color: ${(props) => (props.visible ? '#e9ecef' : 'transparent')};
  opacity: ${(props) => (props.visible ? 1 : 0.3)};
  z-index: 10;
`

export const MessageEditedLabel = styled.Text`
  font-size: 11px;
  color: ${(props) => (props.isOwn ? 'rgba(255, 255, 255, 0.6)' : '#95a5a6')};
  font-style: italic;
  margin-left: 4px;
`

/* =================== Component: MessageActionMenu =================== */
export const MessageActionMenu = ({ visible, onClose, onEdit, onDelete }) => {
  if (Platform.OS === 'web') return null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <ActionMenuOverlay activeOpacity={1} onPress={onClose}>
        <ActionMenuContainer>
          <ActionMenuItem onPress={onEdit}>
            <Ionicons name="pencil" size={20} color="#3498db" />
            <ActionMenuText>Edit Message</ActionMenuText>
          </ActionMenuItem>
          <ActionMenuItem destructive onPress={onDelete}>
            <Ionicons name="trash" size={20} color="#e74c3c" />
            <ActionMenuText destructive>Delete Message</ActionMenuText>
          </ActionMenuItem>
          <ActionMenuCancel onPress={onClose}>
            <ActionMenuCancelText>Cancel</ActionMenuCancelText>
          </ActionMenuCancel>
        </ActionMenuContainer>
      </ActionMenuOverlay>
    </Modal>
  )
}

/* =================== Component: WebMessageDropdown =================== */
export const WebMessageDropdown = ({
  visible,
  onClose,
  position,
  onEdit,
  onDelete,
}) => {
  if (!visible || Platform.OS !== 'web') return null

  const menuWidth = 160
  const menuHeight = 100

  const safeX = Math.max(
    10,
    Math.min(position?.x || 0, window.innerWidth - menuWidth - 10)
  )
  const safeY = Math.max(
    10,
    Math.min(position?.y || 0, window.innerHeight - menuHeight - 10)
  )

  return (
    <DropdownOverlay pointerEvents="auto">
      <DropdownBackdrop onPress={onClose} />
      <DropdownMenu
        style={{
          left: safeX,
          top: safeY,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <DropdownItem onPress={onEdit}>
          <Ionicons name="create-outline" size={20} color="#3498db" />
          <DropdownText>Edit</DropdownText>
        </DropdownItem>
        <DropdownItem destructive onPress={onDelete}>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
          <DropdownText destructive>Delete</DropdownText>
        </DropdownItem>
      </DropdownMenu>
    </DropdownOverlay>
  )
}

/* =================== Component: EditMessageModal =================== */
export const EditMessageModal = ({
  visible,
  onClose,
  initialContent,
  onSave,
  saving,
}) => {
  // ✅ FIXED: useState is now at the TOP of the component
  const [editedContent, setEditedContent] = useState(initialContent || '')

  // ✅ FIXED: useEffect is now AFTER useState
  useEffect(() => {
    if (visible) {
      setEditedContent(initialContent || '')
    }
  }, [initialContent, visible])

  const handleSave = () => {
    const trimmed = editedContent.trim()
    if (trimmed && trimmed !== (initialContent || '').trim()) {
      onSave(trimmed)
    } else {
      onClose()
    }
  }

  const isSaveDisabled =
    saving ||
    !editedContent.trim() ||
    editedContent.trim() === (initialContent || '').trim()

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <EditModalContainer>
        <EditModalContent>
          <EditModalHeader>
            <EditModalTitle>Edit Message</EditModalTitle>
            <TouchableOpacity onPress={onClose} disabled={saving}>
              <Ionicons name="close" size={24} color="#7f8c8d" />
            </TouchableOpacity>
          </EditModalHeader>

          <EditModalInput
            value={editedContent}
            onChangeText={setEditedContent}
            placeholder="Enter message..."
            placeholderTextColor="#bdc3c7"
            multiline
            autoFocus
            editable={!saving}
            textAlignVertical="top"
          />

          <EditModalActions>
            <EditModalButton onPress={onClose} disabled={saving}>
              <EditModalButtonText>Cancel</EditModalButtonText>
            </EditModalButton>
            <EditModalButton
              primary
              onPress={handleSave}
              disabled={isSaveDisabled}
            >
              <EditModalButtonText primary>
                {saving ? 'Saving...' : 'Save'}
              </EditModalButtonText>
            </EditModalButton>
          </EditModalActions>
        </EditModalContent>
      </EditModalContainer>
    </Modal>
  )
}
