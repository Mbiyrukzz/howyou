import React from 'react'
import { View } from 'react-native'
import { AudioPlayer } from '../media/AudioPlayer'
import { FileAttachment } from '../media/FileAttachment'
import { ImageAttachment } from '../media/ImageAttachment'
import { VideoAttachment } from '../media/VideoAttachment'

export const MessageContent = ({
  message,
  isOwn,
  onImagePress,
  navigation,
}) => {
  if (!message.files || message.files.length === 0) return null

  return (
    <View>
      {message.files.map((file, index) => {
        // Audio - Enhanced with better wave visualization
        if (message.type === 'audio' || file.type === 'audio') {
          return (
            <AudioPlayer
              key={`audio-${index}`}
              audioUrl={file.url}
              isOwn={isOwn}
              duration={file.duration}
            />
          )
        }

        // Video - Now with duration badge and type indicator
        if (message.type === 'video' && file.url) {
          return (
            <VideoAttachment
              key={`video-${index}`}
              videoUrl={file.url}
              hasText={!!(message.content && message.content.trim())}
              duration={file.duration}
              onPress={() =>
                navigation.navigate('VideoPlayer', { videoUrl: file.url })
              }
            />
          )
        }

        // Image - Enhanced with tap to view badge
        if (message.type === 'image' && file.url) {
          return (
            <ImageAttachment
              key={`image-${index}`}
              imageUrl={file.url}
              hasText={!!(message.content && message.content.trim())}
              onPress={onImagePress}
            />
          )
        }

        // File - Now shows file size and extension
        if (message.type === 'file' && file.url) {
          return (
            <FileAttachment
              key={`file-${index}`}
              fileName={file.originalname || `File ${index + 1}`}
              fileSize={file.size}
              fileUrl={file.url} // ✅ Add this line
              isOwn={isOwn}
            />
          )
        }

        return null
      })}
    </View>
  )
}
