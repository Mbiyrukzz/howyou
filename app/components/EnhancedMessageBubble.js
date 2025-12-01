import React, { useState } from 'react'
import { View, TouchableOpacity, Modal, Alert, TextInput } from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'

/* =================== Styled Components =================== */

const MessageBubbleContainer = styled.View`
  max-width: 75%;
  margin-bottom: 12px;
  align-self: ${(props) => (props.isOwn ? 'flex-end' : 'flex-start')};
  flex-direction: ${(props) => (props.isOwn ? 'row-reverse' : 'row')};
  align-items: flex-start;
`

const MessageWrapper = styled.View`
  flex: 1;
`

const MessageContent = styled.View`
  background-color: ${(props) => (props.isOwn ? '#3b82f6' : '#fff')};
  padding: 14px 16px;
  border-radius: 20px;
  border-bottom-right-radius: ${(props) => (props.isOwn ? '6px' : '20px')};
  border-bottom-left-radius: ${(props) => (props.isOwn ? '20px' : '6px')};
  shadow-color: ${(props) => (props.isOwn ? '#3b82f6' : '#000')};
  shadow-offset: 0px 2px;
  shadow-opacity: ${(props) => (props.isOwn ? 0.25 : 0.08)};
  shadow-radius: 8px;
  elevation: 3;
  border-width: ${(props) => (props.isOwn ? 0 : 1)}px;
  border-color: #e2e8f0;
`

const MessageText = styled.Text`
  font-size: 16px;
  color: ${(props) => (props.isOwn ? '#fff' : '#1e293b')};
  line-height: 22px;
  font-weight: 500;
`

const MessageImage = styled.View`
  width: 220px;
  height: 220px;
  border-radius: 16px;
  overflow: hidden;
  margin-top: 8px;
`

const MessageTimeRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: ${(props) => (props.isOwn ? 'flex-end' : 'flex-start')};
  margin-top: 6px;
  gap: 6px;
`

const MessageTime = styled.Text`
  font-size: 12px;
  font-weight: 500;
  color: ${(props) => (props.isOwn ? 'rgba(255,255,255,0.75)' : '#64748b')};
`

const EditedLabel = styled.Text`
  font-size: 11px;
  color: ${(props) => (props.isOwn ? 'rgba(255,255,255,0.7)' : '#94a3b8')};
  font-style: italic;
  font-weight: 500;
`

const MessageOptionsButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: #f1f5f9;
  justify-content: center;
  align-items: center;
  margin-left: ${(props) => (props.isOwn ? '0px' : '8px')};
  margin-right: ${(props) => (props.isOwn ? '8px' : '0px')};
  shadow-color: #64748b;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.15;
  shadow-radius: 4px;
  elevation: 2;
  opacity: ${(props) => (props.visible ? 1 : 0)};
`

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.6);
  justify-content: flex-end;
  padding-bottom: 20px;
`

const MenuContainer = styled.View`
  background-color: #fff;
  border-radius: 20px;
  margin: 0 16px;
  overflow: hidden;
  shadow-color: #000;
  shadow-offset: 0px -4px;
  shadow-opacity: 0.2;
  shadow-radius: 12px;
  elevation: 10;
`

const MenuItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 18px 24px;
  background-color: #fff;
`

const MenuIconWrapper = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${(props) => {
    if (props.danger) return '#fee2e2'
    if (props.primary) return '#dbeafe'
    return '#f1f5f9'
  }};
  align-items: center;
  justify-content: center;
  margin-right: 16px;
`

const MenuItemText = styled.Text`
  font-size: 17px;
  font-weight: 600;
  color: ${(props) => {
    if (props.danger) return '#dc2626'
    if (props.primary) return '#3b82f6'
    return '#1e293b'
  }};
  flex: 1;
`

const MenuDivider = styled.View`
  height: 1px;
  background-color: #f1f5f9;
  margin: 0 24px;
`

const MenuCancel = styled.TouchableOpacity`
  padding: 18px 24px;
  align-items: center;
  background-color: #f8f9fa;
  margin-top: 8px;
  border-radius: 20px;
  margin: 8px 16px 0;
`

const MenuCancelText = styled.Text`
  font-size: 17px;
  color: #64748b;
  font-weight: 700;
`

const EditModalContainer = styled.View`
  background-color: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  overflow: hidden;
  shadow-color: #000;
  shadow-offset: 0px 10px;
  shadow-opacity: 0.3;
  shadow-radius: 20px;
  elevation: 20;
  margin: 0 20px;
`

const EditModalHeader = styled.View`
  padding: 24px;
  border-bottom-width: 1px;
  border-bottom-color: #e2e8f0;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
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

const EditModalBody = styled.View`
  padding: 20px;
`

const EditInputWrapper = styled.View`
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  overflow: hidden;
`

const EditInput = styled.TextInput`
  padding: 16px;
  font-size: 16px;
  color: #1e293b;
  min-height: 120px;
  text-align-vertical: top;
  font-weight: 500;
`

const CharacterCount = styled.Text`
  font-size: 12px;
  color: #64748b;
  text-align: right;
  padding: 0 16px 12px;
  font-weight: 500;
`

const EditModalFooter = styled.View`
  flex-direction: row;
  padding: 20px;
  border-top-width: 1px;
  border-top-color: #e2e8f0;
  gap: 12px;
`

const EditButton = styled.TouchableOpacity`
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  align-items: center;
  background-color: ${(props) => (props.primary ? '#3b82f6' : '#f1f5f9')};
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
  shadow-color: ${(props) => (props.primary ? '#3b82f6' : 'transparent')};
  shadow-offset: 0px 4px;
  shadow-opacity: ${(props) => (props.primary ? 0.3 : 0)};
  shadow-radius: 8px;
  elevation: ${(props) => (props.primary ? 4 : 0)};
`

const EditButtonText = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: ${(props) => (props.primary ? '#fff' : '#64748b')};
`

const LongPressOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(59, 130, 246, 0.15);
  border-radius: 20px;
`

/* =================== Enhanced Message Component =================== */

export const EnhancedMessageBubble = ({
  item,
  currentUser,
  onUpdateMessage,
  onDeleteMessage,
  formatMessageTime,
  Image,
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editedText, setEditedText] = useState(item.content || '')
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [buttonVisible, setButtonVisible] = useState(false)

  const maxLength = 1000
  const isOwn = item.senderId === currentUser?.uid
  const hasImage =
    item.files &&
    item.files.length > 0 &&
    item.files[0].mimetype?.startsWith('image/')

  const handleLongPress = () => {
    if (isOwn) {
      setShowOptions(true)
      setTimeout(() => setShowOptions(false), 200)
      setShowMenu(true)
    }
  }

  const handleEdit = () => {
    setShowMenu(false)
    setEditedText(item.content || '')
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!editedText.trim() || editedText === item.content) {
      setShowEditModal(false)
      return
    }

    setUpdating(true)
    try {
      const result = await onUpdateMessage(
        item._id || item.id,
        editedText.trim()
      )
      if (result.success) {
        setShowEditModal(false)
        Alert.alert('Success', 'Message updated successfully')
      } else {
        Alert.alert('Error', result.error || 'Failed to update message')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update message')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = () => {
    setShowMenu(false)
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true)
            try {
              const result = await onDeleteMessage(item._id || item.id)
              if (result.success) {
                // Message deleted successfully
              } else {
                Alert.alert('Error', result.error || 'Failed to delete message')
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete message')
            } finally {
              setDeleting(false)
            }
          },
        },
      ]
    )
  }

  const handleCopy = () => {
    setShowMenu(false)
    Alert.alert('Copied', 'Message copied to clipboard')
  }

  const handleReply = () => {
    setShowMenu(false)
    Alert.alert('Reply', 'Reply functionality coming soon!')
  }

  const handleOptionsPress = (e) => {
    e.stopPropagation()
    setShowMenu(true)
  }

  const isSaveDisabled =
    updating ||
    !editedText.trim() ||
    editedText.trim() === (item.content || '').trim() ||
    editedText.length > maxLength

  return (
    <>
      <MessageBubbleContainer
        isOwn={isOwn}
        onMouseEnter={() => isOwn && setButtonVisible(true)}
        onMouseLeave={() => setButtonVisible(false)}
      >
        {isOwn && (
          <MessageOptionsButton
            isOwn={isOwn}
            onPress={handleOptionsPress}
            visible={buttonVisible}
          >
            <Ionicons name="ellipsis-vertical" size={18} color="#64748b" />
          </MessageOptionsButton>
        )}

        <MessageWrapper>
          <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={handleLongPress}
            delayLongPress={500}
            disabled={deleting}
          >
            {showOptions && <LongPressOverlay />}

            <MessageContent isOwn={isOwn}>
              {item.content && (
                <MessageText isOwn={isOwn}>{item.content}</MessageText>
              )}
              {hasImage && (
                <MessageImage>
                  <Image
                    source={{ uri: item.files[0].url }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                </MessageImage>
              )}
            </MessageContent>

            <MessageTimeRow isOwn={isOwn}>
              <MessageTime isOwn={isOwn}>
                {formatMessageTime(item.createdAt)}
              </MessageTime>
              {item.edited && <EditedLabel isOwn={isOwn}>(edited)</EditedLabel>}
            </MessageTimeRow>
          </TouchableOpacity>
        </MessageWrapper>
      </MessageBubbleContainer>

      {/* Options Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <ModalOverlay>
            <MenuContainer>
              <MenuItem onPress={handleReply}>
                <MenuIconWrapper>
                  <Ionicons name="arrow-undo" size={20} color="#64748b" />
                </MenuIconWrapper>
                <MenuItemText>Reply</MenuItemText>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </MenuItem>

              <MenuDivider />

              <MenuItem onPress={handleCopy}>
                <MenuIconWrapper>
                  <Ionicons name="copy" size={20} color="#64748b" />
                </MenuIconWrapper>
                <MenuItemText>Copy</MenuItemText>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </MenuItem>

              {isOwn && item.content && (
                <>
                  <MenuDivider />

                  <MenuItem onPress={handleEdit}>
                    <MenuIconWrapper primary>
                      <Ionicons name="pencil" size={20} color="#3b82f6" />
                    </MenuIconWrapper>
                    <MenuItemText primary>Edit</MenuItemText>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#93c5fd"
                    />
                  </MenuItem>

                  <MenuDivider />

                  <MenuItem onPress={handleDelete}>
                    <MenuIconWrapper danger>
                      <Ionicons name="trash" size={20} color="#dc2626" />
                    </MenuIconWrapper>
                    <MenuItemText danger>Delete</MenuItemText>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#fca5a5"
                    />
                  </MenuItem>
                </>
              )}
            </MenuContainer>

            <MenuCancel onPress={() => setShowMenu(false)}>
              <MenuCancelText>Cancel</MenuCancelText>
            </MenuCancel>
          </ModalOverlay>
        </TouchableOpacity>
      </Modal>

      {/* Edit Message Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => !updating && setShowEditModal(false)}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => !updating && setShowEditModal(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
            }}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={{ width: '100%', maxWidth: 500 }}
            >
              <EditModalContainer>
                <EditModalHeader>
                  <EditModalTitle>Edit Message</EditModalTitle>
                  <CloseButton
                    onPress={() => !updating && setShowEditModal(false)}
                    disabled={updating}
                  >
                    <Ionicons name="close" size={20} color="#64748b" />
                  </CloseButton>
                </EditModalHeader>

                <EditModalBody>
                  <EditInputWrapper>
                    <EditInput
                      value={editedText}
                      onChangeText={setEditedText}
                      placeholder="Edit your message..."
                      placeholderTextColor="#94a3b8"
                      multiline
                      autoFocus
                      editable={!updating}
                      maxLength={maxLength}
                    />
                    <CharacterCount>
                      {editedText.length}/{maxLength}
                    </CharacterCount>
                  </EditInputWrapper>
                </EditModalBody>

                <EditModalFooter>
                  <EditButton
                    onPress={() => setShowEditModal(false)}
                    disabled={updating}
                  >
                    <EditButtonText>Cancel</EditButtonText>
                  </EditButton>
                  <EditButton
                    primary
                    onPress={handleSaveEdit}
                    disabled={isSaveDisabled}
                  >
                    <EditButtonText primary>
                      {updating ? 'Saving...' : 'Save Changes'}
                    </EditButtonText>
                  </EditButton>
                </EditModalFooter>
              </EditModalContainer>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

/* =================== Default Props =================== */
EnhancedMessageBubble.defaultProps = {
  formatMessageTime: (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  },
}
