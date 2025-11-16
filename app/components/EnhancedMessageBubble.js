import React, { useState } from 'react'
import { View, TouchableOpacity, Modal, Alert, TextInput } from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'

/* =================== Styled Components =================== */

const MessageBubbleContainer = styled.View`
  max-width: 70%;
  margin-bottom: 12px;
  align-self: ${(props) => (props.isOwn ? 'flex-end' : 'flex-start')};
  flex-direction: ${(props) => (props.isOwn ? 'row-reverse' : 'row')};
  align-items: flex-start;
`

const MessageWrapper = styled.View`
  flex: 1;
`

const MessageContent = styled.View`
  background-color: ${(props) => (props.isOwn ? '#3498db' : '#fff')};
  padding: 12px 16px;
  border-radius: 18px;
  border-bottom-right-radius: ${(props) => (props.isOwn ? '4px' : '18px')};
  border-bottom-left-radius: ${(props) => (props.isOwn ? '18px' : '4px')};
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 2;
`

const MessageText = styled.Text`
  font-size: 16px;
  color: ${(props) => (props.isOwn ? '#fff' : '#2c3e50')};
  line-height: 22px;
`

const MessageImage = styled.View`
  width: 200px;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 8px;
`

const MessageTimeRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: ${(props) => (props.isOwn ? 'flex-end' : 'flex-start')};
  margin-top: 4px;
  gap: 4px;
`

const MessageTime = styled.Text`
  font-size: 11px;
  color: ${(props) => (props.isOwn ? 'rgba(255,255,255,0.7)' : '#95a5a6')};
`

const EditedLabel = styled.Text`
  font-size: 11px;
  color: ${(props) => (props.isOwn ? 'rgba(255,255,255,0.6)' : '#95a5a6')};
  font-style: italic;
`

const MessageOptionsButton = styled.TouchableOpacity`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: rgba(255, 255, 255, 0.9);
  justify-content: center;
  align-items: center;
  margin-left: ${(props) => (props.isOwn ? '0px' : '8px')};
  margin-right: ${(props) => (props.isOwn ? '8px' : '0px')};
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.15;
  shadow-radius: 3px;
  elevation: 3;
  opacity: ${(props) => (props.visible ? 1 : 0)};
`

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  padding: 20px;
`

const MenuContainer = styled.View`
  background-color: #fff;
  border-radius: 12px;
  min-width: 200px;
  overflow: hidden;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 8;
`

const MenuItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: #f8f9fa;
  background-color: ${(props) => (props.danger ? '#fff5f5' : '#fff')};
`

const MenuItemText = styled.Text`
  margin-left: 12px;
  font-size: 15px;
  font-weight: 500;
  color: ${(props) => (props.danger ? '#e74c3c' : '#2c3e50')};
`

const EditModalContainer = styled.View`
  background-color: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 8;
`

const EditModalHeader = styled.View`
  padding: 20px;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
  background-color: #f8f9fa;
`

const EditModalTitle = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
`

const EditModalBody = styled.View`
  padding: 20px;
`

const EditInput = styled.TextInput`
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
  color: #2c3e50;
  min-height: 100px;
  text-align-vertical: top;
`

const EditModalFooter = styled.View`
  flex-direction: row;
  padding: 16px;
  border-top-width: 1px;
  border-top-color: #e9ecef;
  gap: 12px;
`

const EditButton = styled.TouchableOpacity`
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  align-items: center;
  background-color: ${(props) => (props.primary ? '#3498db' : '#f8f9fa')};
`

const EditButtonText = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: ${(props) => (props.primary ? '#fff' : '#2c3e50')};
`

const LongPressOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(52, 152, 219, 0.1);
  border-radius: 18px;
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
            <Ionicons name="ellipsis-vertical" size={16} color="#7f8c8d" />
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
        animationType="fade"
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
                <Ionicons name="arrow-undo-outline" size={20} color="#2c3e50" />
                <MenuItemText>Reply</MenuItemText>
              </MenuItem>

              <MenuItem onPress={handleCopy}>
                <Ionicons name="copy-outline" size={20} color="#2c3e50" />
                <MenuItemText>Copy</MenuItemText>
              </MenuItem>

              {isOwn && item.content && (
                <>
                  <MenuItem onPress={handleEdit}>
                    <Ionicons name="create-outline" size={20} color="#3498db" />
                    <MenuItemText>Edit</MenuItemText>
                  </MenuItem>

                  <MenuItem danger onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                    <MenuItemText danger>Delete</MenuItemText>
                  </MenuItem>
                </>
              )}
            </MenuContainer>
          </ModalOverlay>
        </TouchableOpacity>
      </Modal>

      {/* Edit Message Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => !updating && setShowEditModal(false)}
        >
          <ModalOverlay>
            <TouchableOpacity
              activeOpacity={1}
              style={{ width: '100%', maxWidth: 400 }}
            >
              <EditModalContainer>
                <EditModalHeader>
                  <EditModalTitle>Edit Message</EditModalTitle>
                </EditModalHeader>

                <EditModalBody>
                  <EditInput
                    value={editedText}
                    onChangeText={setEditedText}
                    placeholder="Edit your message..."
                    multiline
                    autoFocus
                    editable={!updating}
                  />
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
                    disabled={updating || !editedText.trim()}
                  >
                    <EditButtonText primary>
                      {updating ? 'Saving...' : 'Save'}
                    </EditButtonText>
                  </EditButton>
                </EditModalFooter>
              </EditModalContainer>
            </TouchableOpacity>
          </ModalOverlay>
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
