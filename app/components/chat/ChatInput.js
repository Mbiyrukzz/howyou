import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import {
  InputContainer,
  InputWrapper,
  TextInput,
  SendButton,
  AttachmentButton,
  CameraButton,
} from '../../styles/chatStyles'

export const ChatInput = ({
  message,
  onMessageChange,
  onBlur,
  onSend,
  onCamera,
  onAttach,
  onMicrophone,
  sending,
  hasFiles,
}) => {
  return (
    <InputContainer>
      <CameraButton onPress={onCamera}>
        <Ionicons name="camera" size={24} color="#7f8c8d" />
      </CameraButton>
      <AttachmentButton onPress={onAttach}>
        <Ionicons name="attach" size={24} color="#7f8c8d" />
      </AttachmentButton>
      <AttachmentButton onPress={onMicrophone}>
        <Ionicons name="mic" size={24} color="#e74c3c" />
      </AttachmentButton>
      <InputWrapper>
        <TextInput
          value={message}
          onChangeText={onMessageChange}
          onBlur={onBlur}
          placeholder="Type a message..."
          placeholderTextColor="#bdc3c7"
          multiline
          textAlignVertical="center"
          editable={!sending}
        />
      </InputWrapper>
      <SendButton
        disabled={(!message.trim() && !hasFiles) || sending}
        onPress={onSend}
      >
        <Ionicons
          name={sending ? 'hourglass' : 'send'}
          size={20}
          color="#fff"
        />
      </SendButton>
    </InputContainer>
  )
}
