import React from 'react'
import { View, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  InputContainer,
  InputWrapper,
  TextInput,
  SendButton,
  AttachmentButton,
  CameraButton,
  MicrophoneButton,
  SelectedFilesContainer,
  SelectedFileChip,
  SelectedFileText,
  RemoveFileButton,
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
  selectedFiles = [],
  onRemoveFile,
}) => {
  const canSend = (message.trim() || hasFiles) && !sending

  // Get file name from file object or URI
  const getFileName = (file) => {
    if (file.name) return file.name
    if (file.uri) {
      const parts = file.uri.split('/')
      return parts[parts.length - 1]
    }
    return 'File'
  }

  // Truncate file name if too long
  const truncateFileName = (name, maxLength = 20) => {
    if (name.length <= maxLength) return name
    const ext = name.split('.').pop()
    const nameWithoutExt = name.substring(0, name.lastIndexOf('.'))
    const truncated = nameWithoutExt.substring(0, maxLength - ext.length - 4)
    return `${truncated}...${ext}`
  }

  return (
    <View>
      {/* Selected Files Preview */}
      {selectedFiles && selectedFiles.length > 0 && (
        <SelectedFilesContainer>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 8 }}
          >
            {selectedFiles.map((file, index) => (
              <SelectedFileChip key={index}>
                <Ionicons
                  name={
                    file.type?.startsWith('image')
                      ? 'image'
                      : file.type?.startsWith('video')
                      ? 'videocam'
                      : 'document'
                  }
                  size={14}
                  color="white"
                />
                <SelectedFileText numberOfLines={1}>
                  {truncateFileName(getFileName(file))}
                </SelectedFileText>
                <RemoveFileButton
                  onPress={() => onRemoveFile && onRemoveFile(index)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={12} color="white" />
                </RemoveFileButton>
              </SelectedFileChip>
            ))}
          </ScrollView>
        </SelectedFilesContainer>
      )}

      {/* Input Container */}
      <InputContainer>
        <CameraButton onPress={onCamera} activeOpacity={0.7}>
          <Ionicons name="camera" size={22} color="#64748b" />
        </CameraButton>

        <AttachmentButton onPress={onAttach} activeOpacity={0.7}>
          <Ionicons name="attach" size={22} color="#64748b" />
        </AttachmentButton>

        <InputWrapper>
          <TextInput
            value={message}
            onChangeText={onMessageChange}
            onBlur={onBlur}
            placeholder="Type a message..."
            placeholderTextColor="#94a3b8"
            multiline
            maxLength={5000}
            textAlignVertical="center"
            editable={!sending}
          />
        </InputWrapper>

        {message.trim() || hasFiles ? (
          <SendButton disabled={!canSend} onPress={onSend} activeOpacity={0.8}>
            <Ionicons
              name={sending ? 'hourglass-outline' : 'send'}
              size={20}
              color="#fff"
            />
          </SendButton>
        ) : (
          <MicrophoneButton onPress={onMicrophone} activeOpacity={0.7}>
            <Ionicons name="mic" size={22} color="#ef4444" />
          </MicrophoneButton>
        )}
      </InputContainer>
    </View>
  )
}
