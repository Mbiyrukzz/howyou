import React, { useState, useEffect } from 'react'
import styled from 'styled-components/native'
import {
  Modal,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
  Platform,
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
  width: 90%;
  max-width: 500px;
  padding: 24px;
  max-height: 80%;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 10;
`

const ModalHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`

const ModalTitle = styled.Text`
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
`

const ModalCloseButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: #f1f5f9;
  justify-content: center;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 2;
`

const TextInput = styled.TextInput`
  background-color: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  font-size: 16px;
  color: #1e293b;
  min-height: 120px;
  text-align-vertical: top;
  margin-bottom: 20px;
  border-width: 1px;
  border-color: #e2e8f0;
`

const ButtonRow = styled.View`
  flex-direction: row;
  gap: 12px;
`

const Button = styled.TouchableOpacity`
  flex: 1;
  padding: 16px;
  border-radius: 12px;
  background-color: ${(props) => (props.primary ? '#3b82f6' : '#f1f5f9')};
  align-items: center;
  justify-content: center;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: ${(props) => (props.primary ? 0.2 : 0.1)};
  shadow-radius: ${(props) => (props.primary ? 4 : 2)}px;
  elevation: ${(props) => (props.primary ? 3 : 1)};
`

const ButtonText = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => (props.primary ? '#fff' : '#64748b')};
`

export const EditPostModal = ({ visible, post, onClose, onSave }) => {
  const [content, setContent] = useState(post?.content || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (post) {
      setContent(post.content || '')
    }
  }, [post])

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Post content cannot be empty')
      return
    }

    setSaving(true)
    try {
      await onSave(content.trim())
      onClose()
    } catch (error) {
      Alert.alert('Error', 'Failed to update post')
    } finally {
      setSaving(false)
    }
  }

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
              <ModalHeader>
                <ModalTitle>Edit Post</ModalTitle>
                <ModalCloseButton onPress={onClose}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </ModalCloseButton>
              </ModalHeader>

              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="What's on your mind?"
                multiline
                maxLength={500}
                editable={!saving}
                placeholderTextColor="#94a3b8"
              />

              <ButtonRow>
                <Button onPress={onClose} disabled={saving}>
                  <ButtonText>Cancel</ButtonText>
                </Button>
                <Button primary onPress={handleSave} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <ButtonText primary>Save</ButtonText>
                  )}
                </Button>
              </ButtonRow>
            </ModalContent>
          </TouchableWithoutFeedback>
        </ModalOverlay>
      </TouchableWithoutFeedback>
    </Modal>
  )
}
