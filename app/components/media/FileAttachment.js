import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { MessageFile, FileIcon, FileText } from '../../styles/chatStyles'
import styled from 'styled-components/native'

// Enhanced File Component with additional info
const FileContainer = styled.View`
  flex-direction: column;
`

const FileInfo = styled.View`
  flex: 1;
  flex-direction: column;
`

const FileName = styled.Text`
  font-size: 14px;
  font-weight: 700;
  color: ${(props) => (props.isOwn ? '#fff' : '#1e293b')};
  margin-bottom: 4px;
`

const FileMetadata = styled.View`
  flex-direction: row;
  align-items: center;
`

const FileSize = styled.Text`
  font-size: 12px;
  font-weight: 500;
  color: ${(props) => (props.isOwn ? 'rgba(255, 255, 255, 0.75)' : '#64748b')};
`

const FileDivider = styled.Text`
  font-size: 12px;
  color: ${(props) => (props.isOwn ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8')};
  margin: 0 6px;
`

const FileExtension = styled.Text`
  font-size: 12px;
  font-weight: 700;
  color: ${(props) => (props.isOwn ? 'rgba(255, 255, 255, 0.9)' : '#3b82f6')};
  text-transform: uppercase;
`

const DownloadIcon = styled.View`
  margin-left: 8px;
`

export const FileAttachment = ({ fileName, fileSize, isOwn, onPress }) => {
  // Format file size from bytes to readable format
  const formatFileSize = (bytes) => {
    if (!bytes) return null
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Extract file extension from filename
  const getFileExtension = (name) => {
    if (!name) return 'FILE'
    const parts = name.split('.')
    return parts.length > 1 ? parts[parts.length - 1] : 'FILE'
  }

  // Get icon based on file type
  const getFileIcon = (name) => {
    if (!name) return 'document-text'
    const ext = name.split('.').pop()?.toLowerCase()

    // Document types
    if (['pdf'].includes(ext)) return 'document-text'
    if (['doc', 'docx'].includes(ext)) return 'document-text'
    if (['xls', 'xlsx'].includes(ext)) return 'stats-chart'
    if (['ppt', 'pptx'].includes(ext)) return 'easel'

    // Archive types
    if (['zip', 'rar', '7z'].includes(ext)) return 'archive'

    // Code types
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp'].includes(ext))
      return 'code-slash'

    // Text types
    if (['txt', 'md'].includes(ext)) return 'document-outline'

    return 'document-text'
  }

  const formattedSize = formatFileSize(fileSize)
  const extension = getFileExtension(fileName)
  const iconName = getFileIcon(fileName)

  return (
    <MessageFile isOwn={isOwn} onPress={onPress} activeOpacity={0.7}>
      <FileIcon isOwn={isOwn}>
        <Ionicons
          name={iconName}
          size={22}
          color={isOwn ? '#fff' : '#3b82f6'}
        />
      </FileIcon>

      <FileInfo>
        <FileName isOwn={isOwn} numberOfLines={1}>
          {fileName || 'Unnamed File'}
        </FileName>
        {(formattedSize || extension !== 'FILE') && (
          <FileMetadata>
            {formattedSize && (
              <FileSize isOwn={isOwn}>{formattedSize}</FileSize>
            )}
            {formattedSize && extension !== 'FILE' && (
              <FileDivider isOwn={isOwn}>•</FileDivider>
            )}
            {extension !== 'FILE' && (
              <FileExtension isOwn={isOwn}>{extension}</FileExtension>
            )}
          </FileMetadata>
        )}
      </FileInfo>

      <DownloadIcon>
        <Ionicons
          name="download-outline"
          size={20}
          color={isOwn ? 'rgba(255, 255, 255, 0.75)' : '#64748b'}
        />
      </DownloadIcon>
    </MessageFile>
  )
}
