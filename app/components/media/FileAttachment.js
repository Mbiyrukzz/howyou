import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { MessageFile, FileIcon, FileText } from '../../styles/chatStyles'

export const FileAttachment = ({ fileName, isOwn }) => {
  return (
    <MessageFile isOwn={isOwn}>
      <FileIcon name="document" size={20} color={isOwn ? '#fff' : '#2c3e50'} />
      <FileText isOwn={isOwn}>{fileName}</FileText>
    </MessageFile>
  )
}
