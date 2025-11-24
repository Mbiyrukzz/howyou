import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import {
  SelectedFilesContainer,
  SelectedFileChip,
  SelectedFileText,
  RemoveFileButton,
} from '../../styles/chatStyles'

export const SelectedFilesBar = ({ files, onRemoveFile }) => {
  if (files.length === 0) return null

  return (
    <SelectedFilesContainer>
      {files.map((file, index) => (
        <SelectedFileChip key={index}>
          <SelectedFileText numberOfLines={1}>{file.name}</SelectedFileText>
          <RemoveFileButton onPress={() => onRemoveFile(index)}>
            <Ionicons name="close" size={12} color="white" />
          </RemoveFileButton>
        </SelectedFileChip>
      ))}
    </SelectedFilesContainer>
  )
}
