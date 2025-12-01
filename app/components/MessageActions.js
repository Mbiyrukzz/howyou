import React, { useState, useEffect } from 'react'
import { Modal, TouchableOpacity, Platform, View } from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'

/* =================== Mobile Action Menu Styles =================== */
const ActionMenuOverlay = styled.TouchableOpacity`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.6);
  justify-content: flex-end;
  padding-bottom: 20px;
`

const ActionMenuContainer = styled.View`
  background-color: #fff;
  border-radius: 20px;
  margin: 0 16px;
  overflow: hidden;
  elevation: 10;
  shadow-color: #000;
  shadow-offset: 0px -4px;
  shadow-opacity: 0.2;
  shadow-radius: 12px;
`

const ActionMenuItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 18px 24px;
  background-color: ${(props) => (props.destructive ? '#fff' : '#fff')};
`

const ActionIconWrapper = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${(props) => {
    if (props.destructive) return '#fee2e2'
    return '#dbeafe'
  }};
  align-items: center;
  justify-content: center;
  margin-right: 16px;
`

const ActionMenuText = styled.Text`
  font-size: 17px;
  color: ${(props) => (props.destructive ? '#dc2626' : '#1e293b')};
  font-weight: 600;
  flex: 1;
`

const MenuDivider = styled.View`
  height: 1px;
  background-color: #f1f5f9;
  margin: 0 24px;
`

const ActionMenuCancel = styled.TouchableOpacity`
  padding: 18px 24px;
  align-items: center;
  background-color: #f8f9fa;
  margin-top: 8px;
  border-radius: 20px;
  margin: 8px 16px 0;
`

const ActionMenuCancelText = styled.Text`
  font-size: 17px;
  color: #64748b;
  font-weight: 700;
`

/* =================== Web Dropdown Styles =================== */
const DropdownOverlay = styled.View`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999999;
  pointer-events: auto;
`

const DropdownBackdrop = styled.TouchableOpacity`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: transparent;
`

const DropdownMenu = styled.View`
  position: fixed;
  background-color: white;
  border-radius: 12px;
  min-width: 180px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  box-shadow: 0px 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 1000000;
`

const DropdownItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 14px 18px;
  gap: 12px;
  background-color: ${(props) => (props.destructive ? 'white' : 'white')};

  &:hover {
    background-color: ${(props) => (props.destructive ? '#fef2f2' : '#f9fafb')};
  }
`

const DropdownIconWrapper = styled.View`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: ${(props) => {
    if (props.destructive) return '#fee2e2'
    return '#dbeafe'
  }};
  align-items: center;
  justify-content: center;
`

const DropdownText = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: ${(props) => (props.destructive ? '#dc2626' : '#1e293b')};
  flex: 1;
`

const WebDivider = styled.View`
  height: 1px;
  background-color: #f3f4f6;
`

/* =================== Edit Modal Styles =================== */
const EditModalContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 20px;
`

const EditModalContent = styled.View`
  background-color: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  padding: 24px;
  elevation: 20;
  shadow-color: #000;
  shadow-offset: 0px 10px;
  shadow-opacity: 0.3;
  shadow-radius: 20px;
`

const EditModalHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`

const EditModalTitle = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
`

const CloseButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: #f1f5f9;
  align-items: center;
  justify-content: center;
`

const EditModalInputWrapper = styled.View`
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  margin-bottom: 20px;
  overflow: hidden;
`

const EditModalInput = styled.TextInput`
  padding: 16px;
  font-size: 16px;
  color: #1e293b;
  min-height: 120px;
  max-height: 200px;
`

const CharacterCount = styled.Text`
  font-size: 12px;
  color: #64748b;
  text-align: right;
  padding: 0 16px 12px;
`

const EditModalActions = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  gap: 12px;
`

const EditModalButton = styled.TouchableOpacity`
  padding: 14px 28px;
  border-radius: 12px;
  background-color: ${(props) => (props.primary ? '#3b82f6' : '#f1f5f9')};
  min-width: 100px;
  align-items: center;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
  shadow-color: ${(props) => (props.primary ? '#3b82f6' : 'transparent')};
  shadow-offset: 0px 4px;
  shadow-opacity: ${(props) => (props.primary ? 0.3 : 0)};
  shadow-radius: 8px;
  elevation: ${(props) => (props.primary ? 4 : 0)};
`

const EditModalButtonText = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: ${(props) => (props.primary ? '#fff' : '#64748b')};
`

/* =================== Exported Styled Components =================== */
export const ThreeDotsButton = styled.TouchableOpacity`
  padding: 8px;
  border-radius: 8px;
  background-color: ${(props) => (props.visible ? '#f1f5f9' : 'transparent')};
  opacity: ${(props) => (props.visible ? 1 : 0)};
  transition: all 0.2s;
  z-index: 10000;
`

export const MessageEditedLabel = styled.Text`
  font-size: 11px;
  color: ${(props) => (props.isOwn ? 'rgba(255, 255, 255, 0.7)' : '#94a3b8')};
  font-style: italic;
  margin-left: 6px;
  font-weight: 500;
`

/* =================== Component: MessageActionMenu =================== */
export const MessageActionMenu = ({ visible, onClose, onEdit, onDelete }) => {
  if (Platform.OS === 'web') return null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <ActionMenuOverlay activeOpacity={1} onPress={onClose}>
        <ActionMenuContainer>
          <ActionMenuItem onPress={onEdit}>
            <ActionIconWrapper>
              <Ionicons name="pencil" size={20} color="#3b82f6" />
            </ActionIconWrapper>
            <ActionMenuText>Edit Message</ActionMenuText>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </ActionMenuItem>

          <MenuDivider />

          <ActionMenuItem destructive onPress={onDelete}>
            <ActionIconWrapper destructive>
              <Ionicons name="trash" size={20} color="#dc2626" />
            </ActionIconWrapper>
            <ActionMenuText destructive>Delete Message</ActionMenuText>
            <Ionicons name="chevron-forward" size={20} color="#fca5a5" />
          </ActionMenuItem>
        </ActionMenuContainer>

        <ActionMenuCancel onPress={onClose}>
          <ActionMenuCancelText>Cancel</ActionMenuCancelText>
        </ActionMenuCancel>
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
  useEffect(() => {
    console.log('WebMessageDropdown State:', {
      visible,
      position,
      platform: Platform.OS,
    })
  }, [visible, position])

  if (Platform.OS !== 'web' || !visible) return null

  const menuWidth = 180
  const menuHeight = 110
  const padding = 10

  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 800
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 600

  const rawX = position?.x || 0
  const rawY = position?.y || 0

  const safeX = Math.max(
    padding,
    Math.min(rawX, windowWidth - menuWidth - padding)
  )
  const safeY = Math.max(
    padding,
    Math.min(rawY, windowHeight - menuHeight - padding)
  )

  return (
    <DropdownOverlay pointerEvents="auto">
      <DropdownBackdrop onPress={onClose} activeOpacity={1} />
      <DropdownMenu
        style={{
          left: safeX,
          top: safeY,
        }}
      >
        <DropdownItem onPress={onEdit}>
          <DropdownIconWrapper>
            <Ionicons name="pencil" size={18} color="#3b82f6" />
          </DropdownIconWrapper>
          <DropdownText>Edit</DropdownText>
        </DropdownItem>

        <WebDivider />

        <DropdownItem destructive onPress={onDelete}>
          <DropdownIconWrapper destructive>
            <Ionicons name="trash" size={18} color="#dc2626" />
          </DropdownIconWrapper>
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
  const [editedContent, setEditedContent] = useState(initialContent || '')
  const maxLength = 1000

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
    editedContent.trim() === (initialContent || '').trim() ||
    editedContent.length > maxLength

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
            <CloseButton onPress={onClose} disabled={saving}>
              <Ionicons name="close" size={20} color="#64748b" />
            </CloseButton>
          </EditModalHeader>

          <EditModalInputWrapper>
            <EditModalInput
              value={editedContent}
              onChangeText={setEditedContent}
              placeholder="Enter message..."
              placeholderTextColor="#94a3b8"
              multiline
              autoFocus
              editable={!saving}
              textAlignVertical="top"
              maxLength={maxLength}
            />
            <CharacterCount>
              {editedContent.length}/{maxLength}
            </CharacterCount>
          </EditModalInputWrapper>

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
                {saving ? 'Saving...' : 'Save Changes'}
              </EditModalButtonText>
            </EditModalButton>
          </EditModalActions>
        </EditModalContent>
      </EditModalContainer>
    </Modal>
  )
}
