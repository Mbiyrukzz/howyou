import React from 'react'
import { Alert, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { File, Paths } from 'expo-file-system'
import { MessageFile, FileIcon } from '../../styles/chatStyles'
import styled from 'styled-components/native'

// Styled components (same as before)
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

const DownloadIcon = styled.TouchableOpacity`
  margin-left: 8px;
`

export const FileAttachment = ({
  fileName,
  fileSize,
  isOwn,
  fileUrl,
  onPress,
}) => {
  const [isDownloading, setIsDownloading] = React.useState(false)

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

  // Function to download and save file using new expo-file-system API
  const downloadFile = async () => {
    if (!fileUrl) {
      Alert.alert('Error', 'File URL is missing')
      return
    }

    setIsDownloading(true)

    try {
      // Create a filename
      const originalFileName = fileName || `file_${Date.now()}`
      const fileExtension = getFileExtension(originalFileName)
      const finalFileName = `${
        originalFileName.split('.')[0]
      }_${Date.now()}.${fileExtension}`

      console.log('📥 Starting download:', {
        from: fileUrl,
        fileName: finalFileName,
      })

      // Platform-specific handling
      if (Platform.OS === 'web') {
        // For web: Create a download link
        const link = document.createElement('a')
        link.href = fileUrl
        link.download = finalFileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        Alert.alert('Success', 'File download started')
      } else {
        // For iOS/Android: Use new File API
        const downloadPath = Paths.document + '/' + finalFileName
        const file = new File(downloadPath)

        console.log('Downloading to:', downloadPath)

        // Download the file
        await file.create()
        const response = await fetch(fileUrl)

        if (!response.ok) {
          throw new Error(`Download failed with status: ${response.status}`)
        }

        const blob = await response.blob()
        await file.write(blob)

        console.log('✅ Download completed:', downloadPath)

        // Show success message
        Alert.alert('Download Complete', `File saved: ${finalFileName}`, [
          {
            text: 'OK',
            style: 'default',
          },
        ])
      }
    } catch (error) {
      console.error('❌ Download error:', error)
      Alert.alert('Download Failed', error.message || 'Failed to download file')
    } finally {
      setIsDownloading(false)
    }
  }

  const formattedSize = formatFileSize(fileSize)
  const extension = getFileExtension(fileName)
  const iconName = getFileIcon(fileName)

  // Combine onPress (if provided) with download functionality
  const handlePress = () => {
    if (onPress) {
      onPress()
    } else {
      downloadFile()
    }
  }

  return (
    <MessageFile isOwn={isOwn} onPress={handlePress} activeOpacity={0.7}>
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

      <DownloadIcon onPress={downloadFile} disabled={isDownloading}>
        {isDownloading ? (
          <Ionicons
            name="refresh"
            size={20}
            color={isOwn ? 'rgba(255, 255, 255, 0.75)' : '#64748b'}
          />
        ) : (
          <Ionicons
            name="download-outline"
            size={20}
            color={isOwn ? 'rgba(255, 255, 255, 0.75)' : '#64748b'}
          />
        )}
      </DownloadIcon>
    </MessageFile>
  )
}
